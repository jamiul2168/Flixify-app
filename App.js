/**
 * App.js  [FIXED v2]
 * ✅ Fix #1 — Force Update: splashDone নির্বিশেষে settings reload হলে re-check হয়
 * ✅ Fix #2 — In-App Banner: dismiss করলেও পরের reload-এ আবার দেখাবে (lastDismissedTitle track)
 * ✅ Fix #3 — pingServer(null) → token=null string পাঠাতো, এখন token='' পাঠাবে
 * ✅ Fix #4 — Notification poll: app খোলার সাথে সাথেই একবার চেক করে, তারপর 60s interval
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

  // ✅ Fix #2 — dismiss করা banner title track করতে
  const lastDismissedBannerTitle = useRef('');

  const pushToken = useRef(null);

  // ✅ Fix #1 — splashDone dependency সরানো হয়েছে
  // settings load হলেই forceUpdate check হবে, splash-এর জন্য অপেক্ষা করবে না
  const forceUpdate   = needsForceUpdate(settings);
  const inMaintenance = splashDone && settings.maintenanceMode;

  // ── Banner (GAS settings থেকে) ────────────────────────────────────────────
  // ✅ Fix #2 — Banner dismiss করলেও পরে নতুন banner (ভিন্ন title) আসলে দেখাবে
  useEffect(() => {
    if (!splashDone) return;
    if (
      settings.bannerEnabled &&
      settings.bannerTitle &&
      settings.bannerTitle !== lastDismissedBannerTitle.current
    ) {
      setActiveBanner({ title: settings.bannerTitle, body: settings.bannerMessage });
    }
    // bannerEnabled false হলে dismiss
    if (!settings.bannerEnabled) {
      setActiveBanner(null);
    }
  }, [splashDone, settings.bannerEnabled, settings.bannerTitle, settings.bannerMessage]);

  // ── Push notification + instant ping ──────────────────────────────────────
  useEffect(() => {
    (async () => {
      // ✅ Fix #3 — null-এর বদলে '' পাঠাচ্ছি, GAS-এ "null" string আসবে না
      await pingServer('');
      const token = await registerForPushNotifications();
      pushToken.current = token;
      if (token) await pingServer(token);
    })();

    const cleanup = setupNotificationListeners({
      onReceive: ({ title, body }) => setActiveBanner({ title, body }),
      onTap:     ({ title, body }) => setActiveBanner({ title, body }),
    });
    return cleanup;
  }, []);

  // ── Notification poll — app খোলার সাথে সাথে + প্রতি 60s ─────────────────
  // ✅ Fix #4 — immediate first check
  useEffect(() => {
    const checkNotifs = async () => {
      const notifs = await fetchNotifications(lastNotifId);
      if (notifs.length > 0) {
        const latest = notifs[0];
        setActiveBanner({ title: latest.title, body: latest.body });
        setLastNotifId(latest.id);
      }
    };

    // App খোলার পরপরই একবার check করো
    const initialTimer = setTimeout(checkNotifs, 3000);
    const interval = setInterval(checkNotifs, 60000);
    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, [lastNotifId]);

  // ── Ping every 5 min ──────────────────────────────────────────────────────
  useEffect(() => {
    const interval = setInterval(() => pingServer(pushToken.current || ''), 300000);
    return () => clearInterval(interval);
  }, []);

  const onLayout = useCallback(async () => {
    await SplashScreen.hideAsync();
  }, []);

  return (
    <View style={[styles.root, { paddingBottom: insets.bottom }]} onLayout={onLayout}>
      {!splashDone && <SplashScreenView onFinish={() => setSplashDone(true)} />}

      {/* ✅ Fix #1 — splashDone check সরানো হয়েছে — splash চলাকালীনও force update দেখাবে */}
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
          onDismiss={() => {
            // ✅ Fix #2 — dismiss করলে title remember করো
            if (activeBanner?.title) {
              lastDismissedBannerTitle.current = activeBanner.title;
            }
            setActiveBanner(null);
          }}
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
