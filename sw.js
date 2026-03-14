const CACHE = 'dnd-manager-v4';

self.addEventListener('install', function(e) {
  self.skipWaiting();
});

self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return k !== CACHE; })
            .map(function(k) { return caches.delete(k); })
      );
    }).then(function() { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function(e) {
  if (e.request.method !== 'GET') return;

  // Never cache the main HTML file — always fetch fresh
  if (e.request.url.endsWith('/') ||
      e.request.url.endsWith('/index.html') ||
      e.request.url.includes('index.html')) {
    e.respondWith(
      fetch(e.request).catch(function() { return caches.match(e.request); })
    );
    return;
  }

  // Skip external APIs
  if (e.request.url.includes('firebaseio.com') ||
      e.request.url.includes('supabase.co') ||
      e.request.url.includes('agora.io') ||
      e.request.url.includes('googleapis.com') ||
      e.request.url.includes('youtube.com') ||
      e.request.url.includes('emailjs.com')) return;

  e.respondWith(
    fetch(e.request).then(function(response) {
      if (response && response.status === 200) {
        var clone = response.clone();
        caches.open(CACHE).then(function(c) { c.put(e.request, clone); });
      }
      return response;
    }).catch(function() { return caches.match(e.request); })
  );
});

self.addEventListener('message', function(e) {
  if (e.data && e.data.type === 'SKIP_WAITING') self.skipWaiting();
});
