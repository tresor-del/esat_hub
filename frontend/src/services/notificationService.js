

// Fonction utilitaire interne pour envoyer de façon robuste au Service Worker actif
export const sendSystemNotification = (payload) => {

    // const isAppBackground = document.visibilityState === "hidden";
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