/**
 * notifications.js  [FINAL v8 — Image + Deep Link]
 *
 * ✅ App OPEN      → in-app banner + system notification
 * ✅ App BACKGROUND/CLOSED → system notification (status bar)
 * ✅ Notification Image → big picture status bar এ দেখাবে
 * ✅ Deep Link → notification tap করলে app এ নির্দিষ্ট URL এ যাবে
 * ✅ App না থাকলে → browser এ fallback
 */

import * as Notifications  from 'expo-notifications';
import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager     from 'expo-task-manager';
import * as Linking         from 'expo-linking';
import { Platform, AppState } from 'react-native';
import AsyncStorage          from '@react-native-async-storage/async-storage';
import { APPS_SCRIPT_URL }   from './constants';

export const BACKGROUND_NOTIF_TASK = 'FLIXIFY_BACKGROUND_NOTIF_TASK';

// ── Foreground এ থাকলেও system notification দেখাবে ─────────────────────────
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
export async function registerForPushNotifications() {
  try {
    await ensureAndroidChannel();

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      console.log('[Flixify] ❌ Permission denied');
      return { token: null, type: null };
    }

    // Method 1: Expo Push Token (EAS build)
    try {
      const projectId = '679f3439-690a-45b6-aeac-b05812aeec20';
      const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
      if (tokenData?.data) {
        console.log('[Flixify] ✅ Expo token:', tokenData.data);
        await AsyncStorage.setItem('flixify_push_token', tokenData.data);
        await AsyncStorage.setItem('flixify_token_type', 'expo');
        return { token: tokenData.data, type: 'expo' };
      }
    } catch (e) {
      console.log('[Flixify] ⚠️ Expo token failed:', e.message);
    }

    // Method 2: FCM Device Token (local APK)
    try {
      const deviceTokenData = await Notifications.getDevicePushTokenAsync();
      if (deviceTokenData?.data) {
        console.log('[Flixify] ✅ FCM token:', deviceTokenData.data);
        await AsyncStorage.setItem('flixify_push_token', deviceTokenData.data);
        await AsyncStorage.setItem('flixify_token_type', 'fcm');
        return { token: deviceTokenData.data, type: 'fcm' };
      }
    } catch (e) {
      console.log('[Flixify] ❌ FCM token failed:', e.message);
    }

    return { token: null, type: null };
  } catch (e) {
    console.log('[Flixify] ❌ registerForPushNotifications:', e.message);
    return { token: null, type: null };
  }
}

// ── GAS ping ──────────────────────────────────────────────────────────────────
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

// ── ✅ SYSTEM NOTIFICATION — image + deep link সহ ────────────────────────────
export async function showSystemNotification(title, body, image = '', link = '') {
  try {
    await ensureAndroidChannel();

    const content = {
      title,
      body,
      sound:     true,
      priority:  Notifications.AndroidNotificationPriority.HIGH,
      vibrate:   [0, 250, 250, 250],
      channelId: 'flixify-main',
      // data এ link + image রাখো — onTap এ ব্যবহার হবে
      data: {
        link:  link  || '',
        image: image || '',
      },
    };

    // Android big picture — attachments দিয়ে image দেখাও
    if (image) {
      content.attachments = [{ url: image, identifier: 'notif-image' }];
    }

    await Notifications.scheduleNotificationAsync({
      content,
      trigger: null,
    });
    console.log('[Flixify] ✅ System notification sent:', title, link ? `→ ${link}` : '');
  } catch (e) {
    console.log('[Flixify] ❌ showSystemNotification error:', e.message);
  }
}

// ── ✅ Deep Link handler ───────────────────────────────────────────────────────
// Notification tap করলে এই function call করো।
// App আছে → app এর মধ্যে navigate করবে
// App নেই বা link https:// → browser এ fallback
export async function handleNotificationLink(link) {
  if (!link) return;
  try {
    console.log('[Flixify] 🔗 Opening link:', link);
    // Linking.canOpenURL দিয়ে check করো app handle করতে পারবে কিনা
    const canOpen = await Linking.canOpenURL(link);
    if (canOpen) {
      await Linking.openURL(link);
    } else {
      // fallback — https:// দিয়ে browser এ
      const httpsLink = link.replace(/^flixify:\/\//, 'https://flixify.com/');
      await Linking.openURL(httpsLink);
    }
  } catch (e) {
    console.log('[Flixify] ❌ handleNotificationLink error:', e.message);
    // last resort — browser
    try { await Linking.openURL(link); } catch (_) {}
  }
}

// ── GAS notification poll ────────────────────────────────────────────────────
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

// ── ✅ BACKGROUND TASK ────────────────────────────────────────────────────────
TaskManager.defineTask(BACKGROUND_NOTIF_TASK, async () => {
  try {
    const lastId = (await AsyncStorage.getItem('flixify_last_notif_id')) || '';
    const notifs  = await fetchNotifications(lastId);

    if (notifs.length > 0) {
      const latest = notifs[0];
      await showSystemNotification(
        latest.title,
        latest.body,
        latest.image || '',
        latest.link  || ''
      );
      await AsyncStorage.setItem('flixify_last_notif_id', String(latest.id));
      return BackgroundFetch.BackgroundFetchResult.NewData;
    }
    return BackgroundFetch.BackgroundFetchResult.NoData;
  } catch (e) {
    console.log('[BG Task] ❌ Error:', e.message);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

// ── Background Fetch register ─────────────────────────────────────────────────
export async function registerBackgroundFetch() {
  try {
    const status = await BackgroundFetch.getStatusAsync();
    if (status !== BackgroundFetch.BackgroundFetchStatus.Available) return;

    const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_NOTIF_TASK);
    if (!isRegistered) {
      await BackgroundFetch.registerTaskAsync(BACKGROUND_NOTIF_TASK, {
        minimumInterval: 15 * 60,
        stopOnTerminate:  false,
        startOnBoot:      true,
      });
      console.log('[Flixify] ✅ Background fetch registered');
    }
  } catch (e) {
    console.log('[Flixify] ❌ registerBackgroundFetch error:', e.message);
  }
}

// ── Notification listeners ────────────────────────────────────────────────────
export function setupNotificationListeners({ onReceive, onTap } = {}) {
  const receiveSub = Notifications.addNotificationReceivedListener(notif => {
    onReceive?.({
      title: notif.request.content.title || 'Flixify',
      body:  notif.request.content.body  || '',
      image: notif.request.content.data?.image || '',
      link:  notif.request.content.data?.link  || '',
    });
  });

  const responseSub = Notifications.addNotificationResponseReceivedListener(response => {
    const content = response.notification.request.content;
    const link    = content.data?.link || '';
    onTap?.({
      title: content.title || '',
      body:  content.body  || '',
      image: content.data?.image || '',
      link,
    });
    // ✅ Tap হলে link এ navigate করো
    if (link) handleNotificationLink(link);
  });

  return () => {
    receiveSub.remove();
    responseSub.remove();
  };
}
