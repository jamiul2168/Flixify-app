import React, { useCallback } from 'react';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as SplashScreen from 'expo-splash-screen';
import HomeScreen from './src/screens/HomeScreen';

SplashScreen.preventAutoHideAsync();

export default function App() {
  const onLayout = useCallback(async () => {
    await SplashScreen.hideAsync();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <View style={{ flex: 1, backgroundColor: '#050508' }} onLayout={onLayout}>
          <HomeScreen />
        </View>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
