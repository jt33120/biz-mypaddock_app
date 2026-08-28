// La vidéo d'essai, fabriquée sur place — même principe que `photo-essai.mjs`.
//
// ⚠ ELLE SE FABRIQUE, ELLE NE SE TROUVE PAS. C'est la leçon que le banc a déjà
// payée une fois : quatre essais pointaient un chemin absolu vers le répertoire
// jetable d'une session de travail, le répertoire a disparu, et quatre lignes
// sont devenues rouges sans qu'aucun défaut du produit soit en cause. Un banc
// qui échoue pour une raison qui n'est pas son sujet est un banc qu'on finit
// par ne plus croire.
//
// ⚠ ET ELLE EST FABRIQUÉE PAR LE NAVIGATEUR, PAS PAR UN OUTIL EXTERNE. Le banc
// n'a le droit de dépendre de rien d'autre que de ce qui fait déjà tourner le
// produit : un ffmpeg installé à la main sur un poste et absent d'un autre
// rendrait cette fixture indisponible exactement là où on en a besoin.
//
// Le format est celui que le navigateur du banc sait produire — WebM en
// pratique. Le MOV/HEVC d'un iPhone RÉEL reste hors de portée d'un banc de
// bureau : c'est précisément ce que le spike 23.10 doit éprouver sur l'appareil
// cible, et aucune fixture fabriquée ici ne peut en tenir lieu.
import { chromium } from 'playwright-core'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ICI = path.dirname(fileURLToPath(import.meta.url))
export const CHROME = process.env.CHROME
  ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const DOSSIER = path.join(ICI, '.fixtures')

/** Deux secondes. Assez pour que le ré-encodage ait réellement lieu et que la
 *  durée se lise, assez court pour qu'un banc ne passe pas une minute à
 *  attendre — la compression se fait en temps réel, c'est le prix du procédé. */
const SECONDES = 2

/**
 * Rend le chemin d'une vraie vidéo, en la fabriquant au premier appel. Les
 * appels suivants la retrouvent sur le disque.
 *
 * `VIDEO_ESSAI` permet de lui substituer un vrai fichier d'appareil — un MOV
 * d'iPhone, typiquement, pour regarder le comportement à l'œil. Jamais
 * nécessaire pour que le banc passe.
 */
export const videoDEssai = async () => {
  if (process.env.VIDEO_ESSAI) return process.env.VIDEO_ESSAI

  const nav = await chromium.launch({ executablePath: CHROME })
  const page = await nav.newPage()
  const { base64, extension } = await page.evaluate(async (secondes) => {
    const toile = document.createElement('canvas')
    toile.width = 640
    toile.height = 480
    const p = toile.getContext('2d')

    const formats = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm', 'video/mp4']
    const format = formats.find((f) => MediaRecorder.isTypeSupported(f))
    if (!format) throw new Error('ce navigateur ne sait fabriquer aucune vidéo')

    const flux = toile.captureStream(30)
    const graveur = new MediaRecorder(flux, { mimeType: format })
    const morceaux = []
    graveur.ondataavailable = (e) => { if (e.data.size) morceaux.push(e.data) }
    const fini = new Promise((res) => { graveur.onstop = () => res() })
    graveur.start(100)

    // ⚠ UNE IMAGE QUI BOUGE, PAS UN APLAT. Un fond uni se comprime en quelques
    // octets et rendrait une vidéo d'un poids irréaliste : le banc croirait
    // tenir un fichier là où il ne tient qu'un artefact du compresseur.
    const depart = performance.now()
    await new Promise((res) => {
      const peindre = () => {
        const t = (performance.now() - depart) / 1000
        p.fillStyle = '#0b0f1c'
        p.fillRect(0, 0, 640, 480)
        for (let i = 0; i < 60; i++) {
          p.fillStyle = `hsl(${(i * 37 + t * 120) % 360} 70% 55%)`
          const x = (i * 97 + t * 260) % 640
          const y = (i * 61 + Math.sin(t + i) * 80 + 240) % 480
          p.fillRect(x, y, 26, 26)
        }
        if (t >= secondes) return res()
        requestAnimationFrame(peindre)
      }
      peindre()
    })

    graveur.stop()
    flux.getTracks().forEach((piste) => piste.stop())
    await fini

    const blob = new Blob(morceaux, { type: format.split(';')[0] })
    const tampon = await blob.arrayBuffer()
    let binaire = ''
    const octets = new Uint8Array(tampon)
    for (let i = 0; i < octets.length; i++) binaire += String.fromCharCode(octets[i])
    return { base64: btoa(binaire), extension: format.includes('mp4') ? 'mp4' : 'webm' }
  }, SECONDES)
  await nav.close()

  const fichier = path.join(DOSSIER, `crash.${extension}`)
  fs.mkdirSync(DOSSIER, { recursive: true })
  fs.writeFileSync(fichier, Buffer.from(base64, 'base64'))
  return fichier
}
