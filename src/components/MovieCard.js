import React, { useRef } from 'react';
import {
  View, Text, Image, TouchableOpacity,
  StyleSheet, Animated, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');
const CARD_W = (width - 42) / 2;

const CYAN   = '#00f2ff';
const PINK   = '#ff0059';
const PURPLE = '#7000ff';
const GOLD   = '#ffbc00';

export default function MovieCard({ movie, onPress, show18, appName = 'MovieDen' }) {
  const scale    = useRef(new Animated.Value(1)).current;
  const playOpac = useRef(new Animated.Value(0)).current;
  const shouldBlur = movie.isBlurred && !show18;

  const onPressIn = () => {
    Animated.parallel([
      Animated.spring(scale,    { toValue: 0.96, useNativeDriver: true }),
      Animated.timing(playOpac, { toValue: 1, duration: 180, useNativeDriver: true }),
    ]).start();
  };
  const onPressOut = () => {
    Animated.parallel([
      Animated.spring(scale,    { toValue: 1, useNativeDriver: true }),
      Animated.timing(playOpac, { toValue: 0, duration: 180, useNativeDriver: true }),
    ]).start();
  };

  return (
    <Animated.View style={[s.wrap, { transform: [{ scale }] }]}>
      <TouchableOpacity
        activeOpacity={1}
        onPress={() => onPress(movie)}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
      >
        {/* Poster */}
        <View style={s.poster}>
          <Image
            source={{ uri: movie.thumbnail }}
            style={s.img}
            resizeMode="cover"
            blurRadius={shouldBlur ? 18 : 0}
          />

          {/* Gradient overlay */}
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.85)']}
            style={s.grad}
          />

          {/* Top-left badge */}
          {movie.topLeftBadge ? (
            <View style={s.badgeTL}>
              <Text style={s.badgeTxt}>{movie.topLeftBadge}</Text>
            </View>
          ) : null}

          {/* Bottom-left badge */}
          {movie.bottomLeftBadge ? (
            <View style={s.badgeBL}>
              <Text style={s.badgeTxt}>{movie.bottomLeftBadge}</Text>
            </View>
          ) : null}

          {/* Top-right badge */}
          {movie.badge ? (
            <View style={s.badgeTR}>
              <Text style={[s.badgeTxt, { color: '#000' }]}>{movie.badge}</Text>
            </View>
          ) : null}

          {/* Type pill — bottom right */}
          <View style={s.typePill}>
            <Text style={s.typeTxt}>{movie.type || 'Movie'}</Text>
          </View>

          {/* Play overlay — on press */}
          <Animated.View style={[s.playOverlay, { opacity: playOpac }]}>
            <LinearGradient
              colors={['rgba(0,0,0,0.85)', 'rgba(0,0,0,0.4)', 'transparent']}
              start={{ x: 0.5, y: 1 }}
              end={{ x: 0.5, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
            <View style={s.playCircle}>
              <View style={s.playBtn}>
                <Text style={s.playIcon}>▶</Text>
              </View>
            </View>
            <Text style={s.playAppName}>{appName}</Text>
          </Animated.View>

          {/* 18+ blur overlay */}
          {shouldBlur && (
            <View style={s.blurOverlay}>
              <Text style={s.blurIcon}>🔞</Text>
              <Text style={s.blurTxt}>18+</Text>
            </View>
          )}
        </View>

        {/* Title */}
        <View style={s.info}>
          <Text style={s.title} numberOfLines={1}>{movie.name}</Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  wrap: {
    width: CARD_W,
    backgroundColor: '#111111',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#1e1e1e',
    marginBottom: 10,
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.45,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  poster:  { aspectRatio: 2/3, overflow: 'hidden', position: 'relative' },
  img:     { width: '100%', height: '100%' },
  grad:    { position: 'absolute', bottom: 0, left: 0, right: 0, height: 70 },

  // Badges
  badgeTL: { position: 'absolute', top: 0, left: 0, backgroundColor: PINK,   paddingHorizontal: 9, paddingVertical: 4, borderBottomRightRadius: 10, zIndex: 5 },
  badgeBL: { position: 'absolute', bottom: 0, left: 0, backgroundColor: PURPLE, paddingHorizontal: 9, paddingVertical: 4, borderTopRightRadius: 10, zIndex: 5 },
  badgeTR: { position: 'absolute', top: 0, right: 0, backgroundColor: GOLD,  paddingHorizontal: 9, paddingVertical: 4, borderBottomLeftRadius: 10, zIndex: 5 },
  badgeTxt: { color: '#fff', fontSize: 9, fontWeight: '800' },
  typePill: { position: 'absolute', bottom: 8, right: 8, backgroundColor: CYAN, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 5, zIndex: 5 },
  typeTxt:  { color: '#000', fontSize: 9, fontWeight: '800' },

  // Play overlay
  playOverlay: { position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'center', zIndex: 6 },
  playCircle:  { width: 56, height: 56, borderRadius: 28, borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)', alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  playBtn:     { width: 44, height: 44, borderRadius: 22, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  playIcon:    { color: '#000', fontSize: 18, marginLeft: 3 },
  playAppName: { color: '#fff', fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },

  // 18+ blur
  blurOverlay: { position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.3)', zIndex: 7 },
  blurIcon: { fontSize: 24, marginBottom: 4 },
  blurTxt:  { color: 'rgba(255,255,255,0.7)', fontSize: 10, fontWeight: '700' },

  // Info
  info:  { paddingHorizontal: 10, paddingVertical: 9 },
  title: { color: '#fff', fontSize: 12, fontWeight: '700' },
});
