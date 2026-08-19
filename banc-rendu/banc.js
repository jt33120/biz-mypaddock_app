// Le banc d'essai. Externalisé et non en ligne : la CSP de production interdit
// script-src 'unsafe-inline', donc un module en ligne serait bloqué une fois déployé —
// et le banc marcherait en local pour mourir précisément là où il sert.
import { pipeline, REGLAGES } from './pipeline.js'
// Chrome headless avance en TEMPS VIRTUEL : performance.now() saute jusqu'au budget.
// Un chrono mesuré là-dedans ne mesure rien. On l'étiquette plutôt que de le laisser mentir —
// le verdict de performance se rend en navigateur réel, sur appareil réel.
// Plus de temps virtuel : le banc est piloté par CDP et signale sa fin par window.__pret.
// Le chrono redevient donc vrai, même sans interface — à la réserve près que le verdict
// qui compte se rend sur l'iPhone, pas sur un Mac.
const virtuel = false
document.getElementById('reg').textContent = JSON.stringify(REGLAGES)
const grille = document.getElementById('grille')
// Le banc doit dire où il meurt. Sans ça on relance à l'aveugle.
const journal = document.getElementById('journal')
const noter = (m) => { journal.textContent += m + '\n' }
addEventListener('error', e => noter('ERREUR ' + e.message))
addEventListener('unhandledrejection', e => noter('REJET ' + (e.reason?.message ?? e.reason)))
const resultats = []

async function traiter(nom, blob, cadre) {
  const rangee = document.createElement('div')
  rangee.className = 'rangee'
  try {
    // Les deux rendus tournent sur la MÊME photo et les MÊMES réglages. La seule
    // différence est le cadre. C'est la comparaison qui décide si l'étape IA vaut son appel.
    const plein = await pipeline(blob)
    const recadre = cadre?.machine_presente ? await pipeline(blob, cadre.cadre) : null

    const src = document.createElement('canvas')
    src.width = plein.source.width; src.height = plein.source.height
    src.getContext('2d').drawImage(plein.source, 0, 0)

    const vue = (r) => {
      const c = document.createElement('canvas')
      c.width = r.gw; c.height = r.gh
      c.getContext('2d').drawImage(r.canvas, 0, 0)
      const k = Math.min(250 / r.gw, 250 / r.gh)
      c.style.width = Math.round(r.gw * k) + 'px'
      c.style.height = Math.round(r.gh * k) + 'px'
      return c
    }

    rangee.innerHTML = `
      <div><div class="etiq">source réduite</div><div class="vign"></div></div>
      <div><div class="etiq">cadre plein</div><div class="vign"></div></div>
      <div><div class="etiq">recadré par l'IA</div><div class="vign"></div></div>
      <div class="fiche">
        <div><b>${nom}</b></div>
        <div>plein : grille ${plein.gw}×${plein.gh} · teinte ${plein.teintes.dominante}°
             · force ${plein.teintes.force.toFixed(2)} · ${plein.ms.toFixed(0)} ms</div>
        <div>${recadre
          ? `recadré : grille ${recadre.gw}×${recadre.gh} · teinte ${recadre.teintes.dominante}°
             · force ${recadre.teintes.force.toFixed(2)} · ${recadre.ms.toFixed(0)} ms`
          : '<span class="ko">aucun cadre IA</span>'}</div>
        <div>${cadre ? `vue <b>${cadre.vue}</b> · pilote ${cadre.pilote_present ? 'oui' : 'non'}
             · cadre ${cadre.cadre.l.toFixed(2)}×${cadre.cadre.h.toFixed(2)}` : ''}</div>
        <div class="pal">${plein.palette.map(c => `<i style="background:rgb(${c})"></i>`).join('')}</div>
        ${recadre ? `<div class="pal">${recadre.palette.map(c => `<i style="background:rgb(${c})"></i>`).join('')}</div>` : ''}
      </div>`
    const cases = rangee.querySelectorAll('.vign')
    cases[0].append(src)
    cases[1].append(vue(plein))
    if (recadre) cases[2].append(vue(recadre))
    resultats.push({ nom, ms: plein.ms, msRecadre: recadre?.ms, vue: cadre?.vue })
  } catch (e) {
    rangee.innerHTML = `<div class="fiche ko">${nom} — ÉCHEC : ${e.message}</div>`
    resultats.push({ nom, echec: e.message })
  }
  grille.append(rangee)
}

const manifeste = await fetch('./photos/manifest.json').then(r => r.json()).catch(() => [])
for (const nom of manifeste) {
  noter('→ ' + nom)
  try {
    const blob = await fetch('./photos/' + encodeURIComponent(nom)).then(r => r.blob())
    // Le cadre est en cache sur disque : le rejeu est identique à l'octet et gratuit.
    const cadre = await fetch('./photos/' + encodeURIComponent(nom) + '.cadre.json')
      .then(r => r.ok ? r.json() : null).catch(() => null)
    await traiter(nom, blob, cadre)
  } catch (e) { noter('   ÉCHEC HORS PIPELINE : ' + e.message) }
}

const v = document.getElementById('verdict')
if (!manifeste.length) {
  v.innerHTML = `<b class="ko">Jeu d'essai vide.</b> Déposer les photos dans
    <code>banc-rendu/photos/</code> puis relancer <code>./banc-rendu/lancer.sh</code>.
    Le jeu doit contenir au minimum trois motos distinctes dont une qui n'est pas la tienne,
    un fond de paddock chargé, un contre-jour, un profil et un trois-quarts avant.`
} else {
  const echecs = resultats.filter(r => r.echec)
  const lents = resultats.filter(r => !r.echec && r.ms >= 1000)
  v.innerHTML = `<b>${resultats.length} photo(s) · réglages identiques pour toutes.</b><br>
    ${echecs.length ? `<span class="ko">${echecs.length} échec(s) de pipeline.</span>`
                    : `<span class="ok">Aucun échec de pipeline.</span>`}
    ${virtuel
      ? `<span class="ko">Chrono non rendu : temps virtuel headless.</span>
         Ouvrir <code>banc-rendu/index.html</code> dans un vrai navigateur pour la mesure,
         et sur l'iPhone pour le verdict qui compte.`
      : lents.length ? `<span class="ko">${lents.length} au-dessus de 1 s.</span>`
                     : `<span class="ok">Toutes sous 1 s.</span>`}<br>
    <b>Critères à juger à l'œil, énoncés avant de regarder :</b>
    les rayons sont-ils des rayons ? le disque de frein est-il perforé ?
    la silhouette est-elle reconnaissable de profil ? la montrerais-tu à un pote ?<br>
    <b>Critère de reproductibilité :</b> si une seule de ces lignes exigeait un réglage à la main,
    le pipeline est en échec — pas la photo.`
}
// Le sélecteur : c'est LUI qui sert sur l'iPhone. Le manifeste ne vit qu'en local ;
// déployé, la page démarre vide et Julian pousse ses photos depuis sa pellicule —
// ce qui donne le seul chrono qui compte, mesuré sur l'appareil cible.
document.getElementById('depot').addEventListener('change', async (e) => {
  const fichiers = [...e.target.files]
  if (!fichiers.length) return
  document.getElementById('verdict').innerHTML =
    `<b>${fichiers.length} photo(s) depuis l'appareil.</b> Cadre plein uniquement :
     le recadrage IA a besoin du serveur, il n'est pas encore branché ici.
     Le chrono, lui, est celui de cet appareil — c'est le verdict qui compte.`
  for (const f of fichiers) { noter('→ ' + f.name); await traiter(f.name, f, null) }
})

window.__pret = resultats
