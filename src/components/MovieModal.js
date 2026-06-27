import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, Image, ScrollView, TouchableOpacity,
  StyleSheet, Modal, Dimensions, Linking, Animated,
  Share,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { DEFAULT_AD_GATEWAY } from '../utils/constants';

const { width, height } = Dimensions.get('window');
const CYAN   = '#00f2ff';
const PINK   = '#ff0059';
const BG     = '#111111';
const BG2    = '#181818';
const BORDER = '#222222';
const COUNTDOWN_SEC = 5;

// ── Countdown Bottom Sheet ────────────────────────────────────────────────────
function CountdownSheet({ visible, onComplete, onCancel, adGateway }) {
  const [seconds, setSeconds] = useState(COUNTDOWN_SEC);
  const [step, setStep]       = useState(1); // 1 = countdown, 2 = unlock1, 3 = unlock2, 4 = done
  const progressAnim = useRef(new Animated.Value(1)).current;
  const timerRef     = useRef(null);

  useEffect(() => {
    if (!visible) { setSeconds(COUNTDOWN_SEC); setStep(1); return; }
    progressAnim.setValue(1);
    Animated.timing(progressAnim, {
      toValue: 0, duration: COUNTDOWN_SEC * 1000, useNativeDriver: false,
    }).start();

    timerRef.current = setInterval(() => {
      setSeconds(prev => {
        if (prev <= 1) { clearInterval(timerRef.current); setStep(2); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [visible]);

  const handleUnlock1 = async () => {
    if (adGateway) await Linking.openURL(adGateway).catch(() => {});
    setStep(3);
  };

  const handleUnlock2 = async () => {
    if (adGateway) await Linking.openURL(adGateway).catch(() => {});
    setStep(4);
    setTimeout(onComplete, 800);
  };

  if (!visible) return null;

  const progW = progressAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  return (
    <Modal visible={visible} transparent animationType="slide">
      <TouchableOpacity style={cd.backdrop} activeOpacity={1} onPress={onCancel} />
      <View style={cd.sheet}>
        <View style={cd.handle} />

        {step === 1 && (
          <>
            <Text style={cd.title}>🔒 Generating Link</Text>
            <View style={cd.circleWrap}>
              <LinearGradient colors={['rgba(0,242,255,0.2)','rgba(0,114,255,0.1)']} style={cd.circle}>
                <Text style={cd.countNum}>{seconds}</Text>
                <Text style={cd.countLbl}>seconds</Text>
              </LinearGradient>
            </View>
            <View style={cd.progressTrack}>
              <Animated.View style={[cd.progressFill, { width: progW }]} />
            </View>
            <Text style={cd.hint}>Please wait while we prepare your download link…</Text>
            <TouchableOpacity style={cd.cancelBtn} onPress={onCancel}>
              <Text style={cd.cancelTxt}>Cancel</Text>
            </TouchableOpacity>
          </>
        )}

        {step === 2 && (
          <>
            <Text style={cd.title}>🔓 Unlock Download</Text>
            <Text style={cd.stepHint}>Step 1 of 2 — Tap to continue</Text>
            <TouchableOpacity style={cd.unlockBtn} onPress={handleUnlock1}>
              <LinearGradient colors={['#ffdc00','#ff8c00']} style={cd.unlockBtnInner}>
                <Ionicons name="key" size={20} color="#000" />
                <Text style={cd.unlockBtnTxt}>Unlock [Step: 1/2]</Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity style={cd.cancelBtn} onPress={onCancel}>
              <Text style={cd.cancelTxt}>Cancel</Text>
            </TouchableOpacity>
          </>
        )}

        {step === 3 && (
          <>
            <Text style={cd.title}>🔓 Almost Done!</Text>
            <Text style={cd.stepHint}>Step 2 of 2 — One more tap</Text>
            <TouchableOpacity style={cd.unlockBtn} onPress={handleUnlock2}>
              <LinearGradient colors={['#00f2ff','#0072ff']} style={cd.unlockBtnInner}>
                <Ionicons name="cloud-download" size={20} color="#000" />
                <Text style={cd.unlockBtnTxt}>Unlock [Step: 2/2]</Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity style={cd.cancelBtn} onPress={onCancel}>
              <Text style={cd.cancelTxt}>Cancel</Text>
            </TouchableOpacity>
          </>
        )}

        {step === 4 && (
          <>
            <Text style={cd.title}>✅ Link Ready!</Text>
            <Text style={cd.hint}>Opening your download link in browser…</Text>
          </>
        )}
      </View>
    </Modal>
  );
}

// ── Main Modal ────────────────────────────────────────────────────────────────
export default function MovieModal({ visible, movie, settings = {}, onClose }) {
  const [showCountdown, setShowCountdown] = useState(false);
  const [selEp,         setSelEp]         = useState(null);
  const [copied,        setCopied]        = useState(false);
  const pendingUrl = useRef(null);
  const slideAnim  = useRef(new Animated.Value(height)).current;

  const adGateway = settings.adGateway || DEFAULT_AD_GATEWAY || '';

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, { toValue: 0, tension: 65, friction: 11, useNativeDriver: true }).start();
    } else {
      Animated.timing(slideAnim, { toValue: height, duration: 260, useNativeDriver: true }).start();
    }
  }, [visible]);

  if (!movie) return null;

  const handleDownload = (url) => {
    if (!url) return;
    pendingUrl.current = url;
    setShowCountdown(true);
  };

  const handleCountdownComplete = async () => {
    setShowCountdown(false);
    if (pendingUrl.current) {
      await Linking.openURL(pendingUrl.current).catch(e => console.log('Link error:', e));
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({ message: `🎬 ${movie.name}\n\nWatch on MovieDen` });
    } catch {}
  };

  const handleCopy = async () => {
    await Clipboard.setStringAsync(movie.download || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleTrailer = () => {
    if (!movie.trailer) return;
    const url = movie.trailer.includes('youtube.com') || movie.trailer.includes('youtu.be')
      ? movie.trailer
      : `https://www.youtube.com/watch?v=${movie.trailer}`;
    Linking.openURL(url).catch(() => {});
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      {/* Backdrop */}
      <TouchableOpacity style={s.backdrop} activeOpacity={1} onPress={onClose} />

      {/* Sheet */}
      <Animated.View style={[s.sheet, { transform: [{ translateY: slideAnim }] }]}>

        {/* Close button */}
        <TouchableOpacity style={s.closeBtn} onPress={onClose}>
          <Ionicons name="close" size={18} color="rgba(255,255,255,0.7)" />
        </TouchableOpacity>

        <ScrollView showsVerticalScrollIndicator={false} bounces={false}>

          {/* Poster + gradient header */}
          <View style={s.posterWrap}>
            <Image source={{ uri: movie.thumbnail }} style={s.posterImg} resizeMode="cover" />
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.6)', BG]}
              style={s.posterGrad}
            />
          </View>

          <View style={s.body}>
            {/* Title */}
            <Text style={s.title}>{movie.name}</Text>

            {/* Meta chips */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.metaRow}>
              {(movie.categories || []).map((c, i) => (
                <View key={i} style={s.metaChip}>
                  <Text style={s.metaChipTxt}>{c}</Text>
                </View>
              ))}
              {movie.type     && <View style={s.metaChip}><Text style={s.metaChipTxt}>{movie.type}</Text></View>}
              {movie.quality  && <View style={[s.metaChip, s.metaChipPurple]}><Text style={[s.metaChipTxt, { color: '#a78bfa' }]}>{movie.quality}</Text></View>}
              {movie.language && <View style={s.metaChip}><Text style={s.metaChipTxt}>{movie.language}</Text></View>}
            </ScrollView>

            {/* Trailer button */}
            {movie.trailer ? (
              <TouchableOpacity style={s.trailerBtn} onPress={handleTrailer} activeOpacity={0.85}>
                <Ionicons name="logo-youtube" size={16} color="#fff" />
                <Text style={s.trailerTxt}>Watch Trailer</Text>
              </TouchableOpacity>
            ) : null}

            {/* Screenshot */}
            {movie.screenshot ? (
              <Image source={{ uri: movie.screenshot }} style={s.screenshot} resizeMode="cover" />
            ) : null}

            {/* Action row */}
            <View style={s.actionRow}>
              <TouchableOpacity style={s.actionBtn} onPress={handleShare} activeOpacity={0.8}>
                <Ionicons name="share-social-outline" size={16} color={CYAN} />
                <Text style={s.actionTxt}>Share</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.actionBtn, copied && s.actionBtnCopied]} onPress={handleCopy} activeOpacity={0.8}>
                <Ionicons name={copied ? 'checkmark-circle' : 'copy-outline'} size={16} color={copied ? '#00ff91' : CYAN} />
                <Text style={[s.actionTxt, copied && { color: '#00ff91' }]}>{copied ? 'Copied!' : 'Copy Link'}</Text>
              </TouchableOpacity>
            </View>

            {/* Download section */}
            {movie.episodes && movie.episodes.length > 0 ? (
              <>
                <Text style={s.epTitle}>Episodes</Text>
                <View style={s.epGrid}>
                  {movie.episodes.map((ep, i) => (
                    <TouchableOpacity
                      key={i}
                      style={[s.epItem, selEp === i && s.epItemActive]}
                      onPress={() => { setSelEp(i); handleDownload(ep.link); }}
                      activeOpacity={0.8}
                    >
                      <Text style={[s.epTxt, selEp === i && { color: CYAN }]}>{ep.title}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            ) : (
              <TouchableOpacity style={s.dlBtn} onPress={() => handleDownload(movie.download || movie.watchUrl)} activeOpacity={0.85}>
                <LinearGradient colors={['#00f2ff', '#0072ff']} style={s.dlBtnInner}>
                  <Ionicons name="cloud-download" size={22} color="#000" />
                  <Text style={s.dlBtnTxt}>Download Now</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </Animated.View>

      {/* Countdown sheet */}
      <CountdownSheet
        visible={showCountdown}
        adGateway={adGateway}
        onComplete={handleCountdownComplete}
        onCancel={() => { setShowCountdown(false); pendingUrl.current = null; }}
      />
    </Modal>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  backdrop: { position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)' },
  sheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: BG, borderTopLeftRadius: 20, borderTopRightRadius: 20,
    maxHeight: height * 0.92, overflow: 'hidden',
    borderWidth: 1, borderBottomWidth: 0, borderColor: '#1e1e1e',
  },
  closeBtn: {
    position: 'absolute', top: 14, right: 14, zIndex: 10,
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.07)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },

  // Poster
  posterWrap: { height: 260, position: 'relative' },
  posterImg:  { width: '100%', height: '100%' },
  posterGrad: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 140 },

  // Body
  body:  { paddingHorizontal: 18, paddingBottom: 40, marginTop: -20 },
  title: { color: '#fff', fontSize: 20, fontWeight: '800', marginBottom: 10, letterSpacing: -0.3 },

  // Meta
  metaRow:       { marginBottom: 14 },
  metaChip:      { backgroundColor: 'rgba(0,242,255,0.08)', borderWidth: 1, borderColor: 'rgba(0,242,255,0.2)', borderRadius: 6, paddingHorizontal: 12, paddingVertical: 4, marginRight: 6 },
  metaChipPurple:{ backgroundColor: 'rgba(167,139,250,0.08)', borderColor: 'rgba(167,139,250,0.2)' },
  metaChipTxt:   { color: CYAN, fontSize: 11, fontWeight: '600' },

  // Trailer
  trailerBtn:  { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,0,0,0.85)', paddingHorizontal: 18, paddingVertical: 9, borderRadius: 8, alignSelf: 'flex-start', marginBottom: 14 },
  trailerTxt:  { color: '#fff', fontWeight: '700', fontSize: 13 },

  // Screenshot
  screenshot: { width: '100%', height: 180, borderRadius: 10, borderWidth: 1, borderColor: BORDER, marginBottom: 14 },

  // Actions
  actionRow:       { flexDirection: 'row', gap: 10, marginBottom: 18 },
  actionBtn:       { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 11, borderRadius: 10, backgroundColor: BG2, borderWidth: 1, borderColor: BORDER },
  actionBtnCopied: { borderColor: '#00ff91', backgroundColor: 'rgba(0,255,145,0.06)' },
  actionTxt:       { color: CYAN, fontSize: 13, fontWeight: '700' },

  // Download
  dlBtn:      { marginBottom: 10 },
  dlBtnInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 16, borderRadius: 12 },
  dlBtnTxt:   { color: '#000', fontSize: 15, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },

  // Episodes
  epTitle: { color: '#fff', fontSize: 15, fontWeight: '800', marginBottom: 10 },
  epGrid:  { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  epItem:  { backgroundColor: BG2, borderWidth: 1, borderColor: BORDER, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 10 },
  epItemActive: { borderColor: CYAN, backgroundColor: 'rgba(0,242,255,0.08)' },
  epTxt:   { color: CYAN, fontSize: 12, fontWeight: '600' },
});

// ── Countdown styles ──────────────────────────────────────────────────────────
const cd = StyleSheet.create({
  backdrop:   { position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet:      { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#111', borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingHorizontal: 24, paddingBottom: 40, paddingTop: 16, alignItems: 'center', borderWidth: 1, borderBottomWidth: 0, borderColor: '#1e1e1e' },
  handle:     { width: 40, height: 4, borderRadius: 2, backgroundColor: '#333', marginBottom: 20 },
  title:      { color: '#fff', fontSize: 18, fontWeight: '800', marginBottom: 20, textAlign: 'center' },
  circleWrap: { marginBottom: 20 },
  circle:     { width: 120, height: 120, borderRadius: 60, alignItems: 'center', justifyContent: 'center' },
  countNum:   { color: CYAN, fontSize: 42, fontWeight: '900', lineHeight: 48 },
  countLbl:   { color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: '600' },
  progressTrack: { width: '100%', height: 4, backgroundColor: '#222', borderRadius: 2, overflow: 'hidden', marginBottom: 14 },
  progressFill:  { height: '100%', backgroundColor: CYAN, borderRadius: 2 },
  hint:       { color: 'rgba(255,255,255,0.5)', fontSize: 12, textAlign: 'center', marginBottom: 20, lineHeight: 18 },
  stepHint:   { color: 'rgba(255,255,255,0.45)', fontSize: 12, marginBottom: 20, textAlign: 'center' },
  unlockBtn:  { width: '100%', borderRadius: 12, overflow: 'hidden', marginBottom: 14 },
  unlockBtnInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 15 },
  unlockBtnTxt:   { fontSize: 15, fontWeight: '800', color: '#000' },
  cancelBtn:  { paddingVertical: 10 },
  cancelTxt:  { color: 'rgba(255,255,255,0.4)', fontSize: 13, fontWeight: '600' },
});
