import { precacheAndRoute } from 'workbox-precaching';
precacheAndRoute(self.__WB_MANIFEST || []);

// =========================================================================
// MISE À JOUR EN ARRIÈRE-PLAN : Activation immédiate du nouveau code
// =========================================================================
self.addEventListener('install', () => {
  // Force le nouveau service worker à s'installer immédiatement
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // Prend le contrôle des clients (pages) immédiatement sans attendre un rechargement
  event.waitUntil(self.clients.claim());
});

// =========================================================================
// 1. ÉCOUTEUR INDISPENSABLE POUR LES WEBSOCKETS (postMessage de React)
// =========================================================================
self.addEventListener("message", (event) => {
  // On intercepte le signal envoyé par ws.onmessage du code React
  if (event.data && event.data.type === "SHOW_WS_NOTIFICATION") {
    const options = {
      body: event.data.body || "Vous avez reçu une notification.",
      icon: "/logo_circle.png",      // Icône affichée dans la bulle système
      badge: "/logooo.png",    // Petite icône (barre d'état Android)
      vibrate: [100, 50, 100],       // Vibration sur mobile
      data: {
        url: event.data.url || "/"   // URL de redirection cible
      }
    };

    // Force le système d'exploitation de l'appareil à afficher la bannière
    event.waitUntil(
      self.registration.showNotification(event.data.title, options)
    );
  }
});

// =========================================================================
// 2. ÉCOUTEUR CLASSIQUE POUR LE PROTOCOLE WEB PUSH VAPID (Conservé au cas où)
// =========================================================================
self.addEventListener("push", (event) => {
  let data = { title: "Nouveau message", body: "Vous avez reçu une notification." };

  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { title: "Nouveau message", body: event.data.text() };
    }
  }

  const options = {
    body: data.body,
    icon: "/logo_circle.png",
    badge: "/logo_circle.jpeg",
    vibrate: [100, 50, 100],
    data: {
      url: data.url || "/"
    }
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// =========================================================================
// 3. GESTION DU CLIC SUR LA BANNIÈRE SYSTÈME (Fonctionne pour le WS et le Push)
// =========================================================================
self.addEventListener("notificationclick", (event) => {
  event.notification.close(); // Ferme la notification système immédiatement

  const targetUrl = event.notification.data.url;

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      // Si la PWA est ouverte sur l'URL cible, on met le focus dessus
      for (const client of clientList) {
        if (client.url.includes(targetUrl) && "focus" in client) {
          return client.focus();
        }
      }
      // Sinon, on ouvre un nouvel onglet/fenêtre PWA vers l'URL
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
