import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, Image, ScrollView,
  TouchableOpacity, StyleSheet, Modal,
  Dimensions, Share, Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import * as Clipboard from 'expo-clipboard';
import { COLORS, DEFAULT_adGateway } from '../utils/constants';

const { width, height } = Dimensions.get('window');
const MODAL_IMG_WIDTH = width - 40;
const COUNTDOWN_SEC = 5; // countdown সেকেন্ড

// ─── Countdown Modal ──────────────────────────────────────────────────────────
function CountdownModal({ visible, onComplete, onCancel }) {
  const [seconds, setSeconds]   = useState(COUNTDOWN_SEC);
  const [adOpened, setAdOpened] = useState(false);
  const progressAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim    = useRef(new Animated.Value(1)).current;
  const timerRef     = useRef(null);

  // Reset যখন visible হয়
  useEffect(() => {
    if (!visible) return;
    setSeconds(COUNTDOWN_SEC);
    setAdOpened(false);
    progressAnim.setValue(1);

    // Progress bar animation
    Animated.timing(progressAnim, {
      toValue: 0,
      duration: COUNTDOWN_SEC * 1000,
      useNativeDriver: false,
    }).start();

    // Pulse animation loop
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.05, duration: 600, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1,    duration: 600, useNativeDriver: true }),
      ])
    );
    pulse.start();

    // Countdown timer
    timerRef.current = setInterval(() => {
      setSeconds(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          pulse.stop();
          onComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(timerRef.current);
      pulse.stop();
    };
  }, [visible]);

  const handleOpenAd = async () => {
    setAdOpened(true);
    await WebBrowser.openBrowserAsync(adGateway);
  };

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={cd.overlay}>
        <View style={cd.box}>

          {/* Header */}
          <LinearGradient
            colors={['rgba(0,229,255,0.15)', 'transparent']}
            style={cd.headerGrad}
          />
          <View style={cd.header}>
            <Ionicons name="shield-checkmark" size={18} color={COLORS.cyan} />
            <Text style={cd.headerTxt}>Preparing Download</Text>
          </View>

          {/* Countdown circle */}
          <Animated.View style={[cd.circleWrap, { transform: [{ scale: pulseAnim }] }]}>
            <LinearGradient
              colors={['rgba(0,229,255,0.2)', 'rgba(0,114,255,0.1)']}
              style={cd.circle}
            >
              <Text style={cd.countNum}>{seconds}</Text>
              <Text style={cd.countLabel}>seconds</Text>
            </LinearGradient>
          </Animated.View>

          {/* Message */}
          <Text style={cd.msgTitle}>
            {adOpened ? '✅ Ad opened! Waiting...' : '⏳ Please wait...'}
          </Text>
          <Text style={cd.msgSub}>
            {adOpened
              ? 'Download will start automatically'
              : 'Support us by viewing a short ad'}
          </Text>

          {/* Progress bar */}
          <View style={cd.barTrack}>
            <Animated.View style={[cd.barFill, { width: progressWidth }]}>
              <LinearGradient
                colors={['#00e5ff', '#0072ff']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={StyleSheet.absoluteFill}
              />
            </Animated.View>
          </View>

          {/* Ad button */}
          {!adOpened && (
            <TouchableOpacity style={cd.adBtn} onPress={handleOpenAd} activeOpacity={0.8}>
              <LinearGradient
                colors={['rgba(0,229,255,0.15)', 'rgba(0,114,255,0.1)']}
                style={cd.adBtnGrad}
              >
                <Ionicons name="open-outline" size={15} color={COLORS.cyan} />
                <Text style={cd.adBtnTxt}>Open Ad (Support Us)</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}

          {/* Cancel */}
          <TouchableOpacity style={cd.cancelBtn} onPress={onCancel}>
            <Text style={cd.cancelTxt}>✕  Cancel</Text>
          </TouchableOpacity>

        </View>
      </View>
    </Modal>
  );
}

