importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

precacheAndRoute(self.__WB_MANIFEST);

firebase.initializeApp({
 apiKey: "AIzaSyDhW5sLovvrJuGn6nIiWzxYsW9jCl6w_3Q",
  projectId: "esathub-79a0c",
  messagingSenderId: "539552032054",
  appId: "1:539552032054:web:c689ced1eef3022e1cff97",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  self.registration.showNotification(payload.notification.title, {
    body: payload.notification.body,
    icon: "/icon-192x192.png",
    data: { url: payload.data?.url || "/" }
  });
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/";
  event.waitUntil(
    clients.matchAll({ type: "window" }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(url) && "focus" in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});