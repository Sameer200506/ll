self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Pass-through fetch handler (required for PWA install eligibility)
  // We do not cache resources dynamically to avoid conflicts with Firebase Auth and database queries.
  event.respondWith(fetch(event.request));
});
