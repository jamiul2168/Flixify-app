import React, { useRef } from 'react';
import {
  View, Text, Image, TouchableOpacity,
  StyleSheet, Animated, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { COLORS } from '../utils/constants';

const { width } = Dimensions.get('window');
const CARD_W = (width - 48) / 2;

export default function MovieCard({ movie, onPress, show18 }) {
  const scale = useRef(new Animated.Value(1)).current;
  // isBlurred = 18+ content। show18=true হলে blur সরবে, false হলে blur থাকবে
  const shouldBlur = movie.isBlurred && !show18;

  const onPressIn  = () => Animated.spring(scale, { toValue: 0.95, useNativeDriver: true }).start();
  const onPressOut = () => Animated.spring(scale, { toValue: 1,    useNativeDriver: true }).start();

  return (
    <Animated.View style={[styles.wrap, { transform: [{ scale }] }]}>
      <TouchableOpacity
        activeOpacity={1}
        onPress={() => onPress(movie)}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
      >
        <View style={styles.poster}>
          <Image
            source={{ uri: movie.thumbnail }}
            style={styles.img}
            resizeMode="cover"
            blurRadius={shouldBlur ? 18 : 0}
          />
          <LinearGradient
            colors={['transparent', 'rgba(5,5,8,0.92)']}
            style={styles.grad}
          />

          {movie.topLeftBadge ? (
            <View style={styles.badgeTL}>
              <Text style={styles.badgeTxt}>{movie.topLeftBadge}</Text>
            </View>
          ) : null}

          {movie.bottomLeftBadge ? (
            <View style={styles.badgeBL}>
              <Text style={styles.badgeTxt}>{movie.bottomLeftBadge}</Text>
            </View>
          ) : null}

          {movie.badge ? (
            <View style={styles.badgeTR}>
              <Text style={[styles.badgeTxt, { color: '#000' }]}>{movie.badge}</Text>
            </View>
          ) : null}

          <View style={styles.typePill}>
            <Text style={styles.typeTxt}>{movie.type || 'Movie'}</Text>
          </View>



          {/* blur overlay - hide করলে দেখাবে */}
          {shouldBlur && (
            <View style={styles.blurOverlay}>
              <View style={styles.blurOverlayInner}>
                <Text style={styles.blurOverlayIcon}>🔞</Text>
                <Text style={styles.blurOverlayTxt}>Show 18+</Text>
              </View>
            </View>
          )}
        </View>

        <View style={styles.info}>
          <Text style={styles.title} numberOfLines={1}>{movie.name}</Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: CARD_W,
    backgroundColor: COLORS.bgCard,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  poster: { aspectRatio: 2 / 3, overflow: 'hidden' },
  img:    { width: '100%', height: '100%' },
  grad: {
    position: 'absolute', bottom: 0, left: 0, right: 0, height: 60,
  },
  badgeTL: {
    position: 'absolute', top: 0, left: 0,
    backgroundColor: COLORS.red,
    paddingHorizontal: 9, paddingVertical: 4,
    borderBottomRightRadius: 10, zIndex: 5,
  },
  badgeBL: {
    position: 'absolute', bottom: 0, left: 0,
    backgroundColor: COLORS.purple,
    paddingHorizontal: 9, paddingVertical: 4,
    borderTopRightRadius: 10, zIndex: 5,
  },
  badgeTR: {
    position: 'absolute', top: 0, right: 0,
    backgroundColor: COLORS.gold,
    paddingHorizontal: 9, paddingVertical: 4,
    borderBottomLeftRadius: 10, zIndex: 5,
  },
  badgeTxt: { color: '#fff', fontSize: 9, fontWeight: '800' },
  typePill: {
    position: 'absolute', bottom: 8, right: 8,
    backgroundColor: COLORS.cyan,
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 6, zIndex: 5,
  },
  typeTxt:  { color: '#000', fontSize: 9, fontWeight: '800' },
  blurLabel: {
    position: 'absolute',
    top: 0, left: 0,
    backgroundColor: COLORS.red,
    paddingHorizontal: 7, paddingVertical: 3,
    borderBottomRightRadius: 8, zIndex: 6,
  },
  blurLabelUnlocked: {
    backgroundColor: COLORS.green,
  },
  blurLabelTxt: { color: '#fff', fontSize: 9, fontWeight: '900' },
  blurOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    alignItems: 'center', justifyContent: 'center',
    zIndex: 7,
  },
  blurOverlayInner: {
    alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingHorizontal: 10, paddingVertical: 8,
    borderRadius: 10,
  },
  blurOverlayIcon: { fontSize: 22 },
  blurOverlayTxt: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 9, fontWeight: '700',
  },
  info:    { paddingHorizontal: 10, paddingVertical: 8 },
  title:   { color: COLORS.white, fontSize: 12, fontWeight: '700', letterSpacing: 0.2 },
});
