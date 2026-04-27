/**
 * notifications.js  [FIXED v3]
 *
 * Token না আসার কারণ ও সমাধান:
 * ✅ projectId hardcode করা হয়েছে — Constants দিয়ে read না হলেও কাজ করবে
 * ✅ Device.isDevice check সরানো হয়েছে — emulator-এও কাজ করবে
 * ✅ permission denied হলে console-এ কারণ দেখাবে
 * ✅ token error হলে details দেখাবে
 */

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { APPS_SCRIPT_URL } from './constants';

// ── Foreground-এ থাকলেও notification দেখাবে ─────────────────────────────────
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge:  true,
  }),
});

// ── JSONP Helper ──────────────────────────────────────────────────────────────
async function gasText(url) {
  const res  = await fetch(url);
  let   text = (await res.text()).trim();
  const m = text.match(/^[\w$]+\(([\s\S]*)\)\s*;?\s*$/);
  if (m) text = m[1];
  return JSON.parse(text);
}

// ── Persistent DeviceId ───────────────────────────────────────────────────────
async function getOrCreateDeviceId() {
  try {
    let id = await AsyncStorage.getItem('flixify_device_id');
    if (!id) {
      const rand = () => Math.random().toString(36).substring(2, 10);
      id = `${Platform.OS}-${rand()}-${rand()}`;
      await AsyncStorage.setItem('flixify_device_id', id);
    }
    return id;
  } catch (_) {
    const rand = () => Math.random().toString(36).substring(2, 10);
    return `${Platform.OS}-${rand()}-${rand()}`;
  }
}

// ── Push Token নেওয়া ──────────────────────────────────────────────────────────
export async function registerForPushNotifications() {
  try {
    // Android notification channel আগে বানাও
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

    // Permission চাও
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('[Flixify] Notification permission denied:', finalStatus);
      return null;
    }

    // ✅ projectId hardcode — Constants থেকে না পেলেও কাজ করবে
    const projectId = '679f3439-690a-45b6-aeac-b05812aeec20';

    const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
    console.log('[Flixify] Push token OK:', tokenData.data);
    return tokenData.data;

  } catch (e) {
    console.log('[Flixify] Token error:', e.message);
    return null;
  }
}

// ── GAS-এ ping (deviceId + token) ────────────────────────────────────────────
export async function pingServer(pushToken) {
  try {
    const deviceId = await getOrCreateDeviceId();
    await fetch(
      `${APPS_SCRIPT_URL}?action=ping` +
      `&deviceId=${encodeURIComponent(deviceId)}` +
      `&token=${encodeURIComponent(pushToken || '')}`
    );
  } catch (_) {}
}

// ── Notification poll ─────────────────────────────────────────────────────────
export async function fetchNotifications(lastSeenId = '') {
  try {
    const data = await gasText(
      `${APPS_SCRIPT_URL}?action=getNotifs&lastId=${encodeURIComponent(lastSeenId)}`
    );
    return data.notifications || [];
  } catch (_) {
    return [];
  }
}

// ── Notification listeners ────────────────────────────────────────────────────
export function setupNotificationListeners({ onReceive, onTap } = {}) {
  const receiveSub = Notifications.addNotificationReceivedListener(notif => {
    onReceive?.({
      title: notif.request.content.title || 'Flixify',
      body:  notif.request.content.body  || '',
    });
  });

  const responseSub = Notifications.addNotificationResponseReceivedListener(response => {
    const content = response.notification.request.content;
    onTap?.({
      title: content.title || '',
      body:  content.body  || '',
      data:  content.data  || {},
    });
  });

  return () => {
    receiveSub.remove();
    responseSub.remove();
  };
}
