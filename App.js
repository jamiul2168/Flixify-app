/**
 * App.js  [FIXED VERSION]
 * ✅ LiveUserBadge সরানো হয়েছে
 * ✅ Token সাথে সাথেই GAS-এ যায়
 * ✅ lastNotifId string দিয়ে track
 */

import React, { useCallback, useState, useEffect, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as SplashScreen from 'expo-splash-screen';

import HomeScreen from './src/screens/HomeScreen';
import SplashScreenView from './src/screens/SplashScreenView';
import MaintenanceScreen from './src/screens/MaintenanceScreen';
import BottomNav from './src/components/BottomNav';
import NotificationBanner from './src/components/NotificationBanner';
import ForceUpdateModal from './src/components/ForceUpdateModal';

import {
  registerForPushNotifications,
  pingServer,
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
  const { settings, reload: reloadSettings } = useAppSettings();

  const [splashDone,   setSplashDone]   = useState(false);
  const [activeTab,    setActiveTab]    = useState('home');
  const [show18,       setShow18]       = useState(false);
  const [activeBanner, setActiveBanner] = useState(null);
  const [lastNotifId,  setLastNotifId]  = useState('');

  const pushToken = useRef(null);

  const forceUpdate   = splashDone && needsForceUpdate(settings);
  const inMaintenance = splashDone && settings.maintenanceMode;

  // ── Banner (GAS settings থেকে) ────────────────────────────────────────────
  useEffect(() => {
    if (!splashDone) return;
    if (settings.bannerEnabled && settings.bannerTitle) {
      setActiveBanner({ title: settings.bannerTitle, body: settings.bannerMessage });
    }
  }, [splashDone, settings.bannerEnabled, settings.bannerTitle]);

  // ── Push notification + instant ping ──────────────────────────────────────
  useEffect(() => {
    (async () => {
      // Step 1: INSTANT ping — token ছাড়াই sheet-এ যুক্ত হয়
      await pingServer(null);
      // Step 2: Background-এ token নেওয়া (3-5s)
      const token = await registerForPushNotifications();
      pushToken.current = token;
      // Step 3: Token পেলে sheet-এ update
      if (token) await pingServer(token);
    })();

    const cleanup = setupNotificationListeners({
      onReceive: ({ title, body }) => setActiveBanner({ title, body }),
      onTap:     ({ title, body }) => setActiveBanner({ title, body }),
    });
    return cleanup;
  }, []);

  // ── Notification poll — প্রতি 60s ─────────────────────────────────────────
  useEffect(() => {
    const checkNotifs = async () => {
      const notifs = await fetchNotifications(lastNotifId);
      if (notifs.length > 0) {
        const latest = notifs[0];
        setActiveBanner({ title: latest.title, body: latest.body });
        setLastNotifId(latest.id);
      }
    };
    const interval = setInterval(checkNotifs, 60000);
    return () => clearInterval(interval);
  }, [lastNotifId]);

  // ── Ping every 5 min ──────────────────────────────────────────────────────
  useEffect(() => {
    const interval = setInterval(() => pingServer(pushToken.current), 300000);
    return () => clearInterval(interval);
  }, []);

  const onLayout = useCallback(async () => {
    await SplashScreen.hideAsync();
  }, []);

  return (
    <View style={[styles.root, { paddingBottom: insets.bottom }]} onLayout={onLayout}>
      {!splashDone && <SplashScreenView onFinish={() => setSplashDone(true)} />}

      <ForceUpdateModal visible={forceUpdate} settings={settings} />

      {inMaintenance && !forceUpdate ? (
        <MaintenanceScreen message={settings.maintenanceMessage} onRetry={reloadSettings} />
      ) : (
        <View style={styles.content}>
          <HomeScreen show18={show18} settings={settings} />
        </View>
      )}

      {splashDone && !forceUpdate && (
        <BottomNav
          activeTab={activeTab}
          onTabChange={setActiveTab}
          show18={show18}
          onToggle18={() => setShow18(p => !p)}
          settings={settings}
        />
      )}

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
