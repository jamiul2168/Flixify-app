import React, { useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as WebBrowser from 'expo-web-browser';
import { COLORS, TELEGRAM_URL, REQUEST_URL } from '../utils/constants';

// ── Official Telegram Icon (SVG-accurate paper-plane in blue circle) ──────────
function TelegramIcon({ size = 24 }) {
  const r = size / 2;
  // We build this purely with Views to match Telegram's actual logo:
  // Blue circle, white arrow pointing upper-right, with folded lower tail
  return (
    <View style={{
      width: size,
      height: size,
      borderRadius: r,
      backgroundColor: '#2AABEE',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    }}>
      {/* Paper plane body — rotated white triangle pointing right-up */}
      {/* Main diagonal arm (upper-left to lower-right arrow body) */}
      <View style={{
        position: 'absolute',
        width: size * 0.56,
        height: size * 0.10,
        backgroundColor: '#fff',
        borderRadius: size * 0.05,
        top: size * 0.37,
        left: size * 0.18,
        transform: [{ rotate: '-38deg' }],
      }} />
      {/* Arrowhead right tip */}
      <View style={{
        position: 'absolute',
        top: size * 0.26,
        left: size * 0.52,
        width: 0,
        height: 0,
        borderStyle: 'solid',
        borderLeftWidth: size * 0.20,
        borderTopWidth: size * 0.10,
        borderBottomWidth: size * 0.10,
        borderLeftColor: '#fff',
        borderTopColor: 'transparent',
        borderBottomColor: 'transparent',
        transform: [{ rotate: '-38deg' }],
      }} />
      {/* Lower fold / tail of the plane */}
      <View style={{
        position: 'absolute',
        width: size * 0.22,
        height: size * 0.09,
        backgroundColor: 'rgba(255,255,255,0.80)',
        borderRadius: size * 0.04,
        top: size * 0.54,
        left: size * 0.30,
        transform: [{ rotate: '20deg' }],
      }} />
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
const TABS = [
  {
    key: 'home',
    label: 'Home',
    icon: 'home',
    iconOff: 'home-outline',
    type: 'tab',
  },
  {
    key: 'search',
    label: 'Search',
    icon: 'search',
    iconOff: 'search-outline',
    type: 'tab',
  },
  {
    key: 'request',
    label: 'Request',
    icon: 'add-circle',
    iconOff: 'add-circle-outline',
    type: 'link',
    url: REQUEST_URL,
    color: '#7c3aed',
  },
  {
    key: 'telegram',
    label: 'Telegram',
    type: 'link',
    url: TELEGRAM_URL,
    color: '#2AABEE',
    customIcon: true,
  },
];

function TabItem({ tab, active, onPress }) {
  const scale = useRef(new Animated.Value(1)).current;
  const dotOp = useRef(new Animated.Value(active ? 1 : 0)).current;

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

  const isLink = tab.type === 'link';
  const iconColor = isLink ? tab.color : (active ? COLORS.cyan : 'rgba(255,255,255,0.35)');

  return (
    <TouchableOpacity style={styles.tab} onPress={onPress} activeOpacity={0.7}>
      <Animated.View style={[styles.tabInner, { transform: [{ scale }] }]}>
        {/* Background glow */}
        {!isLink && active && (
          <LinearGradient
            colors={['rgba(0,229,255,0.18)', 'rgba(0,229,255,0.05)']}
            style={styles.activeBg}
          />
        )}
        {isLink && (
          <LinearGradient
            colors={[`${tab.color}22`, `${tab.color}08`]}
            style={styles.activeBg}
          />
        )}

        {/* Icon */}
        {tab.customIcon
          ? <TelegramIcon size={24} />
          : (
            <Ionicons
              name={(!isLink && active) ? tab.icon : tab.iconOff}
              size={22}
              color={iconColor}
            />
          )
        }

        <Text style={[
          styles.tabLabel,
          !isLink && active && styles.tabLabelActive,
          isLink && { color: tab.color },
        ]}>
          {tab.label}
        </Text>

        {/* Active dot — only for real tabs */}
        {!isLink && (
          <Animated.View style={[styles.dot, { opacity: dotOp }]} />
        )}
      </Animated.View>
    </TouchableOpacity>
  );
}

export default function BottomNav({ activeTab, onTabChange }) {
  const handlePress = (tab) => {
    if (tab.type === 'link') {
      WebBrowser.openBrowserAsync(tab.url);
    } else {
      onTabChange(tab.key);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.topBorder} />
      <View style={styles.nav}>
        {TABS.map(tab => (
          <TabItem
            key={tab.key}
            tab={tab}
            active={activeTab === tab.key}
            onPress={() => handlePress(tab)}
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
    paddingHorizontal: 10,
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
