/**
 * notifications.js  [FIXED v4]
 *
 * ✅ Fix #1 — registerForPushNotifications: এখন FCM token নেওয়ার চেষ্টাও করে
 *             System-level push notification এর জন্য getDevicePushTokenAsync ব্যবহার
 * ✅ Fix #2 — pingServer: token=null থাকলে empty string পাঠায়
 * ✅ Fix #3 — fetchNotifications: error হলে empty array, না ক্র্যাশ
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
// ✅ SYSTEM-LEVEL PUSH: Expo Push Token (FCM এর মাধ্যমে সত্যিকারের push notification)
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
      console.log('[Flixify] ❌ Notification permission denied:', finalStatus);
      return null;
    }

    // ✅ Expo Push Token (system-level push এর জন্য এটাই দরকার)
    // এই token GAS-এ save হয়, admin থেকে send করলে FCM → device এ পৌঁছায়
    const projectId = '679f3439-690a-45b6-aeac-b05812aeec20';
    const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
    const token = tokenData.data;
    console.log('[Flixify] ✅ Expo Push Token:', token);

    // Token AsyncStorage-এ save করো (debug এর জন্য)
    await AsyncStorage.setItem('flixify_push_token', token);

    return token;

  } catch (e) {
    console.log('[Flixify] ❌ Token error:', e.message);
    return null;
  }
}

// ── GAS-এ ping (deviceId + token) ────────────────────────────────────────────
// ✅ Fix #2 — null token এ empty string পাঠাও
export async function pingServer(pushToken) {
  try {
    const deviceId = await getOrCreateDeviceId();
    const safeToken = pushToken || '';
    await fetch(
      `${APPS_SCRIPT_URL}?action=ping` +
      `&deviceId=${encodeURIComponent(deviceId)}` +
      `&token=${encodeURIComponent(safeToken)}`
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
