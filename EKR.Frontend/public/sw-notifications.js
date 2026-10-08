/* ZEIR notification service worker — shows OS notifications even when tab is in background. */
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const orderId = event.notification.data?.orderId;
  const url = orderId ? `/orders/${orderId}` : '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ('focus' in client) {
          client.postMessage({ type: 'notification-click', orderId });
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(url);
      }
    })
  );
});

self.addEventListener('message', (event) => {
  const data = event.data;
  if (!data || data.type !== 'show-notification') return;

  event.waitUntil(
    self.registration.showNotification(data.title || 'ZEIR', {
      body: data.body || '',
      icon: '/favicon.svg',
      badge: '/favicon.svg',
      tag: data.tag || 'zeir',
      renotify: true,
      requireInteraction: true,
      data: { orderId: data.orderId || null },
    })
  );
});
