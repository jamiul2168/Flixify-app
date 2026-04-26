import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../utils/constants';

export default function MaintenanceScreen({ message, onRetry }) {
  return (
    <View style={styles.container}>
      <Ionicons name="construct-outline" size={72} color={COLORS.gold} />
      <Text style={styles.title}>রক্ষণাবেক্ষণ চলছে</Text>
      <Text style={styles.message}>{message || '🔧 আমরা কিছু কাজ করছি, একটু পরে আসুন।'}</Text>
      <TouchableOpacity style={styles.btn} onPress={onRetry}>
        <Ionicons name="refresh" size={16} color="#000" />
        <Text style={styles.btnTxt}>Retry</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 36,
  },
  title: {
    color: COLORS.white,
    fontSize: 22,
    fontWeight: '800',
    marginTop: 20,
    marginBottom: 12,
    letterSpacing: -0.4,
  },
  message: {
    color: COLORS.gray,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.gold,
    paddingHorizontal: 32,
    paddingVertical: 13,
    borderRadius: 30,
  },
  btnTxt: { color: '#000', fontWeight: '800', fontSize: 14 },
});
