/**
 * userTracker.js
 *
 * শুধু user ping — notification কিছু নেই
 * App খুললে এবং প্রতি ৫ মিনিটে GAS এ ping পাঠায়
 * এতে admin panel এ active user count দেখা যায়
 */

import { Platform } from 'react-native';
import AsyncStorage  from '@react-native-async-storage/async-storage';
import { APPS_SCRIPT_URL } from './constants';

// ── Persistent Device ID ──────────────────────────────────────────────────────
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

// ── Ping GAS — user active আছে জানানো ────────────────────────────────────────
export async function pingServer() {
  try {
    const deviceId = await getOrCreateDeviceId();
    await fetch(
      `${APPS_SCRIPT_URL}?action=ping&deviceId=${encodeURIComponent(deviceId)}`
    );
    console.log('[Flixify] ✅ Ping sent:', deviceId);
  } catch (e) {
    console.log('[Flixify] ❌ Ping failed:', e.message);
  }
}
