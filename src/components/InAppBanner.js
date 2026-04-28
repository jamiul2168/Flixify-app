/**
 * InAppBanner.js  [CLEAN v1]
 *
 * Admin panel থেকে banner_enabled ON করলে app এ এই banner দেখাবে
 * - Slide down animation
 * - X বাটনে dismiss
 * - ৮ সেকেন্ড পর auto dismiss
 */

import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, Animated, TouchableOpacity, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../utils/constants';

const { width } = Dimensions.get('window');

export default function InAppBanner({ title, message, onDismiss }) {
  const translateY = useRef(new Animated.Value(-130)).current;
  const opacity    = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Slide in
    Animated.parallel([
      Animated.spring(translateY, {
        toValue: 0, tension: 65, friction: 10, useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1, duration: 280, useNativeDriver: true,
      }),
    ]).start();

    // Auto dismiss ৮ সেকেন্ড পর
    const t = setTimeout(dismiss, 8000);
    return () => clearTimeout(t);
  }, [title, message]);

  const dismiss = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -130, duration: 300, useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0, duration: 300, useNativeDriver: true,
      }),
    ]).start(() => onDismiss?.());
  };

  return (
    <Animated.View style={[styles.container, { transform: [{ translateY }], opacity }]}>
      <View style={styles.iconWrap}>
        <Ionicons name="megaphone-outline" size={20} color={COLORS.cyan} />
      </View>

      <View style={styles.textWrap}>
        {!!title && (
          <Text style={styles.title} numberOfLines={1}>{title}</Text>
        )}
        {!!message && (
          <Text style={styles.body} numberOfLines={3}>{message}</Text>
        )}
      </View>

      <TouchableOpacity onPress={dismiss} style={styles.closeBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Ionicons name="close" size={17} color="rgba(255,255,255,0.45)" />
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position:        'absolute',
    top:             10,
    left:            14,
    right:           14,
    backgroundColor: '#13131f',
    borderRadius:    16,
    borderWidth:     1,
    borderColor:     'rgba(0,229,255,0.22)',
    flexDirection:   'row',
    alignItems:      'flex-start',
    padding:         13,
    gap:             10,
    zIndex:          9999,
    elevation:       24,
    shadowColor:     COLORS.cyan,
    shadowOpacity:   0.18,
    shadowRadius:    18,
    shadowOffset:    { width: 0, height: 4 },
  },
  iconWrap: {
    width:           38,
    height:          38,
    borderRadius:    19,
    backgroundColor: 'rgba(0,229,255,0.10)',
    borderWidth:     1,
    borderColor:     'rgba(0,229,255,0.2)',
    alignItems:      'center',
    justifyContent:  'center',
    marginTop:       1,
    flexShrink:      0,
  },
  textWrap: {
    flex: 1,
  },
  title: {
    color:        COLORS.white,
    fontSize:     13,
    fontWeight:   '800',
    marginBottom: 3,
    letterSpacing: -0.2,
  },
  body: {
    color:      'rgba(255,255,255,0.55)',
    fontSize:   11,
    lineHeight: 16,
  },
  closeBtn: {
    paddingTop: 2,
    flexShrink: 0,
  },
});