// ─── Main Modal ───────────────────────────────────────────────────────────────
export default function MovieModal({ movie, visible, onClose, settings = {} }) {
  const adGateway = settings.adGateway || DEFAULT_adGateway;
  const [copied,      setCopied]      = useState(false);
  const [selEp,       setSelEp]       = useState(null);
  const [ssSize,      setSsSize]      = useState(null);
  const [showCountdown, setShowCountdown] = useState(false);
  const pendingUrl = useRef(null);

  if (!movie) return null;

  // Download বাটন চাপলে countdown শুরু হবে
  const handleDownload = (url) => {
    if (!url) return;
    pendingUrl.current = url;
    setShowCountdown(true);
  };

  // Countdown শেষ → ad খোলো তারপর download
  const handleCountdownComplete = async () => {
    setShowCountdown(false);
    await WebBrowser.openBrowserAsync(adGateway);
    setTimeout(async () => {
      if (pendingUrl.current) {
        await WebBrowser.openBrowserAsync(pendingUrl.current);
      }
    }, 800);
  };

  const handleCountdownCancel = () => {
    setShowCountdown(false);
    pendingUrl.current = null;
  };

  const handleShare = async () => {
    try {
      const cats      = (movie.categories || []).slice(0, 3).join(' • ');
      const type      = movie.type   ? movie.type   : '';
      const rating    = movie.rating ? movie.rating  : '';
      const year      = movie.year   ? movie.year    : '';
      const lang      = movie.language ? movie.language : '';
      const quality   = movie.quality  ? movie.quality  : '';
      const thumbnail = movie.thumbnail || '';

      // Rich share card
      const lines = [
        `🎬 ${movie.name}`,
        type || year || lang ? [
          type    ? `📁 ${type}`        : null,
          year    ? `📅 ${year}`        : null,
          lang    ? `🌐 ${lang}`        : null,
          quality ? `🎞️ ${quality}`     : null,
        ].filter(Boolean).join('  |  ') : null,
        ``,
        cats   ? `🎭 Genre : ${cats}` : null,
        rating ? `⭐ Rating : ${rating}` : null,
        ``,
        thumbnail ? `🖼️ ${thumbnail}` : null,
        ``,
        `━━━━━━━━━━━━━━━━━━━━`,
        `📲 Watch FREE on Flixify App`,
        `━━━━━━━━━━━━━━━━━━━━`,
        ``,
        `💬 Join Telegram Community`,
        `👉 https://t.me/flixifyofficialgrp`,
        ``,
        `🎯 Request a Movie / Series`,
        `👉 https://request.flixify.jhtone.site/`,
        ``,
        `━━━━━━━━━━━━━━━━━━━━`,
        `#Flixify #FreeBD #BanglaMovie #HindiDubbed`,
      ].filter(l => l !== null).join('\n');

      await Share.share({
        message: lines,
        title: `${movie.name} — Flixify`,
        // url only on iOS — thumbnail link so preview card appears
        url: thumbnail || 'https://t.me/flixifyofficialgrp',
      });
    } catch (_) {}
  };

  const handleCopy = async () => {
    await Clipboard.setStringAsync(movie.watchUrl || movie.download || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const episodes = movie.episodes || [];

  return (
    <>
      {/* Countdown Overlay */}
      <CountdownModal
        visible={showCountdown}
        onComplete={handleCountdownComplete}
        onCancel={handleCountdownCancel}
      />

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
                    onPress={() => WebBrowser.openBrowserAsync(
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
                  <TouchableOpacity style={[styles.actionBtn, styles.actionShare]} onPress={handleShare}>
                    <LinearGradient
                      colors={['rgba(0,229,255,0.15)', 'rgba(0,114,255,0.1)']}
                      start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                      style={StyleSheet.absoluteFill}
                    />
                    <Ionicons name="share-social" size={17} color={COLORS.cyan} />
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
                          onPress={() => { setSelEp(i); handleDownload(ep.link); }}
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
    </>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const cd = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  },
  box: {
    width: width * 0.85,
    backgroundColor: '#12121a',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(0,229,255,0.2)',
    overflow: 'hidden',
    alignItems: 'center',
    paddingBottom: 24,
  },
  headerGrad: {
    position: 'absolute', top: 0, left: 0, right: 0, height: 80,
  },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingTop: 20, paddingBottom: 16,
  },
  headerTxt: {
    color: COLORS.white, fontSize: 15, fontWeight: '800', letterSpacing: 0.3,
  },
  circleWrap: {
    marginVertical: 10,
  },
  circle: {
    width: 110, height: 110, borderRadius: 55,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: 'rgba(0,229,255,0.35)',
  },
  countNum: {
    color: COLORS.cyan, fontSize: 42, fontWeight: '900', lineHeight: 46,
  },
  countLabel: {
    color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: '600',
  },
  msgTitle: {
    color: COLORS.white, fontSize: 14, fontWeight: '700',
    marginTop: 14, marginBottom: 4,
  },
  msgSub: {
    color: 'rgba(255,255,255,0.4)', fontSize: 12,
    marginBottom: 20, textAlign: 'center', paddingHorizontal: 20,
  },
  barTrack: {
    width: width * 0.65, height: 4,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 10, overflow: 'hidden',
    marginBottom: 20,
  },
  barFill: {
    height: '100%', borderRadius: 10, overflow: 'hidden',
  },
  adBtn: {
    width: width * 0.7, borderRadius: 14,
    overflow: 'hidden', marginBottom: 12,
    borderWidth: 1, borderColor: 'rgba(0,229,255,0.25)',
  },
  adBtnGrad: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 13,
  },
  adBtnTxt: { color: COLORS.cyan, fontSize: 13, fontWeight: '700' },
  cancelBtn: { paddingVertical: 8, paddingHorizontal: 24 },
  cancelTxt: { color: 'rgba(255,255,255,0.3)', fontSize: 12, fontWeight: '600' },
});

const styles = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.88)', justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#12121a',
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    maxHeight: height * 0.93,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
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
    height: 240, alignItems: 'center', justifyContent: 'flex-end', overflow: 'hidden',
  },
  heroBg: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  heroPoster: {
    width: 130, height: 195, borderRadius: 12, marginBottom: 16, elevation: 12,
  },
  body: { paddingHorizontal: 20, paddingTop: 4, paddingBottom: 40 },
  title: {
    color: COLORS.white, fontSize: 22, fontWeight: '800',
    textAlign: 'center', marginBottom: 12, lineHeight: 28,
  },
  chipRow: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 8,
    justifyContent: 'center', marginBottom: 16,
  },
  chip: {
    paddingHorizontal: 12, paddingVertical: 5,
    borderRadius: 20, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  chipCyan: { backgroundColor: 'rgba(0,229,255,0.12)', borderColor: COLORS.cyan },
  chipTxt: { color: 'rgba(255,255,255,0.45)', fontSize: 11, fontWeight: '600' },
  trailerBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    alignSelf: 'center', backgroundColor: 'rgba(255,45,85,0.85)',
    paddingHorizontal: 22, paddingVertical: 10,
    borderRadius: 30, marginBottom: 16,
  },
  trailerTxt: { color: '#fff', fontWeight: '700', fontSize: 13 },
  screenshotWrap: { marginBottom: 16 },
  secLabel: {
    color: 'rgba(255,255,255,0.45)', fontSize: 11, fontWeight: '700',
    textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8,
  },
  screenshot: {
    width: '100%', borderRadius: 12,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
    backgroundColor: '#0a0a10',
  },
  actionRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  actionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 8, paddingVertical: 12,
    borderRadius: 30, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  actionShare: {
    borderColor: 'rgba(0,229,255,0.3)',
    overflow: 'hidden',
  },
  actionBtnGreen: {
    borderColor: COLORS.green, backgroundColor: 'rgba(16,185,129,0.1)',
  },
  actionTxt: { color: COLORS.white, fontWeight: '700', fontSize: 13 },
  epSection: { marginBottom: 24 },
  secTitle: { color: COLORS.white, fontSize: 16, fontWeight: '800', marginBottom: 12 },
  epGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  epBtn: {
    paddingHorizontal: 14, paddingVertical: 10,
    backgroundColor: '#0e0e14',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
    borderRadius: 10, minWidth: 80, alignItems: 'center',
  },
  epBtnActive: { backgroundColor: COLORS.cyan, borderColor: COLORS.cyan },
  epTxt: { color: COLORS.cyan, fontSize: 12, fontWeight: '700' },
  dlSection: { alignItems: 'center', marginBottom: 24 },
  dlBtn: { width: '100%', borderRadius: 16, overflow: 'hidden', elevation: 8 },
  dlGrad: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 12, paddingVertical: 17,
  },
  dlTxt: {
    color: '#000', fontWeight: '900', fontSize: 16,
    letterSpacing: 0.8, textTransform: 'uppercase',
  },
});
