/* Small, blocking, same-origin bootstrap: available before the React graph.
 * One disposable raster thumbnail, never the source photo or a remote URL.
 * The source of truth remains SQLite and the media vault. */
;(function () {
  'use strict'
  var PREFIX = 'mypaddock.splash.'
  var IMAGE = PREFIX + 'image.v1'
  var TRUST = PREFIX + 'trust.v1'
  var REVISION = PREFIX + 'revision'
  var SELECTED = PREFIX + 'selected.v1'
  var SEEN_ACCOUNT = PREFIX + 'account-seen'
  var BLOCKED = PREFIX + 'blocked'
  var IDENTITY = 'mypaddock.identite'
  var MAX = 180000
  // A private local preview must neither read nor modify the real cache.
  var preview = new URLSearchParams(location.search).get('apercu') === 'night'
  var validId = function (id) { return typeof id === 'string' && /^[a-zA-Z0-9_-]{1,128}$/.test(id) }
  var get = function (key) { try { return localStorage.getItem(key) } catch { return null } }
  var remove = function (key) { try { localStorage.removeItem(key) } catch { /* optional cache */ } }
  var put = function (key, value) { try { localStorage.setItem(key, value); return true } catch { return false } }
  var parse = function (key, limit) {
    var value = get(key)
    if (!value || value.length > limit) return null
    try { return JSON.parse(value) } catch { return null }
  }
  var owner = function () {
    if (preview || get(BLOCKED)) return null
    var raw = get(IDENTITY)
    if (!raw) return get(SEEN_ACCOUNT) ? null : '@local'
    var identity = parse(IDENTITY, 1024)
    return identity && validId(identity.id) ? identity.id : null
  }
  var raster = function (value) {
    return typeof value === 'string' && value.length <= MAX
      && /^data:image\/(?:png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(value)
  }
  var read = function () {
    if (preview) return null
    var currentOwner = owner()
    var value = parse(IMAGE, MAX + 512)
    if (!currentOwner || !value || value.v !== 1 || value.owner !== currentOwner || !validId(value.id) || !raster(value.data)) {
      remove(IMAGE)
      return null
    }
    return value
  }
  var hide = function () {
    var scene = document.getElementById('chargement')
    var image = document.getElementById('ch-bike')
    if (scene) scene.classList.remove('ch-personal')
    if (image) { image.hidden = true; image.removeAttribute('src') }
  }
  var revision = function () {
    var current = get(REVISION)
    if (!current) {
      current = crypto.randomUUID()
      if (!put(REVISION, current)) return null
    }
    return current
  }
  var ticket = function () {
    var current = owner()
    if (!current) return null
    var version = revision()
    return version ? { owner: current, revision: version } : null
  }
  var current = function (t) { return t && t.owner === owner() && t.revision === get(REVISION) }
  var remember = function (id, t) {
    if (!validId(id) || !current(t)) return false
    var previous = parse(TRUST, 10000)
    var ids = previous && previous.owner === t.owner && Array.isArray(previous.ids)
      ? previous.ids.filter(validId).filter(function (value) { return value !== id }).slice(-63) : []
    return put(TRUST, JSON.stringify({ owner: t.owner, ids: ids.concat(id) }))
  }
  var trusted = function (id, t) {
    if (!current(t)) return false
    var saved = read()
    var proof = parse(TRUST, 10000)
    return Boolean((saved && saved.id === id) || (proof && proof.owner === t.owner
      && Array.isArray(proof.ids) && proof.ids.includes(id)))
  }
  var clear = function () {
    if (preview) return
    remove(IMAGE)
    put(REVISION, crypto.randomUUID())
    hide()
  }
  var accountChanged = function () {
    if (preview) return
    clear()
    remove(TRUST)
    remove(SELECTED)
    remove(BLOCKED)
    // Existing SQLite rows must not become an anonymous rider's motorcycle.
    put(SEEN_ACCOUNT, '1')
  }
  var block = function () {
    if (preview) return
    clear()
    put(BLOCKED, '1')
  }
  var selected = function () {
    var value = parse(SELECTED, 512)
    return value && value.owner === owner() && validId(value.id) ? value.id : null
  }
  window.mypaddockSplash = {
    ticket: ticket, read: read, trusted: trusted, remember: remember,
    clear: clear, block: block, accountChanged: accountChanged, selected: selected,
    write: function (id, data, t) {
      if (!validId(id) || !raster(data) || !current(t) || !trusted(id, t)) return false
      var ok = put(IMAGE, JSON.stringify({ v: 1, owner: t.owner, id: id, data: data }))
      if (!ok) clear()
      return ok
    },
    select: function (id) {
      var t = ticket()
      if (!t || !validId(id)) return
      put(SELECTED, JSON.stringify({ owner: t.owner, id: id }))
      window.dispatchEvent(new Event('mypaddock:splash-selection'))
    },
  }
  if (preview) return
  if (owner() && owner() !== '@local') put(SEEN_ACCOUNT, '1')
  var value = read()
  var bike = document.getElementById('ch-bike')
  if (value && bike) {
    bike.addEventListener('load', function () {
      // An account can change while the image is decoding.
      if (value.owner !== owner() || get(IMAGE) === null || !bike.naturalWidth) { hide(); return }
      bike.hidden = false
      document.getElementById('chargement')?.classList.add('ch-personal')
    }, { once: true })
    bike.addEventListener('error', clear, { once: true })
    bike.src = value.data
  }
  window.addEventListener('storage', function (event) {
    if (event.key === IDENTITY || event.key === null) { accountChanged(); return }
    if (event.key === IMAGE && !event.newValue) hide()
  })
})()
