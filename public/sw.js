self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Only proxy same-origin requests. Cross-origin requests (course thumbnails,
  // Google Drive images, fonts, analytics, etc.) must go straight to the
  // browser: this worker inherits the site's CSP, and its connect-src does not
  // allow every image host, so proxying them here makes them fail with
  // net::ERR_FAILED. Same-origin requests stay pass-through for PWA install
  // eligibility, without caching (to avoid conflicts with Firebase Auth).
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(fetch(event.request));
});
