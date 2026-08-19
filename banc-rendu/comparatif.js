// La vue qui manquait : chaque photo confrontée à toutes les approches sur une seule ligne.
// Les planches par variante isolent une approche — on ne peut rien comparer avec elles.
import { pipeline } from './pipeline.js'

const VARIANTES = ['temoin', 'hybride-regions', 'saillance-contours', 'seuil-adaptatif', 'geodesique']
const mods = {}
for (const v of VARIANTES) mods[v] = await import(`./variantes/${v}.js`)

const noms = await fetch('./photos/manifest.json').then(r => r.json())
const t = document.createElement('table')
t.innerHTML = `<tr><th>photo</th>${VARIANTES.map(v => `<th>${v}</th>`).join('')}</tr>`
const collecte = []

for (const nom of noms) {
  const blob = await fetch('./photos/' + encodeURIComponent(nom)).then(r => r.blob())
  const cadre = await fetch('./photos/' + encodeURIComponent(nom) + '.cadre.json')
    .then(r => r.ok ? r.json() : null).catch(() => null)

  const tr = document.createElement('tr')
  const tdSrc = document.createElement('td')
  tdSrc.className = 'src'
  const url = URL.createObjectURL(blob)
  tdSrc.innerHTML = `<div class="cell"><img src="${url}" style="max-width:210px;max-height:210px"></div>
                     <div class="lg">${nom}</div>`
  tr.append(tdSrc)
  collecte.push({ photo: nom, variante: 'source', dataUrl: null })

  for (const v of VARIANTES) {
    const td = document.createElement('td')
    try {
      const r = await pipeline(blob, cadre?.machine_presente ? cadre.cadre : null, mods[v].masque)
      const c = document.createElement('canvas')
      c.width = r.gw; c.height = r.gh
      c.getContext('2d').drawImage(r.canvas, 0, 0)
      const k = Math.min(210 / r.gw, 210 / r.gh)
      c.style.width = Math.round(r.gw * k) + 'px'
      c.style.height = Math.round(r.gh * k) + 'px'
      const cell = document.createElement('div')
      cell.className = 'cell'
      cell.append(c)
      td.append(cell)
      const lg = document.createElement('div')
      lg.className = 'lg'
      lg.textContent = `${r.teintes.dominante}° · ${Math.round(r.ms)} ms`
      td.append(lg)
      collecte.push({ photo: nom, variante: v, dataUrl: c.toDataURL('image/png'),
                      teinte: r.teintes.dominante, ms: Math.round(r.ms) })
    } catch (e) {
      td.innerHTML = `<div class="cell" style="color:#FF5C5C">${e.message}</div>`
      collecte.push({ photo: nom, variante: v, dataUrl: null, echec: e.message })
    }
    tr.append(td)
  }
  t.append(tr)
}
document.getElementById('sortie').append(t)
window.__images = collecte
window.__pret = true
