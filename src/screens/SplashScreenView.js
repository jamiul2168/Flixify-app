import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, Animated, Dimensions, StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../utils/constants';

const { width, height } = Dimensions.get('window');

export default function SplashScreenView({ onFinish }) {
  const logoScale   = useRef(new Animated.Value(0.3)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const tagOpacity  = useRef(new Animated.Value(0)).current;
  const barWidth    = useRef(new Animated.Value(0)).current;
  const screenOpacity = useRef(new Animated.Value(1)).current;

  // Glow pulse
  const glowAnim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    // Glow loop
    const glow = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0.4, duration: 900, useNativeDriver: true }),
      ])
    );
    glow.start();

    // Main sequence
    Animated.sequence([
      // Logo pop in
      Animated.parallel([
        Animated.spring(logoScale, {
          toValue: 1,
          tension: 60,
          friction: 6,
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
      // Tagline fade in
      Animated.timing(tagOpacity, {
        toValue: 1,
        duration: 400,
        delay: 100,
        useNativeDriver: true,
      }),
      // Progress bar fill
      Animated.timing(barWidth, {
        toValue: width * 0.55,
        duration: 1000,
        useNativeDriver: false,
      }),
      // Hold briefly
      Animated.delay(300),
      // Fade out screen
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
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />

      {/* Background radial glow */}
      <Animated.View style={[styles.glow, { opacity: glowAnim }]} />

      {/* Logo area */}
      <Animated.View style={[
        styles.logoWrap,
        { opacity: logoOpacity, transform: [{ scale: logoScale }] },
      ]}>
        {/* Icon box */}
        <LinearGradient
          colors={['#00e5ff22', '#00e5ff08']}
          style={styles.iconBox}
        >
          <Text style={styles.iconEmoji}>🎬</Text>
        </LinearGradient>

        <Text style={styles.logoText}>Flixify</Text>
        <Animated.Text style={[styles.tagText, { opacity: tagOpacity }]}>
          Movies & Series — All in One
        </Animated.Text>
      </Animated.View>

      {/* Progress bar */}
      <Animated.View style={[styles.barTrack]}>
        <Animated.View style={[styles.barFill, { width: barWidth }]}>
          <LinearGradient
            colors={['#00e5ff', '#0072ff']}
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
    backgroundColor: COLORS.bg,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
  glow: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: 'rgba(0,229,255,0.07)',
    top: height / 2 - 220,
    alignSelf: 'center',
  },
  logoWrap: {
    alignItems: 'center',
    gap: 12,
    marginBottom: 60,
  },
  iconBox: {
    width: 80,
    height: 80,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,229,255,0.2)',
    marginBottom: 4,
  },
  iconEmoji: { fontSize: 38 },
  logoText: {
    color: '#00e5ff',
    fontSize: 42,
    fontWeight: '900',
    letterSpacing: -1.5,
  },
  tagText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  barTrack: {
    width: width * 0.55,
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
    color: 'rgba(255,255,255,0.25)',
    fontSize: 11,
    marginTop: 14,
    letterSpacing: 1,
    fontWeight: '500',
  },
});
