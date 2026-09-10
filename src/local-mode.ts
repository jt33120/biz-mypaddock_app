/** Private localhost preview: separate data/media and no remote service client. */
export const LOCAL_NIGHT_PREVIEW = Boolean(import.meta.env?.DEV)
  && typeof location !== 'undefined'
  && new URLSearchParams(location.search).get('apercu') === 'night'
