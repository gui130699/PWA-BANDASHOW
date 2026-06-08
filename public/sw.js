const CACHE_NAME = 'grupo-dvanera-v4'
const BASE_PATH = new URL(self.registration.scope).pathname
const APP_SHELL = [
  BASE_PATH,
  `${BASE_PATH}manifest.webmanifest`,
  `${BASE_PATH}icons/icon-192.png`,
  `${BASE_PATH}icons/icon-512.png`,
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))),
      )
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') {
    void self.skipWaiting()
  }
})

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return

  const requestUrl = new URL(event.request.url)
  if (requestUrl.origin !== self.location.origin || !requestUrl.pathname.startsWith(BASE_PATH)) {
    return
  }

  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone()
            void caches.open(CACHE_NAME).then((cache) => cache.put(BASE_PATH, copy))
          }
          return response
        })
        .catch(async () => (await caches.match(BASE_PATH)) || Response.error()),
    )
    return
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      const networkRequest = fetch(event.request)
        .then((response) => {
          if (response.ok) {
            const contentType = response.headers.get('content-type') || ''
            const shouldCache =
              contentType.includes('text/css') ||
              contentType.includes('javascript') ||
              contentType.includes('image/') ||
              requestUrl.pathname.endsWith('manifest.webmanifest')

            if (shouldCache) {
              const copy = response.clone()
              void caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy))
            }
          }

          return response
        })
        .catch(() => cached || Response.error())

      return cached || networkRequest
    }),
  )
})
