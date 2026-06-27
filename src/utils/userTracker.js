/**
 * userTracker.js
 *
 * User ping — admin panel এ active user count track করে
 * App খুললে এবং প্রতি ৫ মিনিটে GAS এ ping পাঠায়
 */

import { Platform } from 'react-native';
import AsyncStorage  from '@react-native-async-storage/async-storage';
import { APPS_SCRIPT_URL } from './constants';

// ── Persistent Device ID ──────────────────────────────────────────────────────
async function getOrCreateDeviceId() {
  try {
    let id = await AsyncStorage.getItem('movieden_device_id');
    if (!id) {
      const rand = () => Math.random().toString(36).substring(2, 10);
      id = `${Platform.OS}-${rand()}-${rand()}`;
      await AsyncStorage.setItem('movieden_device_id', id);
    }
    return id;
  } catch (_) {
    const rand = () => Math.random().toString(36).substring(2, 10);
    return `${Platform.OS}-${rand()}-${rand()}`;
  }
}

// ── Ping GAS — user active আছে জানানো ────────────────────────────────────────
export async function pingServer() {
  try {
    const deviceId = await getOrCreateDeviceId();
    await fetch(
      `${APPS_SCRIPT_URL}?action=ping&deviceId=${encodeURIComponent(deviceId)}`
    );
    console.log('[MovieDen] ✅ Ping sent:', deviceId);
  } catch (e) {
    console.log('[MovieDen] ❌ Ping failed:', e.message);
  }
}
