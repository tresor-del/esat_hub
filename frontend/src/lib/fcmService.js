import { Capacitor } from '@capacitor/core';
import { FirebaseMessaging } from '@capacitor-firebase/messaging';
import { getToken } from "firebase/messaging";
import { messaging } from '../config/firebase';
import api from '../utils/axiosConfig';

export const initFCM = async (userId) => {
  let token = null;

  if (Capacitor.isNativePlatform()) {
    // Mobile natif
    const { receive } = await FirebaseMessaging.requestPermissions();
    if (receive !== 'granted') return;
    const result = await FirebaseMessaging.getToken();
    token = result.token;

    // Écouter les notifications en foreground
    FirebaseMessaging.addListener('notificationReceived', (notification) => {
      console.log('Notification reçue:', notification);
      window.dispatchEvent(new CustomEvent('app:notification', {
        detail: notification.notification
      }));
    });

  } else {
    // Web browser
     console.log("Branche WEB atteinte")
    if (typeof Notification === "undefined") return;
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return;
    token = await getToken(messaging, {
      vapidKey: import.meta.env.VITE_VAPID_PUBLIC_KEY
    });
  }

  if (!token) return;

  // Envoyer au backend (même endpoint pour les deux)
  await api.post('/notifications/register', {
    user_id: userId,
    device_token: token,
    platform: Capacitor.isNativePlatform() ? "android" : "web"
  });

  console.log("called")
};
