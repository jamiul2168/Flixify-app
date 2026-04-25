import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function LiveUserBadge({ count, pulse }) {
  if (!count || count < 1) return null;
  return (
    <Animated.View style={[styles.badge, { opacity: pulse }]}>
      <View style={styles.dot} />
      <Ionicons name="people" size={11} color="#fff" style={{ marginRight: 3 }} />
      <Text style={styles.txt}>{count} online</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(235,0,80,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(235,0,80,0.35)',
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 3,
    gap: 3,
  },
  dot: {
    width: 6, height: 6,
    borderRadius: 3,
    backgroundColor: '#eb0050',
    marginRight: 2,
  },
  txt: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
});
