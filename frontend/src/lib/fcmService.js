import { Capacitor } from '@capacitor/core';
import { FirebaseMessaging } from '@capacitor-firebase/messaging';
import { getToken } from "firebase/messaging";
import { messaging } from '../config/firebase';
import api from '../utils/axiosConfig';

const getFirebaseWebRegistration = async () => {
  if (!('serviceWorker' in navigator)) return null;

  try {
    return await navigator.serviceWorker.register('/firebase-messaging-sw.js', { scope: '/' });
  } catch (error) {
    console.error('Erreur d’enregistrement du service worker Firebase:', error);
    return null;
  }
};

export const initFCM = async (userId) => {
  let token = null;

  if (Capacitor.isNativePlatform()) {
    const { receive } = await FirebaseMessaging.requestPermissions();
    if (receive !== 'granted') return;

    const result = await FirebaseMessaging.getToken();
    token = result.token;

    FirebaseMessaging.addListener('notificationReceived', (notification) => {
      console.log('Notification reçue:', notification);
      window.dispatchEvent(new CustomEvent('app:notification', {
        detail: notification.notification
      }));
    });
  } else {
    if (typeof Notification === 'undefined' || !('serviceWorker' in navigator)) return;

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return;

    const registration = await getFirebaseWebRegistration();
    await navigator.serviceWorker.ready;

    token = await getToken(messaging, {
      vapidKey: import.meta.env.VITE_VAPID_KEY || 'x-Q5YK_rA-PQOINc4XyUNl5D6i55uwnhYS3dzv1Hrm0',
      serviceWorkerRegistration: registration
    });
  }

  if (!token) return;

  await api.post('/notifications/register', {
    user_id: userId,
    device_token: token,
    platform: Capacitor.isNativePlatform() ? 'android' : 'web'
  });
};
