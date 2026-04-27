import React, { useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Linking } from 'react-native';
import { COLORS } from '../utils/constants';

const TABS = [
  {
    key: 'home',
    label: 'Home',
    icon: 'home',
    iconOff: 'home-outline',
    type: 'tab',
    color: COLORS.cyan,
  },
  {
    key: 'request',
    label: 'Request',
    icon: 'add-circle',
    iconOff: 'add-circle-outline',
    type: 'link',
    urlKey: 'requestUrl',   // settings থেকে url নেওয়া হবে
    color: '#a855f7',
  },
  {
    key: 'telegram',
    label: 'Telegram',
    icon: 'paper-plane',
    iconOff: 'paper-plane-outline',
    type: 'link',
    urlKey: 'telegramUrl',  // settings থেকে url নেওয়া হবে
    color: '#2AABEE',
  },
  {
    key: 'toggle18',
    label: 'Show 18+',
    labelOn: 'Hide 18+',
    icon: 'eye',
    iconOff: 'eye-off-outline',
    type: 'toggle',
    color: '#f43f5e',
    colorOn: '#10b981',
  },
];

function TabItem({ tab, active, isOn, onPress }) {
  const scale  = useRef(new Animated.Value(1)).current;
  const dotOp  = useRef(new Animated.Value(active ? 1 : 0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: (active || isOn) ? 1.13 : 1,
        tension: 90, friction: 6,
        useNativeDriver: true,
      }),
      Animated.timing(dotOp, {
        toValue: active ? 1 : 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, [active, isOn]);

  const isLink   = tab.type === 'link';
  const isToggle = tab.type === 'toggle';
  const isTab    = tab.type === 'tab';

  const activeColor = isToggle
    ? (isOn ? tab.colorOn : tab.color)
    : tab.color;

  const iconColor = (active || isOn)
    ? activeColor
    : 'rgba(255,255,255,0.32)';

  const iconName = (() => {
    if (isToggle) return isOn ? tab.icon : tab.iconOff;
    if (isTab)    return active ? tab.icon : tab.iconOff;
    return tab.iconOff;
  })();

  const labelText = isToggle
    ? (isOn ? tab.labelOn : tab.label)
    : tab.label;

  const bgColors = (active || isOn)
    ? [`${activeColor}28`, `${activeColor}08`]
    : ['transparent', 'transparent'];

  return (
    <TouchableOpacity style={styles.tab} onPress={onPress} activeOpacity={0.75}>
      <Animated.View style={[styles.tabInner, { transform: [{ scale }] }]}>
        <LinearGradient colors={bgColors} style={styles.activeBg} />

        {(active || isOn) && (
          <View style={[styles.topBar, { backgroundColor: activeColor }]} />
        )}

        <Ionicons name={iconName} size={22} color={iconColor} />

        <Text style={[
          styles.tabLabel,
          (active || isOn) && { color: activeColor },
        ]}>
          {labelText}
        </Text>

        {isTab && (
          <Animated.View style={[styles.dot, { opacity: dotOp, backgroundColor: activeColor }]} />
        )}
      </Animated.View>
    </TouchableOpacity>
  );
}

// settings prop — AppSettings context থেকে পাস করা হবে
export default function BottomNav({ activeTab, onTabChange, show18, onToggle18, settings = {} }) {
  const handlePress = (tab) => {
    if (tab.type === 'link') {
      // urlKey দিয়ে settings থেকে URL নেওয়া, fallback hardcoded
      const url = settings[tab.urlKey] || '';
      if (url) Linking.openURL(url);
      return;
    }
    if (tab.type === 'toggle') { onToggle18(); return; }
    onTabChange(tab.key);
  };

  return (
    <View style={styles.container}>
      <View style={styles.nav}>
        {TABS.map(tab => (
          <TabItem
            key={tab.key}
            tab={tab}
            active={activeTab === tab.key}
            isOn={tab.type === 'toggle' ? show18 : false}
            onPress={() => handlePress(tab)}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#06060a',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
    shadowColor: COLORS.cyan,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 18,
  },
  nav: {
    flexDirection: 'row',
    paddingTop: 6,
    paddingBottom: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
  },
  tabInner: {
    alignItems: 'center',
    gap: 3,
    paddingVertical: 7,
    paddingHorizontal: 8,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    minWidth: 64,
  },
  activeBg: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 16,
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: '20%',
    right: '20%',
    height: 2.5,
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
    borderRadius: 2,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.30)',
    letterSpacing: 0.1,
  },
  dot: {
    position: 'absolute',
    bottom: 3,
    width: 3,
    height: 3,
    borderRadius: 2,
  },
});
