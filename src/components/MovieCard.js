import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { COLORS } from '../utils/constants';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 40 - 10) / 2; // 5% padding each side + gap

export default function MovieCard({ movie, onPress, showBlurred = false }) {
  const shouldBlur = movie.isBlurred && !showBlurred;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onPress(movie)}
      activeOpacity={0.85}
    >
      <View style={styles.poster}>
        <Image
          source={{ uri: movie.thumbnail }}
          style={[styles.posterImage, shouldBlur && styles.blurred]}
          resizeMode="cover"
        />

        {/* Top Left Badge */}
        {movie.topLeftBadge ? (
          <View style={styles.badgeTopLeft}>
            <Text style={styles.badgeText}>{movie.topLeftBadge}</Text>
          </View>
        ) : null}

        {/* Bottom Left Badge */}
        {movie.bottomLeftBadge ? (
          <View style={styles.badgeBottomLeft}>
            <Text style={styles.badgeText}>{movie.bottomLeftBadge}</Text>
          </View>
        ) : null}

        {/* Top Right Badge (pre-release etc) */}
        {movie.badge ? (
          <View style={styles.badgeTopRight}>
            <Text style={[styles.badgeText, { color: '#000' }]}>{movie.badge}</Text>
          </View>
        ) : null}

        {/* Type badge (bottom right) */}
        <View style={styles.badgeType}>
          <Text style={[styles.badgeText, { color: '#000' }]}>
            {movie.type || 'Movie'}
          </Text>
        </View>

        {/* Blur overlay text */}
        {shouldBlur && (
          <View style={styles.blurOverlay}>
            <Text style={styles.blurText}>18+</Text>
          </View>
        )}
      </View>

      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={1}>
          {movie.name}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 10,
  },
  poster: {
    aspectRatio: 2 / 3,
    position: 'relative',
    overflow: 'hidden',
  },
  posterImage: {
    width: '100%',
    height: '100%',
  },
  blurred: {
    opacity: 0.1,
  },
  blurOverlay: {
    position: 'absolute',
    inset: 0,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  blurText: {
    color: COLORS.red,
    fontSize: 28,
    fontWeight: '900',
  },
  badgeTopLeft: {
    position: 'absolute',
    top: 0,
    left: 0,
    backgroundColor: COLORS.red,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderBottomRightRadius: 10,
    zIndex: 5,
  },
  badgeBottomLeft: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    backgroundColor: COLORS.purple,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderTopRightRadius: 10,
    zIndex: 5,
  },
  badgeTopRight: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: COLORS.gold,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderBottomLeftRadius: 10,
    zIndex: 5,
  },
  badgeType: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: COLORS.cyan,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    zIndex: 5,
  },
  badgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '800',
  },
  info: {
    padding: 10,
  },
  title: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '700',
  },
});
