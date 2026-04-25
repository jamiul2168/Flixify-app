import React, { useCallback, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as SplashScreen from 'expo-splash-screen';
import HomeScreen from './src/screens/HomeScreen';
import SplashScreenView from './src/screens/SplashScreenView';
import BottomNav from './src/components/BottomNav';

SplashScreen.preventAutoHideAsync();

function AppContent() {
  const insets = useSafeAreaInsets();
  const [splashDone, setSplashDone] = useState(false);
  const [activeTab, setActiveTab]   = useState('home');

  const onLayout = useCallback(async () => {
    await SplashScreen.hideAsync();
  }, []);

  return (
    <View
      style={[styles.root, { paddingBottom: insets.bottom }]}
      onLayout={onLayout}
    >
      {/* Custom Splash */}
      {!splashDone && (
        <SplashScreenView onFinish={() => setSplashDone(true)} />
      )}

      {/* Main content */}
      <View style={styles.content}>
        {activeTab === 'home'     && <HomeScreen />}
        {activeTab === 'search'   && <HomeScreen initialSearch={true} />}
        {activeTab === 'trending' && <HomeScreen showTrending={true} />}
        {activeTab === 'settings' && <HomeScreen />}
      </View>

      {/* Bottom Nav */}
      {splashDone && (
        <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
      )}
    </View>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AppContent />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root:    { flex: 1, backgroundColor: '#050508' },
  content: { flex: 1 },
});
