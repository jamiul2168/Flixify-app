/**
 * SplashScreenView.js  [Branding-aware]
 *
 * ✅ Admin panel থেকে app_name, logo_url, logo_emoji, splash_title,
 *    splash_subtitle, primary_color সব dynamic
 */

import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, Animated, Dimensions, StatusBar, Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../utils/constants';
import { useAppSettings } from '../utils/AppSettings';

const { width, height } = Dimensions.get('window');

export default function SplashScreenView({ onFinish, duration = 2000 }) {
  const { settings } = useAppSettings();

  const logoScale     = useRef(new Animated.Value(0.4)).current;
  const logoOpacity   = useRef(new Animated.Value(0)).current;
  const tagOpacity    = useRef(new Animated.Value(0)).current;
  const barWidth      = useRef(new Animated.Value(0)).current;
  const screenOpacity = useRef(new Animated.Value(1)).current;
  const glowAnim      = useRef(new Animated.Value(0.3)).current;

  // Branding values
  const appName      = settings.splashTitle    || settings.appName || 'Flixify';
  const subtitle     = settings.splashSubtitle || settings.appTagline || '';
  const logoUrl      = settings.logoUrl        || '';
  const logoEmoji    = settings.logoEmoji      || '🎬';
  const accentColor  = settings.primaryColor   || COLORS.cyan;
  const splashMs     = settings.splashDuration || duration;

  useEffect(() => {
    const glow = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 0.9, duration: 1000, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0.3, duration: 1000, useNativeDriver: true }),
      ])
    );
    glow.start();

    Animated.sequence([
      Animated.parallel([
        Animated.spring(logoScale, {
          toValue: 1,
          tension: 55,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(tagOpacity, {
        toValue: 1,
        duration: 400,
        delay: 100,
        useNativeDriver: true,
      }),
      Animated.timing(barWidth, {
        toValue: width * 0.5,
        duration: 1100,
        useNativeDriver: false,
      }),
      Animated.delay(splashMs > 1500 ? splashMs - 1500 : 300),
      Animated.timing(screenOpacity, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start(() => {
      glow.stop();
      if (onFinish) onFinish();
    });

    return () => glow.stop();
  }, [splashMs]);

  return (
    <Animated.View style={[styles.root, { opacity: screenOpacity }]}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      <LinearGradient
        colors={['#050508', '#0a0a12', '#050508']}
        style={StyleSheet.absoluteFill}
      />

      {/* Glow behind logo */}
      <Animated.View
        style={[
          styles.glow,
          {
            backgroundColor: accentColor,
            opacity: glowAnim,
          },
        ]}
      />

      {/* Logo */}
      <Animated.View
        style={[
          styles.logoWrap,
          { opacity: logoOpacity, transform: [{ scale: logoScale }] },
        ]}
      >
        {logoUrl ? (
          <Image
            source={{ uri: logoUrl }}
            style={[styles.logoImg, { borderColor: accentColor + '55' }]}
            resizeMode="contain"
          />
        ) : (
          <LinearGradient
            colors={[accentColor, accentColor + '88']}
            style={styles.logoEmojiBg}
          >
            <Text style={styles.logoEmojiText}>{logoEmoji}</Text>
          </LinearGradient>
        )}
      </Animated.View>

      {/* App Name + Subtitle */}
      <Animated.View style={{ opacity: tagOpacity, alignItems: 'center', marginTop: 22 }}>
        <Text style={[styles.appName, { color: accentColor }]}>{appName}</Text>
        {subtitle ? (
          <Text style={styles.subtitle}>{subtitle}</Text>
        ) : null}
      </Animated.View>

      {/* Progress bar */}
      <View style={styles.barBg}>
        <Animated.View
          style={[styles.barFill, { width: barWidth, backgroundColor: accentColor }]}
        />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#050508',
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    top: height * 0.28,
    alignSelf: 'center',
    filter: 'blur(60px)', // Works on iOS; on Android use elevation tricks
  },
  logoWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoImg: {
    width: 110,
    height: 110,
    borderRadius: 28,
    borderWidth: 2,
  },
  logoEmojiBg: {
    width: 110,
    height: 110,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoEmojiText: {
    fontSize: 54,
  },
  appName: {
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.45)',
    marginTop: 6,
    textAlign: 'center',
    paddingHorizontal: 30,
  },
  barBg: {
    position: 'absolute',
    bottom: height * 0.12,
    width: width * 0.5,
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 2,
  },
});
