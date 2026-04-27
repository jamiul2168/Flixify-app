/**
 * App.js  [FIXED v4]
 *
 * ✅ মূল Fix — GAS poll এ নতুন notification এলে:
 *    → showSystemNotification() call করে (status bar এ আসে)
 *    → App OPEN থাকলে additionaly in-app banner ও দেখায়
 *    আগে শুধু setActiveBanner() করতো — শুধু in-app banner আসতো
 */

import React, { useCallback, useState, useEffect, useRef } from 'react';
import { View, StyleSheet, AppState } from 'react-native';
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
  showSystemNotification,
  setupNotificationListeners,
  registerBackgroundFetch,
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

  const lastNotifIdRef           = useRef('');
  const pushTokenRef             = useRef(null);
  const pushTokenTypeRef         = useRef(null);
  const lastDismissedBannerTitle = useRef('');
  const appStateRef              = useRef(AppState.currentState);

  const forceUpdate   = needsForceUpdate(settings);
  const inMaintenance = splashDone && settings.maintenanceMode;

  // ── AppState track (foreground/background) ────────────────────────────────
  useEffect(() => {
    const sub = AppState.addEventListener('change', next => {
      appStateRef.current = next;
    });
    return () => sub.remove();
  }, []);

  // ── Real-time Banner (settings poll থেকে) ────────────────────────────────
  useEffect(() => {
    if (
      settings.bannerEnabled &&
      settings.bannerTitle &&
      settings.bannerTitle !== lastDismissedBannerTitle.current
    ) {
      setActiveBanner({ title: settings.bannerTitle, body: settings.bannerMessage });
    }
    if (!settings.bannerEnabled) setActiveBanner(null);
  }, [settings.bannerEnabled, settings.bannerTitle, settings.bannerMessage]);

  // ── Push token registration ───────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      await pingServer('', '');
      const { token, type } = await registerForPushNotifications();
      pushTokenRef.current     = token;
      pushTokenTypeRef.current = type;
      if (token) await pingServer(token, type);
      // ✅ Background fetch register — App kill হলেও notification আসবে
      await registerBackgroundFetch();
    })();

    const cleanup = setupNotificationListeners({
      // FCM/Expo থেকে সরাসরি push এলে in-app banner দেখাও
      onReceive: ({ title, body }) => setActiveBanner({ title, body }),
      onTap:     ({ title, body }) => setActiveBanner({ title, body }),
    });
    return cleanup;
  }, []);

  // ── ✅ GAS Notification Poll ──────────────────────────────────────────────
  // নতুন notification পেলে:
  //   - সবসময় → showSystemNotification() → status bar এ আসবে
  //   - App foreground এ থাকলে → in-app banner ও দেখাবে
  useEffect(() => {
    const checkNotifs = async () => {
      const notifs = await fetchNotifications(lastNotifIdRef.current);
      if (notifs.length > 0) {
        const latest = notifs[0];

        // ✅ System notification — app open/closed যাই হোক status bar এ আসবে
        await showSystemNotification(latest.title, latest.body);

        // App foreground এ থাকলে in-app banner ও দেখাও
        if (appStateRef.current === 'active') {
          setActiveBanner({ title: latest.title, body: latest.body });
        }

        lastNotifIdRef.current = latest.id;
      }
    };

    const initialTimer = setTimeout(checkNotifs, 3000);
    const interval     = setInterval(checkNotifs, 60000);
    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, []);

  // ── Ping every 5 min ──────────────────────────────────────────────────────
  useEffect(() => {
    const iv = setInterval(
      () => pingServer(pushTokenRef.current || '', pushTokenTypeRef.current || ''),
      300000
    );
    return () => clearInterval(iv);
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

      <NotificationBanner
        notification={activeBanner}
        onDismiss={() => {
          if (activeBanner?.title) lastDismissedBannerTitle.current = activeBanner.title;
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
