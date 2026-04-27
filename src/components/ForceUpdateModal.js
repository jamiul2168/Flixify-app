import React from 'react';
import {
  Modal, View, Text, TouchableOpacity, StyleSheet, Dimensions, Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, APP_VERSION } from '../utils/constants';

const { width } = Dimensions.get('window');

export default function ForceUpdateModal({ visible, settings }) {
  const handleDownload = () => {
    if (settings?.apkDownloadUrl) {
      Linking.openURL(settings.apkDownloadUrl);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.box}>
          <LinearGradient
            colors={['rgba(0,229,255,0.12)', 'transparent']}
            style={styles.topGlow}
          />

          <View style={styles.iconWrap}>
            <Ionicons name="rocket-outline" size={42} color={COLORS.cyan} />
          </View>

          <Text style={styles.title}>নতুন আপডেট এসেছে! 🎉</Text>
          <Text style={styles.sub}>
            আপনার version: <Text style={styles.highlight}>{APP_VERSION}</Text>
            {'   →   '}
            নতুন: <Text style={[styles.highlight, { color: COLORS.green }]}>{settings?.latestVersion}</Text>
          </Text>

          {!!settings?.updateChangelog && (
            <View style={styles.changelogBox}>
              <Text style={styles.changelogLabel}>✨ নতুন কী আছে</Text>
              <Text style={styles.changelogText}>{settings.updateChangelog}</Text>
            </View>
          )}

          <TouchableOpacity style={styles.dlBtn} onPress={handleDownload} activeOpacity={0.85}>
            <LinearGradient
              colors={['#00e5ff', '#0072ff']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.dlGrad}
            >
              <Ionicons name="cloud-download" size={20} color="#000" />
              <Text style={styles.dlTxt}>এখনই আপডেট করুন</Text>
            </LinearGradient>
          </TouchableOpacity>

          <Text style={styles.note}>
            App ব্যবহার করতে আপডেট করা বাধ্যতামূলক
          </Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  box: {
    width: width * 0.88,
    backgroundColor: '#12121a',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(0,229,255,0.25)',
    overflow: 'hidden',
    alignItems: 'center',
    padding: 28,
    paddingTop: 24,
  },
  topGlow: {
    position: 'absolute', top: 0, left: 0, right: 0, height: 100,
  },
  iconWrap: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: 'rgba(0,229,255,0.1)',
    borderWidth: 1.5, borderColor: 'rgba(0,229,255,0.3)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 18,
  },
  title: {
    color: COLORS.white,
    fontSize: 20, fontWeight: '900',
    textAlign: 'center', marginBottom: 10,
    letterSpacing: -0.3,
  },
  sub: {
    color: COLORS.gray,
    fontSize: 13, textAlign: 'center',
    marginBottom: 16,
  },
  highlight: { color: COLORS.cyan, fontWeight: '800' },
  changelogBox: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 12,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
    padding: 14, marginBottom: 20,
  },
  changelogLabel: {
    color: COLORS.cyan, fontSize: 10,
    fontWeight: '800', letterSpacing: 1,
    textTransform: 'uppercase', marginBottom: 6,
  },
  changelogText: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 12, lineHeight: 20,
  },
  dlBtn: {
    width: '100%', borderRadius: 14,
    overflow: 'hidden', elevation: 8, marginBottom: 14,
  },
  dlGrad: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 10,
    paddingVertical: 16,
  },
  dlTxt: {
    color: '#000', fontWeight: '900',
    fontSize: 15, letterSpacing: 0.5,
  },
  note: {
    color: 'rgba(255,255,255,0.25)',
    fontSize: 10, textAlign: 'center',
  },
});
