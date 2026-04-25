import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { APPS_SCRIPT_URL } from './constants';

// Notification handler — app foreground-এ থাকলেও দেখাবে
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// ── Push Token নেওয়া ─────────────────────────────────────────────────────────
export async function registerForPushNotifications() {
  if (!Device.isDevice) return null;

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') return null;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('flixify', {
      name: 'Flixify',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#eb0050',
      sound: true,
    });
  }

  const projectId = Constants.expoConfig?.extra?.eas?.projectId;
  const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
  return token;
}

// ── Sheet-এ token + active user পাঠানো ───────────────────────────────────────
export async function pingServer(pushToken) {
  try {
    const deviceId = Constants.deviceId || Constants.sessionId || 'unknown';
    await fetch(`${APPS_SCRIPT_URL}?action=ping&deviceId=${deviceId}&token=${pushToken || ''}`);
  } catch (_) {}
}

// ── Live user count আনা ───────────────────────────────────────────────────────
export async function fetchLiveUserCount() {
  try {
    const res = await fetch(`${APPS_SCRIPT_URL}?action=liveCount`);
    const data = await res.json();
    return data.count || 0;
  } catch (_) {
    return 0;
  }
}

// ── নতুন notifications আনা ───────────────────────────────────────────────────
export async function fetchNotifications(lastSeenId = 0) {
  try {
    const res = await fetch(`${APPS_SCRIPT_URL}?action=notifications&lastId=${lastSeenId}`);
    const data = await res.json();
    return data.notifications || [];
  } catch (_) {
    return [];
  }
}
