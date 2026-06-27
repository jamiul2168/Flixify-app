import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Dimensions, Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const CYAN = '#00f2ff';

export default function BottomNav({ settings = {} }) {
  const insets = useSafeAreaInsets();

  const telegramUrl = settings.telegramUrl || 'https://t.me/movieden';
  const requestUrl  = settings.requestUrl  || 'https://movieden.app/';

  const openTelegram = () => Linking.openURL(telegramUrl).catch(() => {});
  const openRequest  = () => Linking.openURL(requestUrl).catch(() => {});

  return (
    <View style={[s.nav, { paddingBottom: insets.bottom + 6 }]}>
      <TouchableOpacity style={s.item} onPress={() => {}} activeOpacity={0.8}>
        <Ionicons name="search" size={22} color={CYAN} />
        <Text style={[s.lbl, { color: CYAN }]}>Search</Text>
      </TouchableOpacity>
      <TouchableOpacity style={s.item} onPress={openRequest} activeOpacity={0.8}>
        <Ionicons name="add-circle-outline" size={22} color="rgba(255,255,255,0.45)" />
        <Text style={s.lbl}>Request</Text>
      </TouchableOpacity>
      <TouchableOpacity style={s.item} onPress={openTelegram} activeOpacity={0.8}>
        <Ionicons name="paper-plane-outline" size={22} color="rgba(255,255,255,0.45)" />
        <Text style={s.lbl}>Telegram</Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  nav: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: 'rgba(3,3,3,0.97)',
    borderTopWidth: 1, borderTopColor: 'rgba(0,242,255,0.12)',
    flexDirection: 'row', justifyContent: 'space-around',
    paddingTop: 8,
  },
  item: { alignItems: 'center', gap: 3, paddingHorizontal: 20, paddingVertical: 4 },
  lbl:  { color: 'rgba(255,255,255,0.45)', fontSize: 10, fontWeight: '600' },
});
