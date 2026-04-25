import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, Animated, TouchableOpacity, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export default function NotificationBanner({ notification, onDismiss }) {
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity    = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!notification) return;

    // Slide in
    Animated.parallel([
      Animated.spring(translateY, { toValue: 0, tension: 70, friction: 10, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();

    // Auto dismiss after 5s
    const t = setTimeout(() => dismiss(), 5000);
    return () => clearTimeout(t);
  }, [notification]);

  const dismiss = () => {
    Animated.parallel([
      Animated.timing(translateY, { toValue: -120, duration: 300, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start(() => onDismiss?.());
  };

  if (!notification) return null;

  return (
    <Animated.View style={[styles.container, { transform: [{ translateY }], opacity }]}>
      <View style={styles.iconWrap}>
        <Ionicons name="notifications" size={18} color="#eb0050" />
      </View>
      <View style={styles.textWrap}>
        <Text style={styles.title} numberOfLines={1}>{notification.title}</Text>
        <Text style={styles.body} numberOfLines={2}>{notification.body}</Text>
      </View>
      <TouchableOpacity onPress={dismiss} style={styles.close}>
        <Ionicons name="close" size={16} color="rgba(255,255,255,0.5)" />
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 10,
    left: 14,
    right: 14,
    backgroundColor: '#1a1a28',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(235,0,80,0.25)',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 10,
    zIndex: 9999,
    elevation: 20,
    shadowColor: '#eb0050',
    shadowOpacity: 0.25,
    shadowRadius: 16,
  },
  iconWrap: {
    width: 36, height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(235,0,80,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: { flex: 1 },
  title: { color: '#fff', fontSize: 13, fontWeight: '800', marginBottom: 2 },
  body:  { color: 'rgba(255,255,255,0.55)', fontSize: 11, lineHeight: 15 },
  close: { padding: 4 },
});
