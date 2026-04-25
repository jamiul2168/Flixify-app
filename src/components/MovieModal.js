import React, { useState } from 'react';
import {
  View, Text, Image, ScrollView,
  TouchableOpacity, StyleSheet, Modal,
  Dimensions, Share,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import * as Clipboard from 'expo-clipboard';
import { COLORS } from '../utils/constants';

const { width, height } = Dimensions.get('window');
const MODAL_IMG_WIDTH = width - 40; // paddingHorizontal 20 * 2

export default function MovieModal({ movie, visible, onClose }) {
  const [copied, setCopied] = useState(false);
  const [selEp,  setSelEp]  = useState(null);
  const [ssSize, setSsSize] = useState(null); // screenshot dynamic size

  if (!movie) return null;

  const handleDownload = async (url) => {
    if (!url) return;
    await WebBrowser.openBrowserAsync(url);
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `${movie.name} — Flixify তে দেখুন!`,
      });
    } catch (_) {}
  };

  const handleCopy = async () => {
    await Clipboard.setStringAsync(movie.download || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const episodes = movie.episodes || [];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.sheet}>

          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Ionicons name="close" size={18} color="#fff" />
          </TouchableOpacity>

          <ScrollView showsVerticalScrollIndicator={false} bounces={false}>

            {/* Hero */}
            <View style={styles.hero}>
              <Image
                source={{ uri: movie.thumbnail }}
                style={styles.heroBg}
                blurRadius={18}
              />
              <LinearGradient
                colors={['rgba(5,5,8,0.3)', 'rgba(5,5,8,0.98)']}
                style={StyleSheet.absoluteFill}
              />
              <Image
                source={{ uri: movie.thumbnail }}
                style={styles.heroPoster}
                resizeMode="contain"
              />
            </View>

            <View style={styles.body}>

              {/* Title */}
              <Text style={styles.title}>{movie.name}</Text>

              {/* Chips */}
              <View style={styles.chipRow}>
                {movie.type ? (
                  <View style={[styles.chip, styles.chipCyan]}>
                    <Text style={[styles.chipTxt, { color: COLORS.cyan }]}>{movie.type}</Text>
                  </View>
                ) : null}
                {(movie.categories || []).map((c, i) => (
                  <View key={i} style={styles.chip}>
                    <Text style={styles.chipTxt}>{c}</Text>
                  </View>
                ))}
              </View>

              {/* Trailer */}
              {movie.trailer ? (
                <TouchableOpacity
                  style={styles.trailerBtn}
                  onPress={() => handleDownload(
                    movie.trailer.includes('youtube')
                      ? movie.trailer
                      : `https://www.youtube.com/watch?v=${movie.trailer}`
                  )}
                >
                  <Ionicons name="logo-youtube" size={16} color="#fff" />
                  <Text style={styles.trailerTxt}>Watch Trailer</Text>
                </TouchableOpacity>
              ) : null}

              {/* Screenshot */}
              {movie.screenshot ? (
                <View style={styles.screenshotWrap}>
                  <Text style={styles.secLabel}>Screenshot</Text>
                  <Image
                    source={{ uri: movie.screenshot }}
                    style={[
                      styles.screenshot,
                      ssSize ? { height: ssSize } : { aspectRatio: 16 / 9 },
                    ]}
                    resizeMode="cover"
                    onLoad={({ nativeEvent: { source } }) => {
                      const ratio = source.height / source.width;
                      setSsSize(Math.round(MODAL_IMG_WIDTH * ratio));
                    }}
                  />
                </View>
              ) : null}

              {/* Actions */}
              <View style={styles.actionRow}>
                <TouchableOpacity style={styles.actionBtn} onPress={handleShare}>
                  <Ionicons name="share-social-outline" size={18} color={COLORS.cyan} />
                  <Text style={[styles.actionTxt, { color: COLORS.cyan }]}>Share</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionBtn, copied && styles.actionBtnGreen]}
                  onPress={handleCopy}
                >
                  <Ionicons
                    name={copied ? 'checkmark-circle' : 'copy-outline'}
                    size={18}
                    color={copied ? COLORS.green : COLORS.white}
                  />
                  <Text style={[styles.actionTxt, copied && { color: COLORS.green }]}>
                    {copied ? 'Copied!' : 'Copy Link'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Download */}
              {episodes.length > 0 ? (
                <View style={styles.epSection}>
                  <Text style={styles.secTitle}>Episodes</Text>
                  <View style={styles.epGrid}>
                    {episodes.map((ep, i) => (
                      <TouchableOpacity
                        key={i}
                        style={[styles.epBtn, selEp === i && styles.epBtnActive]}
                        onPress={() => {
                          setSelEp(i);
                          handleDownload(ep.link);
                        }}
                      >
                        <Text style={[styles.epTxt, selEp === i && { color: '#000' }]}>
                          {ep.title}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              ) : (
                <View style={styles.dlSection}>
                  <TouchableOpacity
                    style={styles.dlBtn}
                    onPress={() => handleDownload(movie.download)}
                    activeOpacity={0.85}
                  >
                    <LinearGradient
                      colors={['#00e5ff', '#0072ff']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.dlGrad}
                    >
                      <Ionicons name="cloud-download" size={22} color="#000" />
                      <Text style={styles.dlTxt}>Download Now</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              )}

            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.88)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: COLORS.bgModal,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: height * 0.93,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  closeBtn: {
    position: 'absolute', top: 14, right: 14,
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1, borderColor: '#333',
    alignItems: 'center', justifyContent: 'center',
    zIndex: 20,
  },
  hero: {
    height: 240,
    alignItems: 'center',
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  heroBg: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  heroPoster: {
    width: 130,
    height: 195,
    borderRadius: 12,
    marginBottom: 16,
    elevation: 12,
  },
  body: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 40,
  },
  title: {
    color: COLORS.white,
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 28,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
    marginBottom: 16,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.grayDim,
  },
  chipCyan: {
    backgroundColor: COLORS.cyanDim,
    borderColor: COLORS.cyan,
  },
  chipTxt: { color: COLORS.gray, fontSize: 11, fontWeight: '600' },
  trailerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'center',
    backgroundColor: 'rgba(255,45,85,0.85)',
    paddingHorizontal: 22,
    paddingVertical: 10,
    borderRadius: 30,
    marginBottom: 16,
  },
  trailerTxt: { color: '#fff', fontWeight: '700', fontSize: 13 },
  screenshotWrap: {
    marginBottom: 16,
  },
  secLabel: {
    color: COLORS.gray,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  screenshot: {
    width: '100%',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: '#0a0a10',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.grayDim,
  },
  actionBtnGreen: {
    borderColor: COLORS.green,
    backgroundColor: 'rgba(16,185,129,0.1)',
  },
  actionTxt: { color: COLORS.white, fontWeight: '700', fontSize: 13 },
  epSection: { marginBottom: 24 },
  secTitle: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 12,
  },
  epGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  epBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    minWidth: 80,
    alignItems: 'center',
  },
  epBtnActive: {
    backgroundColor: COLORS.cyan,
    borderColor: COLORS.cyan,
  },
  epTxt: { color: COLORS.cyan, fontSize: 12, fontWeight: '700' },
  dlSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  dlBtn: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 8,
  },
  dlGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 17,
  },
  dlTxt: {
    color: '#000',
    fontWeight: '900',
    fontSize: 16,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
});
