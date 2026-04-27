/**
 * notifications.js  [FIXED v5]
 *
 * ✅ Fix #1 — registerForPushNotifications:
 *             EAS/Expo Go → getExpoPushTokenAsync (ExponentPushToken)
 *             Local APK build → getDevicePushTokenAsync (FCM token directly)
 *             দুটোই try করে যেটা পাওয়া যায় সেটা পাঠায়
 * ✅ Fix #2 — pingServer: token type সহ পাঠায় (expo/fcm)
 * ✅ Fix #3 — Real-time banner: App খোলা থাকলেও settings poll থেকে banner trigger হবে
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
export async function gasText(url) {
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

// ── Android Notification Channel ─────────────────────────────────────────────
async function ensureAndroidChannel() {
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
}

// ── Push Token নেওয়া ──────────────────────────────────────────────────────────
// ✅ FIXED: দুটো method try করে — local APK এবং EAS build উভয়ের জন্য কাজ করে
export async function registerForPushNotifications() {
  try {
    await ensureAndroidChannel();

    // Permission চাও
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('[Flixify] ❌ Notification permission denied');
      return { token: null, type: null };
    }

    // ── Method 1: Expo Push Token (EAS build / Expo Go) ───────────────────
    // ExponentPushToken[...] — Expo server এর মাধ্যমে FCM-এ যায়
    try {
      const projectId = '679f3439-690a-45b6-aeac-b05812aeec20';
      const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
      if (tokenData?.data) {
        console.log('[Flixify] ✅ Expo Push Token:', tokenData.data);
        await AsyncStorage.setItem('flixify_push_token', tokenData.data);
        await AsyncStorage.setItem('flixify_token_type', 'expo');
        return { token: tokenData.data, type: 'expo' };
      }
    } catch (expoErr) {
      console.log('[Flixify] ⚠️ Expo token failed (local APK?):', expoErr.message);
    }

    // ── Method 2: FCM Device Token (Local/bare APK build) ─────────────────
    // Raw FCM token — সরাসরি Firebase Cloud Messaging এ যায়
    // GAS থেকে FCM HTTP v1 API দিয়ে পাঠাতে হবে
    try {
      const deviceTokenData = await Notifications.getDevicePushTokenAsync();
      if (deviceTokenData?.data) {
        console.log('[Flixify] ✅ FCM Device Token:', deviceTokenData.data);
        await AsyncStorage.setItem('flixify_push_token', deviceTokenData.data);
        await AsyncStorage.setItem('flixify_token_type', 'fcm');
        return { token: deviceTokenData.data, type: 'fcm' };
      }
    } catch (fcmErr) {
      console.log('[Flixify] ❌ FCM token also failed:', fcmErr.message);
    }

    return { token: null, type: null };

  } catch (e) {
    console.log('[Flixify] ❌ registerForPushNotifications error:', e.message);
    return { token: null, type: null };
  }
}

// ── GAS-এ ping (deviceId + token + tokenType) ─────────────────────────────────
export async function pingServer(pushToken, tokenType) {
  try {
    const deviceId  = await getOrCreateDeviceId();
    const safeToken = pushToken || '';
    const safeType  = tokenType  || '';
    await fetch(
      `${APPS_SCRIPT_URL}?action=ping` +
      `&deviceId=${encodeURIComponent(deviceId)}` +
      `&token=${encodeURIComponent(safeToken)}` +
      `&tokenType=${encodeURIComponent(safeType)}`
    );
  } catch (_) {}
}

// ── Notification poll (in-app banner এর জন্য) ─────────────────────────────────
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
