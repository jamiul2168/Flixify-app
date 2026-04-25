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
  const [activeTab,  setActiveTab]  = useState('home');
  const [show18,     setShow18]     = useState(false);

  const onLayout = useCallback(async () => {
    await SplashScreen.hideAsync();
  }, []);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  return (
    <View
      style={[styles.root, { paddingBottom: insets.bottom }]}
      onLayout={onLayout}
    >
      {!splashDone && (
        <SplashScreenView onFinish={() => setSplashDone(true)} />
      )}

      <View style={styles.content}>
        <HomeScreen show18={show18} />
      </View>

      {splashDone && (
        <BottomNav
          activeTab={activeTab}
          onTabChange={handleTabChange}
          show18={show18}
          onToggle18={() => setShow18(p => !p)}
        />
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
