export const requestNotificationPermission = async () =>{
  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") return null;

    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: import.meta.env.VITE_VAPID_PUBLIC_KEY,
    });

    return JSON.stringify(subscription);
  } catch (err) {
    console.error("Erreur permission notification:", err);
    return null;
  }
}

// Fonction utilitaire interne pour envoyer de façon robuste au Service Worker actif
export const sendSystemNotification = (payload) => {

    const isAppBackground = document.visibilityState === "hidden";
    const hasPermission = Notification.permission === "granted";

    if (hasPermission) {
        // Résout l'instance active, même si le contrôleur temporaire est null en dev
        const swInstance = navigator.serviceWorker.controller;

        if (swInstance) {
            swInstance.postMessage(payload);
        } else if (navigator.serviceWorker.ready) {
            navigator.serviceWorker.ready.then((reg) => {
                if (reg.active) {
                    reg.active.postMessage(payload);
                }
            });
        }
    }
};