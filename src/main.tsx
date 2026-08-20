import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

/**
 * ⚠ LA MISE À JOUR SE PREND, ELLE NE S'ATTEND PAS.
 *
 * Défaut trouvé le 20 août, et c'est le plus coûteux de tous parce qu'il annule
 * silencieusement TOUT le reste : Julian a signalé qu'une fonctionnalité n'avait
 * pas été faite. Elle l'était, elle était en production sur Vercel, état READY —
 * son téléphone servait simplement l'ancien paquet.
 *
 * `registerType: 'autoUpdate'` fait bien ce qu'il promet : le nouveau Service
 * Worker s'installe et prend le contrôle. Mais LA PAGE DÉJÀ CHARGÉE continue
 * d'exécuter l'ancien JavaScript jusqu'à un rechargement — et une PWA installée
 * sur iOS n'est jamais vraiment fermée. On peut donc rester des jours sur une
 * version morte, en croyant tester la dernière.
 *
 * Deux gestes, et aucun n'est cosmétique :
 *
 *   ① RECHARGER quand un nouveau contrôleur prend la main. Le garde
 *     `avaitUnControleur` est indispensable : au tout premier chargement, il
 *     n'y a aucun contrôleur, `clientsClaim` en installe un, et l'événement
 *     part — recharger là ferait un rechargement gratuit à chaque première
 *     visite, c'est-à-dire exactement sur le clic publicitaire.
 *
 *   ② DEMANDER s'il y a du neuf au retour au premier plan. C'est le seul
 *     moment où on peut le faire (AD-6 : rien ne tourne pendant que
 *     l'application est fermée), et sans ça iOS ne vérifie que très rarement.
 *
 * Rien ici ne coûte de réseau au paddock : `update()` échoue silencieusement
 * hors ligne, et le reste ne se déclenche pas.
 */
if ('serviceWorker' in navigator) {
  const avaitUnControleur = !!navigator.serviceWorker.controller
  let enRechargement = false

  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!avaitUnControleur || enRechargement) return
    enRechargement = true
    location.reload()
  })

  const chercherDuNeuf = () => {
    if (document.visibilityState !== 'visible' || !navigator.onLine) return
    void navigator.serviceWorker.getRegistration()
      .then((r) => r?.update())
      .catch(() => { /* hors ligne ou refusé : on retentera au prochain retour */ })
  }
  document.addEventListener('visibilitychange', chercherDuNeuf)
  window.addEventListener('online', chercherDuNeuf)
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
