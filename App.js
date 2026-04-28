/**
 * App.js  [CLEAN v1]
 *
 * ✅ Notification সিস্টেম সম্পূর্ণ বাদ
 * ✅ Active user ping (5 মিনিট পর পর)
 * ✅ Force Update Modal
 * ✅ In-App Banner (settings থেকে)
 * ✅ Maintenance Mode
 * ✅ Splash Screen
 */

import React, { useCallback, useState, useEffect, useRef } from 'react';
import { View, StyleSheet, AppState } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as SplashScreen from 'expo-splash-screen';

import HomeScreen        from './src/screens/HomeScreen';
import SplashScreenView  from './src/screens/SplashScreenView';
import MaintenanceScreen from './src/screens/MaintenanceScreen';
import BottomNav         from './src/components/BottomNav';
import InAppBanner       from './src/components/InAppBanner';
import ForceUpdateModal  from './src/components/ForceUpdateModal';

import { pingServer }                         from './src/utils/userTracker';
import { AppSettingsProvider, useAppSettings, needsForceUpdate } from './src/utils/AppSettings';

SplashScreen.preventAutoHideAsync();

function AppContent() {
  const insets = useSafeAreaInsets();
  const { settings, reload: reloadSettings } = useAppSettings();

  const [splashDone,   setSplashDone]   = useState(false);
  const [activeTab,    setActiveTab]    = useState('home');
  const [show18,       setShow18]       = useState(false);
  const [showBanner,   setShowBanner]   = useState(false);

  const lastDismissedBannerTitle = useRef('');

  const forceUpdate   = needsForceUpdate(settings);
  const inMaintenance = splashDone && settings.maintenanceMode;

  // ── User ping on start + প্রতি 5 মিনিটে ─────────────────────────────────
  useEffect(() => {
    pingServer();
    const iv = setInterval(pingServer, 5 * 60 * 1000);
    return () => clearInterval(iv);
  }, []);

  // ── In-App Banner — settings থেকে ────────────────────────────────────────
  // bannerEnabled ON হলে এবং আগে dismiss না করলে দেখাবে
  useEffect(() => {
    if (
      settings.bannerEnabled &&
      settings.bannerTitle &&
      settings.bannerTitle !== lastDismissedBannerTitle.current
    ) {
      setShowBanner(true);
    } else if (!settings.bannerEnabled) {
      setShowBanner(false);
    }
  }, [settings.bannerEnabled, settings.bannerTitle, settings.bannerMessage]);

  const onLayout = useCallback(async () => {
    await SplashScreen.hideAsync();
  }, []);

  return (
    <View style={[styles.root, { paddingBottom: insets.bottom }]} onLayout={onLayout}>

      {/* Splash */}
      {!splashDone && (
        <SplashScreenView
          duration={settings.splashDuration || 2000}
          onFinish={() => setSplashDone(true)}
        />
      )}

      {/* Force Update — সব কিছুর উপরে */}
      <ForceUpdateModal visible={forceUpdate} settings={settings} />

      {/* Main Content */}
      {inMaintenance && !forceUpdate ? (
        <MaintenanceScreen
          message={settings.maintenanceMessage}
          onRetry={reloadSettings}
        />
      ) : (
        <View style={styles.content}>
          <HomeScreen show18={show18} settings={settings} />
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

      {/* In-App Banner */}
      {splashDone && showBanner && (
        <InAppBanner
          title={settings.bannerTitle}
          message={settings.bannerMessage}
          onDismiss={() => {
            lastDismissedBannerTitle.current = settings.bannerTitle;
            setShowBanner(false);
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
