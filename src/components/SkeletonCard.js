import React, { useEffect, useRef } from 'react';
import {
  View, StyleSheet, Animated, Dimensions,
} from 'react-native';

const { width } = Dimensions.get('window');
const CARD_W = (width - 48) / 2;

function ShimmerBox({ style, delay = 0 }) {
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(shimmer, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(shimmer, {
          toValue: 0,
          duration: 900,
          useNativeDriver: true,
        }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, []);

  const opacity = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [0.4, 0.85],
  });

  return (
    <Animated.View style={[styles.shimmerBase, style, { opacity }]} />
  );
}

export default function SkeletonCard({ delay = 0 }) {
  return (
    <View style={styles.card}>
      {/* Poster placeholder */}
      <ShimmerBox style={styles.poster} delay={delay} />
      {/* Title placeholder */}
      <View style={styles.info}>
        <ShimmerBox style={styles.titleLine} delay={delay + 100} />
        <ShimmerBox style={styles.titleLineShort} delay={delay + 200} />
      </View>
    </View>
  );
}

export function SkeletonGrid() {
  const items = Array.from({ length: 6 });
  return (
    <View style={styles.grid}>
      {items.map((_, i) => (
        <SkeletonCard key={i} delay={(i % 3) * 120} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 10,
    gap: 12,
  },
  card: {
    width: CARD_W,
    backgroundColor: '#0e0e14',
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    marginBottom: 0,
  },
  poster: {
    width: '100%',
    aspectRatio: 2 / 3,
    borderRadius: 0,
  },
  info: {
    padding: 10,
    gap: 6,
  },
  titleLine: {
    height: 10,
    borderRadius: 6,
    width: '85%',
  },
  titleLineShort: {
    height: 8,
    borderRadius: 6,
    width: '50%',
  },
  shimmerBase: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 6,
  },
});
