import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, Animated, Dimensions, StatusBar, Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../utils/constants';

const { width, height } = Dimensions.get('window');
const LOGO = require('../assets/logo.png');

export default function SplashScreenView({ onFinish }) {
  const logoScale     = useRef(new Animated.Value(0.4)).current;
  const logoOpacity   = useRef(new Animated.Value(0)).current;
  const tagOpacity    = useRef(new Animated.Value(0)).current;
  const barWidth      = useRef(new Animated.Value(0)).current;
  const screenOpacity = useRef(new Animated.Value(1)).current;
  const glowAnim      = useRef(new Animated.Value(0.3)).current;

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
    <Animated.View style={[styles.container, { opacity: screenOpacity }]}>
      <StatusBar barStyle="light-content" backgroundColor="#050508" />

      {/* Glow behind logo */}
      <Animated.View style={[styles.glow, { opacity: glowAnim }]} />

      {/* Logo — লোগোতেই Flixify লেখা আছে, আলাদা টেক্সট নেই */}
      <Animated.View style={[
        styles.logoWrap,
        { opacity: logoOpacity, transform: [{ scale: logoScale }] },
      ]}>
        <Image source={LOGO} style={styles.logoImg} resizeMode="contain" />
      </Animated.View>

      {/* Tagline */}
      <Animated.Text style={[styles.tagText, { opacity: tagOpacity }]}>
        Movies &amp; Series — All in One
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
    backgroundColor: '#050508',
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
    marginBottom: 28,
  },
  logoImg: {
    width: 110,
    height: 110,
    borderRadius: 24,
  },
  tagText: {
    color: 'rgba(255,255,255,0.30)',
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
