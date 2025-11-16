// Service Worker for HyperDAG Performance Optimization
const CACHE_NAME = 'hyperdag-v1.0.3';
const STATIC_CACHE_NAME = 'hyperdag-static-v1.0.3';
const API_CACHE_NAME = 'hyperdag-api-v1.0.3';

// Critical resources to cache immediately
const STATIC_RESOURCES = [
  '/',
  '/manifest.json',
  '/favicon.ico'
];

// API endpoints to cache
const CACHE_API_PATTERNS = [
  '/api/user/stats',
  '/api/auth/verify',
  '/api/grants',
  '/api/projects'
];

// Cache strategies
const CACHE_STRATEGIES = {
  CACHE_FIRST: 'cache-first',
  NETWORK_FIRST: 'network-first',
  STALE_WHILE_REVALIDATE: 'stale-while-revalidate'
};

// Install event - cache critical resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE_NAME).then((cache) => 
        cache.addAll(STATIC_RESOURCES)
      ),
      caches.open(API_CACHE_NAME)
    ]).then(() => {
      self.skipWaiting();
    })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && 
              cacheName !== STATIC_CACHE_NAME && 
              cacheName !== API_CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      self.clients.claim();
    })
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Handle API requests
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request));
    return;
  }

  // Handle static assets
  if (request.destination === 'script' || 
      request.destination === 'style' || 
      request.destination === 'image') {
    event.respondWith(handleStaticAsset(request));
    return;
  }

  // Handle navigation requests
  if (request.mode === 'navigate') {
    event.respondWith(handleNavigation(request));
    return;
  }

  // Default: network first
  event.respondWith(
    fetch(request).catch(() => 
      caches.match(request)
    )
  );
});

// Handle API requests with smart caching
async function handleApiRequest(request) {
  const url = new URL(request.url);
  const cache = await caches.open(API_CACHE_NAME);

  // For GET requests, try cache first then network
  if (request.method === 'GET') {
    const shouldCache = CACHE_API_PATTERNS.some(pattern => 
      url.pathname.includes(pattern)
    );

    if (shouldCache) {
      const cachedResponse = await cache.match(request);
      if (cachedResponse) {
        // Return cached response and update in background
        fetchAndCache(request, cache);
        return cachedResponse;
      }
    }

    try {
      const response = await fetch(request);
      if (response.ok && shouldCache) {
        cache.put(request, response.clone());
      }
      return response;
    } catch (error) {
      const cachedResponse = await cache.match(request);
      if (cachedResponse) {
        return cachedResponse;
      }
      throw error;
    }
  }

  // For non-GET requests, always go to network
  return fetch(request);
}

// Handle static assets with cache first strategy
async function handleStaticAsset(request) {
  const cache = await caches.open(STATIC_CACHE_NAME);
  const cachedResponse = await cache.match(request);

  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    // Return fallback for images
    if (request.destination === 'image') {
      return new Response(
        '<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="200" fill="#f0f0f0"/><text x="50%" y="50%" text-anchor="middle" dy=".3em">Image</text></svg>',
        { headers: { 'Content-Type': 'image/svg+xml' } }
      );
    }
    throw error;
  }
}

// Handle navigation requests
async function handleNavigation(request) {
  try {
    return await fetch(request);
  } catch (error) {
    const cache = await caches.open(STATIC_CACHE_NAME);
    return cache.match('/') || new Response('Offline', { status: 503 });
  }
}

// Background fetch and cache
async function fetchAndCache(request, cache) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
  } catch (error) {
    // Silently fail background updates
  }
}