/**
 * App.js  [FIXED v3]
 *
 * ✅ Fix #1 — Real-time Banner: settings poll (10s) থেকে সরাসরি banner দেখায়
 *             আগে শুধু splashDone + settings change এ কাজ করতো, এখন যেকোনো সময় কাজ করবে
 * ✅ Fix #2 — Real-time Force Update: settings reload হলে তাৎক্ষণিক modal দেখায়
 * ✅ Fix #3 — Push token: type (expo/fcm) সহ GAS-এ পাঠায়
 * ✅ Fix #4 — Notification poll: lastNotifId useRef এ রাখা হয়েছে
 *             (useState এ রাখলে interval re-create হতো বারবার)
 */

import React, { useCallback, useState, useEffect, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as SplashScreen from 'expo-splash-screen';

import HomeScreen         from './src/screens/HomeScreen';
import SplashScreenView   from './src/screens/SplashScreenView';
import MaintenanceScreen  from './src/screens/MaintenanceScreen';
import BottomNav          from './src/components/BottomNav';
import NotificationBanner from './src/components/NotificationBanner';
import ForceUpdateModal   from './src/components/ForceUpdateModal';

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

  // ✅ Fix #4 — useRef দিয়ে lastNotifId রাখো: interval re-create হবে না
  const lastNotifIdRef           = useRef('');
  const pushTokenRef             = useRef(null);
  const pushTokenTypeRef         = useRef(null);
  const lastDismissedBannerTitle = useRef('');

  // ── Force update ──────────────────────────────────────────────────────────
  // settings যখনই change হয় (10s poll) তখনই needsForceUpdate re-check হয়
  const forceUpdate   = needsForceUpdate(settings);
  const inMaintenance = splashDone && settings.maintenanceMode;

  // ── ✅ Fix #1 — Real-time Banner ──────────────────────────────────────────
  // settings 10s পর পর reload হয়, settings.bannerEnabled/Title change হলেই
  // এই effect চলবে এবং তাৎক্ষণিক banner দেখাবে — splashDone লাগবে না
  useEffect(() => {
    if (
      settings.bannerEnabled &&
      settings.bannerTitle &&
      settings.bannerTitle !== lastDismissedBannerTitle.current
    ) {
      setActiveBanner({ title: settings.bannerTitle, body: settings.bannerMessage });
    }
    if (!settings.bannerEnabled) {
      setActiveBanner(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.bannerEnabled, settings.bannerTitle, settings.bannerMessage]);

  // ── Push notification setup ───────────────────────────────────────────────
  // ✅ Fix #3 — token type (expo/fcm) সহ ping করছে
  useEffect(() => {
    (async () => {
      // App start এ empty ping করো (device online দেখানোর জন্য)
      await pingServer('', '');

      const { token, type } = await registerForPushNotifications();
      pushTokenRef.current     = token;
      pushTokenTypeRef.current = type;

      if (token) {
        await pingServer(token, type);
        console.log('[Flixify] Token registered:', type, token.slice(0, 30) + '...');
      }
    })();

    const cleanup = setupNotificationListeners({
      onReceive: ({ title, body }) => setActiveBanner({ title, body }),
      onTap:     ({ title, body }) => setActiveBanner({ title, body }),
    });
    return cleanup;
  }, []);

  // ── ✅ Fix #4 — Notification poll — useRef দিয়ে interval stable ─────────
  useEffect(() => {
    const checkNotifs = async () => {
      const notifs = await fetchNotifications(lastNotifIdRef.current);
      if (notifs.length > 0) {
        const latest = notifs[0];
        setActiveBanner({ title: latest.title, body: latest.body });
        lastNotifIdRef.current = latest.id;
      }
    };

    // App খোলার 3s পরে প্রথম check
    const initialTimer = setTimeout(checkNotifs, 3000);
    // তারপর প্রতি 60s
    const interval     = setInterval(checkNotifs, 60000);
    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, []); // ✅ dependency নেই — একবার mount হলেই চলে, ref update করে

  // ── Ping every 5 min ──────────────────────────────────────────────────────
  useEffect(() => {
    const interval = setInterval(
      () => pingServer(pushTokenRef.current || '', pushTokenTypeRef.current || ''),
      300000
    );
    return () => clearInterval(interval);
  }, []);

  const onLayout = useCallback(async () => {
    await SplashScreen.hideAsync();
  }, []);

  return (
    <View style={[styles.root, { paddingBottom: insets.bottom }]} onLayout={onLayout}>
      {!splashDone && <SplashScreenView onFinish={() => setSplashDone(true)} />}

      {/* Force Update: splashDone লাগবে না — settings load হলেই দেখাবে */}
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

      {/* Banner: splashDone check নেই — যেকোনো সময় দেখাতে পারবে */}
      <NotificationBanner
        notification={activeBanner}
        onDismiss={() => {
          if (activeBanner?.title) {
            lastDismissedBannerTitle.current = activeBanner.title;
          }
          setActiveBanner(null);
        }}
      />
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
