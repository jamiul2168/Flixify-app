/**
 * App.js  [FIXED VERSION]
 *
 * Bug Fixes:
 * ✅ Bug #2 — lastNotifId এখন string ID track করে (আগে number 0 ছিল, এখন '' string)
 *             GAS-এর N-prefix ID-র সাথে সঠিকভাবে compare হবে
 * ✅ Bug #2 — notification poll-এ latest.id সঠিকভাবে save হচ্ছে
 */

import React, { useCallback, useState, useEffect, useRef } from 'react';
import { View, StyleSheet, StatusBar } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as SplashScreen from 'expo-splash-screen';
import { Animated } from 'react-native';

import HomeScreen from './src/screens/HomeScreen';
import SplashScreenView from './src/screens/SplashScreenView';
import MaintenanceScreen from './src/screens/MaintenanceScreen';
import BottomNav from './src/components/BottomNav';
import NotificationBanner from './src/components/NotificationBanner';
import ForceUpdateModal from './src/components/ForceUpdateModal';

import {
  registerForPushNotifications,
  pingServer,
  fetchLiveUserCount,
  fetchNotifications,
  setupNotificationListeners,
} from './src/utils/notifications';
import {
  AppSettingsProvider,
  useAppSettings,
  needsForceUpdate,
} from './src/utils/AppSettings';

SplashScreen.preventAutoHideAsync();

function AppContent() {
  const insets = useSafeAreaInsets();
  const { settings, loading: settingsLoading, reload: reloadSettings } = useAppSettings();

  const [splashDone,   setSplashDone]   = useState(false);
  const [activeTab,    setActiveTab]    = useState('home');
  const [show18,       setShow18]       = useState(false);
  const [liveCount,    setLiveCount]    = useState(0);
  const [activeBanner, setActiveBanner] = useState(null);

  // ✅ FIX Bug #2 — '' (empty string) দিয়ে শুরু
  // GAS-এর ID format হলো "N1234567890" — string compare সঠিক হবে
  const [lastNotifId,  setLastNotifId]  = useState('');

  const pushToken = useRef(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // ── Force update দরকার কিনা ───────────────────────────────────────────────
  const forceUpdate = splashDone && needsForceUpdate(settings);

  // ── Maintenance mode ──────────────────────────────────────────────────────
  const inMaintenance = splashDone && settings.maintenanceMode;

  // ── Banner popup (from GAS settings) ─────────────────────────────────────
  useEffect(() => {
    if (!splashDone) return;
    if (settings.bannerEnabled && settings.bannerTitle) {
      setActiveBanner({ title: settings.bannerTitle, body: settings.bannerMessage });
    }
  }, [splashDone, settings.bannerEnabled, settings.bannerTitle]);

  // ── Pulse animation for live badge ───────────────────────────────────────
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 0.5, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1,   duration: 800, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  // ── Push notification setup ───────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      // ✅ App খুলতেই INSTANT ping — token-এর জন্য অপেক্ষা নেই
      // token ছাড়াই sheet-এ যুক্ত হবে, পরে token পেলে update হবে
      await pingServer(null);

      // Background-এ token নেওয়া চলতে থাকে
      const token = await registerForPushNotifications();
      pushToken.current = token;
      // Token পাওয়া গেলে sheet-এ update করো
      if (token) await pingServer(token);
    })();

    const cleanup = setupNotificationListeners({
      onReceive: ({ title, body }) => setActiveBanner({ title, body }),
      onTap:     ({ title, body }) => setActiveBanner({ title, body }),
    });
    return cleanup;
  }, []);

  // ── Live user count — প্রতি 30s ──────────────────────────────────────────
  useEffect(() => {
    const tick = async () => {
      const count = await fetchLiveUserCount();
      setLiveCount(count);
    };
    tick();
    const interval = setInterval(tick, 30000);
    return () => clearInterval(interval);
  }, []);

  // ── Notification poll — প্রতি 60s ────────────────────────────────────────
  // ✅ FIX Bug #2 — lastNotifId এখন string, GAS-এর N-prefix ID-র সাথে match করে
  useEffect(() => {
    const checkNotifs = async () => {
      const notifs = await fetchNotifications(lastNotifId);
      if (notifs.length > 0) {
        // সবচেয়ে নতুনটা দেখাও (index 0 = newest, GAS reverse করে পাঠায়)
        const latest = notifs[0];
        setActiveBanner({ title: latest.title, body: latest.body });
        // ✅ latest.id save করো — string format "N1234567890"
        setLastNotifId(latest.id);
      }
    };
    const interval = setInterval(checkNotifs, 60000);
    return () => clearInterval(interval);
  }, [lastNotifId]);

  // ── Ping every 5 min ─────────────────────────────────────────────────────
  useEffect(() => {
    const interval = setInterval(() => {
      pingServer(pushToken.current);
    }, 300000);
    return () => clearInterval(interval);
  }, []);

  const onLayout = useCallback(async () => {
    await SplashScreen.hideAsync();
  }, []);

  return (
    <View
      style={[styles.root, { paddingBottom: insets.bottom }]}
      onLayout={onLayout}
    >
      {/* Splash */}
      {!splashDone && (
        <SplashScreenView onFinish={() => setSplashDone(true)} />
      )}

      {/* Force update — সব কিছু block করে */}
      <ForceUpdateModal
        visible={forceUpdate}
        settings={settings}
      />

      {/* Maintenance */}
      {inMaintenance && !forceUpdate ? (
        <MaintenanceScreen
          message={settings.maintenanceMessage}
          onRetry={reloadSettings}
        />
      ) : (
        <View style={styles.content}>
          <HomeScreen
            show18={show18}
            liveCount={liveCount}
            pulseAnim={pulseAnim}
            settings={settings}
          />
        </View>
      )}

      {/* Bottom Nav */}
      {splashDone && !forceUpdate && (
        <BottomNav
          activeTab={activeTab}
          onTabChange={setActiveTab}
          show18={show18}
          onToggle18={() => setShow18(p => !p)}
          settings={settings}
        />
      )}

      {/* In-app notification banner */}
      {splashDone && (
        <NotificationBanner
          notification={activeBanner}
          onDismiss={() => setActiveBanner(null)}
        />
      )}
    </View>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AppSettingsProvider>
          <AppContent />
        </AppSettingsProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root:    { flex: 1, backgroundColor: '#050508' },
  content: { flex: 1 },
});
