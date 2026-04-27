/**
 * notifications.js  [FIXED VERSION]
 *
 * Bug Fixes:
 * ✅ Bug #1 — res.json() → gasText() helper দিয়ে JSONP strip করে parse করা হচ্ছে
 * ✅ Bug #3 — projectId missing হলেও graceful fallback
 * ✅ Bug #4 — AsyncStorage দিয়ে persistent deviceId (duplicate users বন্ধ)
 * ✅ Bug #6 — liveCount এখন সঠিকভাবে parse হবে
 */

import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { APPS_SCRIPT_URL } from './constants';

// ── Foreground-এ থাকলেও native notification দেখাবে ──────────────────────────
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge:  true,
  }),
});

// ─────────────────────────────────────────────────────────────────────────────
// ✅ FIX Bug #1 — JSONP Helper
// GAS সবসময় "callback({...})" format-এ response দেয়
// এই helper সেই wrapper সরিয়ে JSON parse করে
// ─────────────────────────────────────────────────────────────────────────────
async function gasText(url) {
  const res  = await fetch(url);
  let   text = (await res.text()).trim();
  // JSONP wrapper সরাও: callback({...}) বা callback([...])
  const m = text.match(/^[\w$]+\(([\s\S]*)\)\s*;?\s*$/);
  if (m) text = m[1];
  return JSON.parse(text);
}

// ─────────────────────────────────────────────────────────────────────────────
// ✅ FIX Bug #4 — Persistent DeviceId
// AsyncStorage-এ একবার save হলে পরের বার একই ID ব্যবহার হবে
// আগের মতো Date.now() দিয়ে নতুন ID হবে না → duplicate rows বন্ধ
// ─────────────────────────────────────────────────────────────────────────────
async function getOrCreateDeviceId() {
  try {
    let id = await AsyncStorage.getItem('flixify_device_id');
    if (!id) {
      // UUID-style unique ID তৈরি করো
      const rand = () => Math.random().toString(36).substring(2, 10);
      id = `${Platform.OS}-${rand()}-${rand()}`;
      await AsyncStorage.setItem('flixify_device_id', id);
    }
    return id;
  } catch (_) {
    // AsyncStorage fail হলে session-এর জন্য temporary ID
    return `${Platform.OS}-${Math.random().toString(36).substring(2, 15)}`;
  }
}

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

  // ✅ FIX Bug #3 — projectId graceful handling
  // projectId না থাকলেও crash করবে না
  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ||
    Constants.manifest?.extra?.eas?.projectId ||
    null;

  try {
    const tokenData = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : {}
    );
    console.log('Push token:', tokenData.data);
    return tokenData.data; // "ExponentPushToken[xxxxxx]" format
  } catch (e) {
    console.log('Token error:', e.message);
    return null;
  }
}

// ── GAS-এ token + deviceId পাঠানো (heartbeat) ────────────────────────────────
// ✅ FIX Bug #4 — getOrCreateDeviceId() ব্যবহার করছে (persistent)
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

// ── Live user count ────────────────────────────────────────────────────────────
// ✅ FIX Bug #6 — res.json() → gasText() দিয়ে JSONP সঠিকভাবে parse হচ্ছে
export async function fetchLiveUserCount() {
  try {
    const data = await gasText(`${APPS_SCRIPT_URL}?action=liveCount`);
    return data.count || 0;
  } catch (_) {
    return 0;
  }
}

// ── GAS থেকে নতুন notification poll করা ──────────────────────────────────────
// ✅ FIX Bug #1 — gasText() দিয়ে JSONP parse
// ✅ FIX Bug #2 — lastId পাঠানো হচ্ছে, GAS সেটা filter করে নতুনগুলো দেবে
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

// ── Notification tap listener setup ──────────────────────────────────────────
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

  return () => {
    receiveSub.remove();
    responseSub.remove();
  };
}
