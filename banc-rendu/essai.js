// Banc par variante. Rend, pour chaque photo du jeu : le recadré, le masque produit par la
// variante, et le rendu pixel détouré posé sur un damier — parce qu'un fond transparent doit
// se lire comme transparent, sinon on juge un aplat sombre pour un détourage réussi.
import { pipeline, REGLAGES } from './pipeline.js'

const chemin = new URLSearchParams(location.search).get('v')
const mod = await import('./' + chemin)
document.getElementById('titre').textContent = 'variante — ' + (mod.nom ?? chemin)
document.getElementById('desc').textContent =
  (mod.description ?? '') + '  ·  réglages : ' + JSON.stringify(REGLAGES)

const grille = document.getElementById('grille')
const res = []
const noms = await fetch('./photos/manifest.json').then(r => r.json())

const vue = (cv, gw, gh, taille = 230) => {
  const c = document.createElement('canvas')
  c.width = gw; c.height = gh
  c.getContext('2d').drawImage(cv, 0, 0)
  const k = Math.min(taille / gw, taille / gh)
  c.style.width = Math.round(gw * k) + 'px'
  c.style.height = Math.round(gh * k) + 'px'
  return c
}

for (const nom of noms) {
  const rangee = document.createElement('div')
  rangee.className = 'rangee'
  try {
    const blob = await fetch('./photos/' + encodeURIComponent(nom)).then(r => r.blob())
    const cadre = await fetch('./photos/' + encodeURIComponent(nom) + '.cadre.json')
      .then(r => r.ok ? r.json() : null).catch(() => null)

    // Le masque est capté au passage pour être montré tel quel : on juge la cause,
    // pas seulement l'effet.
    let vuMasque = null, largeur = 0, hauteur = 0, msMasque = 0
    const espion = (px, w, h) => {
      const t0 = performance.now()
      const m = mod.masque(px, w, h)
      msMasque = performance.now() - t0
      largeur = w; hauteur = h
      if (m?.length === w * h) {
        const c = new OffscreenCanvas(w, h), cx = c.getContext('2d')
        const img = cx.createImageData(w, h)
        for (let i = 0; i < w * h; i++) {
          const v = m[i] ? 235 : 18
          img.data[i * 4] = v; img.data[i * 4 + 1] = v; img.data[i * 4 + 2] = v
          img.data[i * 4 + 3] = 255
        }
        cx.putImageData(img, 0, 0)
        vuMasque = c
      }
      return m
    }

    const r = await pipeline(blob, cadre?.machine_presente ? cadre.cadre : null, espion)
    const couv = vuMasque ? null : 'masque invalide'

    rangee.innerHTML = `
      <div><div class="etiq">source réduite</div><div class="vign"></div></div>
      <div><div class="etiq">masque de la variante</div><div class="vign"></div></div>
      <div><div class="etiq">rendu détouré</div><div class="vign"></div></div>
      <div class="fiche">
        <div><b>${nom}</b></div>
        <div>grille ${r.gw}×${r.gh} · masque ${largeur}×${hauteur}</div>
        <div>teinte ${r.teintes.dominante}° · force ${r.teintes.force.toFixed(2)}</div>
        <div>masque ${msMasque.toFixed(1)} ms · total ${r.ms.toFixed(0)} ms</div>
        ${couv ? `<div class="ko">${couv}</div>` : ''}
        <div class="pal" style="display:flex;height:18px;max-width:300px">${
          r.palette.map(c => `<i style="flex:1;background:rgb(${c})"></i>`).join('')}</div>
      </div>`
    const cases = rangee.querySelectorAll('.vign')
    const src = document.createElement('canvas')
    src.width = r.source.width; src.height = r.source.height
    src.getContext('2d').drawImage(r.source, 0, 0)
    src.style.maxWidth = '230px'; src.style.maxHeight = '230px'
    src.style.width = 'auto'; src.style.height = 'auto'
    src.style.imageRendering = 'auto'
    cases[0].append(src)
    if (vuMasque) cases[1].append(vue(vuMasque, largeur, hauteur))
    cases[2].append(vue(r.canvas, r.gw, r.gh))
    res.push({ nom, msMasque, ms: r.ms, teinte: r.teintes.dominante })
  } catch (e) {
    rangee.innerHTML = `<div class="fiche ko"><b>${nom}</b> — ÉCHEC : ${e.message}</div>`
    res.push({ nom, echec: e.message })
  }
  grille.append(rangee)
}
window.__pret = res
