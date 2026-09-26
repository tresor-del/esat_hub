import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDhW5sLovvrJuGn6nIiWzxYsW9jCl6w_3Q",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "esathub-79a0c",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "539552032054",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:539552032054:web:c689ced1eef3022e1cff97",
};

if (!import.meta.env.VITE_FIREBASE_API_KEY || !import.meta.env.VITE_FIREBASE_PROJECT_ID || !import.meta.env.VITE_FIREBASE_APP_ID || !import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID) {
  console.warn("Firebase env vars missing, using built-in fallback config.", firebaseConfig);
}

const app = initializeApp(firebaseConfig);
export const messaging = getMessaging(app);
export { firebaseConfig };

export const requestNotificationPermission = async () => {
  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      console.warn("Permission refusée");
      return null;
    }

    const registration = await navigator.serviceWorker.ready;

    const token = await getToken(messaging, {
      vapidKey: import.meta.env.VITE_VAPID_KEY, 
      serviceWorkerRegistration: registration
    });

    console.log("Token FCM:", token);
    return token;
  } catch (err) {
    console.error("Erreur token FCM:", err);
    return null;
  }
};