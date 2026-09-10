/** The first-paint scene is inline in index.html, before React and SQLite. */
export const retirerLEcranDeChargement = (): void => {
  const decor = document.getElementById('chargement')
  if (!decor || decor.classList.contains('ch-parti')) return

  // Ready and fatal-error states must both become usable immediately.
  decor.classList.add('ch-parti')
  decor.setAttribute('aria-hidden', 'true')
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    decor.remove()
    return
  }

  const retirer = () => decor.remove()
  decor.addEventListener('transitionend', retirer, { once: true })
  // A background tab can omit transitionend; never leave a dead overlay behind.
  window.setTimeout(retirer, 240)
}
