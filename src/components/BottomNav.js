import React, { useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Animated, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../utils/constants';

const TABS = [
  { key: 'home',     label: 'Home',    icon: 'home',           iconOff: 'home-outline' },
  { key: 'search',   label: 'Search',  icon: 'search',         iconOff: 'search-outline' },
  { key: 'trending', label: 'Trending',icon: 'flame',          iconOff: 'flame-outline' },
  { key: 'settings', label: 'Settings',icon: 'settings',       iconOff: 'settings-outline' },
];

function TabItem({ tab, active, onPress }) {
  const scale  = useRef(new Animated.Value(1)).current;
  const dotOp  = useRef(new Animated.Value(active ? 1 : 0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: active ? 1.12 : 1,
        tension: 80, friction: 6,
        useNativeDriver: true,
      }),
      Animated.timing(dotOp, {
        toValue: active ? 1 : 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, [active]);

  return (
    <TouchableOpacity
      style={styles.tab}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Animated.View style={[styles.tabInner, { transform: [{ scale }] }]}>
        {active && (
          <LinearGradient
            colors={['rgba(0,229,255,0.18)', 'rgba(0,229,255,0.05)']}
            style={styles.activeBg}
          />
        )}
        <Ionicons
          name={active ? tab.icon : tab.iconOff}
          size={22}
          color={active ? COLORS.cyan : 'rgba(255,255,255,0.35)'}
        />
        <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>
          {tab.label}
        </Text>
        <Animated.View style={[styles.dot, { opacity: dotOp }]} />
      </Animated.View>
    </TouchableOpacity>
  );
}

export default function BottomNav({ activeTab, onTabChange }) {
  return (
    <View style={styles.container}>
      {/* Top border glow */}
      <View style={styles.topBorder} />
      <View style={styles.nav}>
        {TABS.map(tab => (
          <TabItem
            key={tab.key}
            tab={tab}
            active={activeTab === tab.key}
            onPress={() => onTabChange(tab.key)}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(5,5,8,0.97)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.07)',
  },
  topBorder: {
    height: 1,
    backgroundColor: 'rgba(0,229,255,0.08)',
  },
  nav: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingBottom: 4,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
  },
  tabInner: {
    alignItems: 'center',
    gap: 3,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 14,
    overflow: 'hidden',
    position: 'relative',
  },
  activeBg: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 14,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.35)',
  },
  tabLabelActive: {
    color: COLORS.cyan,
  },
  dot: {
    position: 'absolute',
    bottom: 2,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.cyan,
  },
});
