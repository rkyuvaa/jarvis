import { initializeApp, getApps } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
};

let app = null;
let messaging = null;

function initFirebase() {
  if (!firebaseConfig.apiKey) return false;
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApps()[0];
  }
  return true;
}

/**
 * Initialize Firebase Messaging and request notification permission.
 * @returns {Promise<string|null>} FCM token or null
 */
export async function initFCM() {
  try {
    if (!initFirebase()) {
      console.warn('[JARVIS FCM] Firebase config missing.');
      return null;
    }

    messaging = getMessaging(app);

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.warn('[JARVIS FCM] Notification permission denied.');
      return null;
    }

    const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
    const token = await getToken(messaging, {
      vapidKey,
      serviceWorkerRegistration: await navigator.serviceWorker.getRegistration('/sw.js'),
    });

    // Send firebase config to SW for background messaging
    const swReg = await navigator.serviceWorker.ready;
    swReg.active?.postMessage({
      type: 'FIREBASE_CONFIG',
      config: {
        ...firebaseConfig,
        authDomain: `${firebaseConfig.projectId}.firebaseapp.com`,
        storageBucket: `${firebaseConfig.projectId}.appspot.com`,
      },
    });

    return token;
  } catch (e) {
    console.warn('[JARVIS FCM] Init failed:', e);
    return null;
  }
}

/**
 * Listen for foreground FCM messages.
 * @param {Function} onNotification - Callback with notification payload
 */
export function listenForegroundMessages(onNotification) {
  if (!messaging) return () => {};
  return onMessage(messaging, (payload) => {
    onNotification(payload);
  });
}

/**
 * Send a test notification via FCM (for development).
 */
export async function sendTestNotification(title = 'JARVIS', body = 'System check nominal.') {
  if (Notification.permission === 'granted') {
    new Notification(title, {
      body,
      icon: '/icon-192.png',
    });
  }
}
