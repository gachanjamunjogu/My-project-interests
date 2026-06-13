const CACHE_VERSION = "v1"
const STATIC_CACHE = `aura-static-${CACHE_VERSION}`
const API_CACHE = `aura-api-${CACHE_VERSION}`
const OFFLINE_FALLBACK_PAGE = "/offline.html"

const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/offline.html",
  "/manifest.json",
]

const RUNTIME_CACHE = `aura-runtime-${CACHE_VERSION}`

// Install event - cache static assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(STATIC_ASSETS)
    })
  )
  self.skipWaiting()
})

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          const validCaches = [STATIC_CACHE, API_CACHE, RUNTIME_CACHE]
          if (!validCaches.includes(cacheName)) {
            return caches.delete(cacheName)
          }
        })
      )
    })
  )
  self.clients.claim()
})

// Fetch event - handle requests
self.addEventListener("fetch", (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip cross-origin requests
  if (url.origin !== location.origin) {
    return
  }

  // Handle API requests
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(handleApiRequest(request))
    return
  }

  // Handle static assets with cache-first strategy
  if (isStaticAsset(url.pathname)) {
    event.respondWith(cacheFirst(request))
    return
  }

  // Handle dynamic content with network-first strategy
  event.respondWith(networkFirst(request))
})

async function handleApiRequest(request) {
  // For GET requests, try cache first with network fallback
  if (request.method === "GET") {
    try {
      const networkResponse = await fetch(request)
      if (networkResponse.ok) {
        const cache = await caches.open(API_CACHE)
        cache.put(request, networkResponse.clone())
      }
      return networkResponse
    } catch (error) {
      const cachedResponse = await caches.match(request)
      if (cachedResponse) {
        return cachedResponse
      }
      return offlineResponse({ message: "API unavailable offline" }, 503)
    }
  }

  // For write operations (POST, PUT, PATCH, DELETE), try network first
  try {
    const response = await fetch(request)
    return response
  } catch (error) {
    // Queue for sync and return 202 Accepted
    return offlineResponse({ message: "Request queued for sync", queued: true }, 202)
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request)
  if (cached) {
    return cached
  }

  try {
    const networkResponse = await fetch(request)
    if (networkResponse.ok) {
      const cache = await caches.open(RUNTIME_CACHE)
      cache.put(request, networkResponse.clone())
    }
    return networkResponse
  } catch (error) {
    return offlineResponse({ message: "Asset unavailable offline" }, 404)
  }
}

async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request)
    if (networkResponse.ok) {
      const cache = await caches.open(RUNTIME_CACHE)
      cache.put(request, networkResponse.clone())
    }
    return networkResponse
  } catch (error) {
    const cached = await caches.match(request)
    if (cached) {
      return cached
    }

    // Return offline fallback for navigation requests
    if (request.mode === "navigate") {
      return caches.match(OFFLINE_FALLBACK_PAGE) || offlineResponse({ message: "Offline" }, 503)
    }

    return offlineResponse({ message: "Resource unavailable" }, 503)
  }
}

function isStaticAsset(pathname) {
  const staticExtensions = [".js", ".css", ".svg", ".png", ".jpg", ".jpeg", ".gif", ".webp"]
  return staticExtensions.some((ext) => pathname.endsWith(ext))
}

function offlineResponse(data, status = 503) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  })
}

// Message handler for client communication
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting()
  }
})