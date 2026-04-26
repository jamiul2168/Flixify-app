import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { APPS_SCRIPT_URL } from './constants';

// ── Foreground-এ থাকলেও native notification দেখাবে ──────────────────────────
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge:  true,
  }),
});

// ── Expo Push Token নেওয়া ────────────────────────────────────────────────────
export async function registerForPushNotifications() {
  if (!Device.isDevice) {
    console.log('Push notification: physical device দরকার');
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('Push notification permission denied');
    return null;
  }

  // Android notification channel
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('flixify-main', {
      name:             'Flixify নোটিফিকেশন',
      importance:       Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor:       '#eb0050',
      sound:            true,
      showBadge:        true,
    });
  }

  // Expo Push Token — এটাই GAS-এ save হবে
  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ||
    Constants.manifest?.extra?.eas?.projectId;

  try {
    const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
    console.log('Push token:', tokenData.data);
    return tokenData.data; // "ExponentPushToken[xxxxxx]" format
  } catch (e) {
    console.log('Token error:', e.message);
    return null;
  }
}

// ── GAS-এ token + deviceId পাঠানো (heartbeat) ────────────────────────────────
export async function pingServer(pushToken) {
  try {
    const deviceId =
      Constants.expoConfig?.extra?.deviceId ||
      Constants.sessionId ||
      `device_${Platform.OS}_${Date.now()}`;

    await fetch(
      `${APPS_SCRIPT_URL}?action=ping` +
      `&deviceId=${encodeURIComponent(deviceId)}` +
      `&token=${encodeURIComponent(pushToken || '')}`
    );
  } catch (_) {}
}

// ── Live user count ────────────────────────────────────────────────────────────
export async function fetchLiveUserCount() {
  try {
    const res  = await fetch(`${APPS_SCRIPT_URL}?action=liveCount`);
    const data = await res.json();
    return data.count || 0;
  } catch (_) {
    return 0;
  }
}

// ── GAS থেকে নতুন notification poll করা ──────────────────────────────────────
export async function fetchNotifications(lastSeenId = 0) {
  try {
    const res  = await fetch(`${APPS_SCRIPT_URL}?action=getNotifs&lastId=${lastSeenId}`);
    const data = await res.json();
    return data.notifications || [];
  } catch (_) {
    return [];
  }
}

// ── Notification tap listener setup ──────────────────────────────────────────
// App.js-এ একবার call করলেই হবে
export function setupNotificationListeners({ onReceive, onTap } = {}) {
  // App foreground-এ notification আসলে
  const receiveSub = Notifications.addNotificationReceivedListener(notif => {
    onReceive?.({
      title: notif.request.content.title || 'Flixify',
      body:  notif.request.content.body  || '',
    });
  });

  // Notification tray থেকে tap করলে
  const responseSub = Notifications.addNotificationResponseReceivedListener(response => {
    const content = response.notification.request.content;
    onTap?.({
      title: content.title || '',
      body:  content.body  || '',
      data:  content.data  || {},
    });
  });

  // Cleanup function return করা
  return () => {
    receiveSub.remove();
    responseSub.remove();
  };
}
