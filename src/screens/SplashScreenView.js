/**
 * SplashScreenView.js — MovieDen
 *
 * ✅ Admin panel থেকে splash_bg_url, splash_bg_color control হবে
 * ✅ logo_url থাকলে network থেকে load, না থাকলে local assets/logo.png
 * ✅ app_name admin থেকে নেবে
 */

import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, Animated, Dimensions, StatusBar, Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');
const LOCAL_LOGO = require('../assets/logo.png');

export default function SplashScreenView({ onFinish, duration = 2000, settings = {} }) {
  const logoScale     = useRef(new Animated.Value(0.4)).current;
  const logoOpacity   = useRef(new Animated.Value(0)).current;
  const tagOpacity    = useRef(new Animated.Value(0)).current;
  const barWidth      = useRef(new Animated.Value(0)).current;
  const screenOpacity = useRef(new Animated.Value(1)).current;
  const glowAnim      = useRef(new Animated.Value(0.3)).current;

  const appName   = settings.appName      || 'MovieDen';
  const appTagline= settings.appTagline   || 'Your ultimate movie destination';
  const logoUrl   = settings.logoUrl      || '';
  const bgColor   = settings.splashBgColor|| '#050508';
  const bgUrl     = settings.splashBgUrl  || '';

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
        duration: duration - 900 > 400 ? duration - 900 : 1100,
        useNativeDriver: false,
      }),
      Animated.delay(300),
      Animated.timing(screenOpacity, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start(() => {
      glow.stop();
      onFinish();
    });
  }, []);

  return (
    <Animated.View style={[styles.container, { opacity: screenOpacity, backgroundColor: bgColor }]}>
      <StatusBar barStyle="light-content" backgroundColor={bgColor} />

      {/* Background image যদি থাকে */}
      {bgUrl ? (
        <Image
          source={{ uri: bgUrl }}
          style={StyleSheet.absoluteFillObject}
          resizeMode="cover"
        />
      ) : null}

      {/* Dark overlay */}
      <View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(0,0,0,0.55)' }]} />

      {/* Glow behind logo */}
      <Animated.View style={[styles.glow, { opacity: glowAnim }]} />

      {/* Logo — network থেকে যদি logo_url থাকে, না থাকলে local */}
      <Animated.View style={[
        styles.logoWrap,
        { opacity: logoOpacity, transform: [{ scale: logoScale }] },
      ]}>
        <Image
          source={logoUrl ? { uri: logoUrl } : LOCAL_LOGO}
          style={styles.logoImg}
          resizeMode="contain"
        />
      </Animated.View>

      {/* App Name — admin থেকে নেবে */}
      <Animated.Text style={[styles.appName, { opacity: tagOpacity }]}>
        {appName}
      </Animated.Text>

      {/* Tagline */}
      <Animated.Text style={[styles.tagText, { opacity: tagOpacity }]}>
        {appTagline}
      </Animated.Text>

      {/* Progress bar */}
      <Animated.View style={styles.barTrack}>
        <Animated.View style={[styles.barFill, { width: barWidth }]}>
          <LinearGradient
            colors={['#ff2d8d', '#7c3aed', '#1a6eff']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      </Animated.View>

      <Animated.Text style={[styles.loadingTxt, { opacity: tagOpacity }]}>
        Loading...
      </Animated.Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
  glow: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(180,0,120,0.10)',
    alignSelf: 'center',
    top: height / 2 - 200,
  },
  logoWrap: {
    alignItems: 'center',
    marginBottom: 16,
  },
  logoImg: {
    width: 110,
    height: 110,
    borderRadius: 24,
  },
  appName: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  tagText: {
    color: 'rgba(255,255,255,0.40)',
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 0.8,
    marginBottom: 32,
  },
  barTrack: {
    width: width * 0.5,
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 10,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 10,
    overflow: 'hidden',
  },
  loadingTxt: {
    color: 'rgba(255,255,255,0.22)',
    fontSize: 11,
    marginTop: 14,
    letterSpacing: 1.2,
    fontWeight: '500',
  },
});
