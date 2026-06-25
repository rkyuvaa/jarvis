// JARVIS Service Worker — PWA + FCM
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

// Cache name
const CACHE_NAME = 'jarvis-v1';
const urlsToCache = ['/', '/index.html'];

// Install event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache))
  );
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    )
  );
  self.clients.claim();
});

// Fetch event - network first
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});

// Firebase Messaging (background push)
// This will be initialized when the config is posted via message
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'FIREBASE_CONFIG') {
    try {
      if (!firebase.apps.length) {
        firebase.initializeApp(event.data.config);
      }
      const messaging = firebase.messaging();
      messaging.onBackgroundMessage((payload) => {
        const { title, body, data } = payload.notification || payload.data || {};
        self.registration.showNotification(title || 'JARVIS Alert', {
          body: body || '',
          icon: '/icon-192.png',
          badge: '/icon-192.png',
          data: data,
          vibrate: [200, 100, 200],
          tag: 'jarvis-reminder',
          actions: [
            { action: 'view', title: 'VIEW' },
            { action: 'dismiss', title: 'DISMISS' },
          ],
        });
      });
    } catch (e) {
      console.warn('[SW] Firebase init error:', e);
    }
  }
});

// Notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const route = event.notification.data?.route || '/';
  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.navigate(route);
            return client.focus();
          }
        }
        if (clients.openWindow) return clients.openWindow(route);
      })
  );
});
