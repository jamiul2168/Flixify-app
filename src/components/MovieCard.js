import React, { useRef } from 'react';
import {
  View, Text, Image, TouchableOpacity,
  StyleSheet, Animated, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../utils/constants';

const { width } = Dimensions.get('window');
const CARD_W = (width - 48) / 2;

export default function MovieCard({ movie, onPress }) {
  const scale = useRef(new Animated.Value(1)).current;

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
            style={[styles.img, movie.isBlurred && styles.blurred]}
            resizeMode="cover"
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

          {movie.isBlurred && (
            <View style={styles.blurCover}>
              <Text style={styles.blurTxt}>18+</Text>
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
  blurred:{ opacity: 0.07 },
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
  blurCover: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(5,5,8,0.75)',
    alignItems: 'center', justifyContent: 'center',
  },
  blurTxt: { color: COLORS.red, fontSize: 32, fontWeight: '900' },
  info:    { paddingHorizontal: 10, paddingVertical: 8 },
  title:   { color: COLORS.white, fontSize: 12, fontWeight: '700', letterSpacing: 0.2 },
});
