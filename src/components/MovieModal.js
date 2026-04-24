import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Dimensions,
  Linking,
  Share,
  Animated,
} from 'react-native';
import { Ionicons, FontAwesome5, MaterialIcons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import * as WebBrowser from 'expo-web-browser';
import { COLORS, AD_URL } from '../utils/constants';

const { width, height } = Dimensions.get('window');

export default function MovieModal({ movie, visible, onClose, show18 }) {
  const [downloading, setDownloading] = useState(false);
  const [countdown, setCountdown] = useState(null);
  const [unlockStep, setUnlockStep] = useState(0);
  const [showDownloadBtn, setShowDownloadBtn] = useState(false);
  const [copied, setCopied] = useState(false);
  const [selectedEp, setSelectedEp] = useState(null);
  const timerRef = useRef(null);

  if (!movie) return null;

  const handleClose = () => {
    clearInterval(timerRef.current);
    setDownloading(false);
    setCountdown(null);
    setUnlockStep(0);
    setShowDownloadBtn(false);
    setSelectedEp(null);
    onClose();
  };

  const startDownload = (url) => {
    setDownloading(true);
    setCountdown(5);
    setUnlockStep(0);
    setShowDownloadBtn(false);

    let sec = 5;
    timerRef.current = setInterval(() => {
      sec--;
      setCountdown(sec);
      if (sec <= 0) {
        clearInterval(timerRef.current);
        setCountdown(null);
        setUnlockStep(1);
      }
    }, 1000);
  };

  const handleUnlock = async (url) => {
    await WebBrowser.openBrowserAsync(AD_URL);
    if (unlockStep === 1) {
      setUnlockStep(2);
    } else {
      setUnlockStep(0);
      setShowDownloadBtn(true);
      setDownloading(false);
    }
  };

  const handleRealDownload = async (url) => {
    await WebBrowser.openBrowserAsync(url);
  };

  const handleShare = async () => {
    try {
      await Share.share({ message: `Watch ${movie.name} on Flixify!\n\nflixify.jhtone.site/?id=${movie.id}` });
    } catch (e) {}
  };

  const handleCopy = async () => {
    await Clipboard.setStringAsync(`https://flixify.jhtone.site/?id=${movie.id}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const isBlurred = movie.isBlurred && !show18;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          {/* Close Button */}
          <TouchableOpacity style={styles.closeBtn} onPress={handleClose}>
            <Ionicons name="close" size={20} color="#fff" />
          </TouchableOpacity>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Thumbnail */}
            <View style={styles.thumbContainer}>
              <Image
                source={{ uri: movie.thumbnail }}
                style={[styles.thumbnail, isBlurred && { opacity: 0.05 }]}
                resizeMode="cover"
              />
              {isBlurred && (
                <View style={styles.blurOverlayModal}>
                  <Text style={styles.blurLabel}>18+</Text>
                  <Text style={styles.blurSub}>Enable 18+ to view</Text>
                </View>
              )}
              {/* Gradient overlay at bottom */}
              <View style={styles.thumbGradient} />
            </View>

            {/* Content */}
            <View style={styles.content}>
              {/* Title */}
              <Text style={styles.title}>{movie.name}</Text>

              {/* Type + Categories */}
              <View style={styles.metaRow}>
                {movie.type ? (
                  <View style={styles.typeChip}>
                    <Text style={styles.typeChipText}>{movie.type}</Text>
                  </View>
                ) : null}
                {(movie.categories || []).map((cat, i) => (
                  <View key={i} style={styles.catChip}>
                    <Text style={styles.catChipText}>{cat}</Text>
                  </View>
                ))}
              </View>

              {/* Trailer Button */}
              {movie.trailer ? (
                <TouchableOpacity
                  style={styles.trailerBtn}
                  onPress={() => WebBrowser.openBrowserAsync(
                    movie.trailer.includes('youtube') ? movie.trailer : `https://www.youtube.com/watch?v=${movie.trailer}`
                  )}
                >
                  <Ionicons name="logo-youtube" size={18} color="#fff" />
                  <Text style={styles.trailerBtnText}>Watch Trailer</Text>
                </TouchableOpacity>
              ) : null}

              {/* Screenshot */}
              {movie.screenshot ? (
                <Image
                  source={{ uri: movie.screenshot }}
                  style={styles.screenshot}
                  resizeMode="cover"
                />
              ) : null}

              {/* Action Buttons */}
              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={[styles.shareBtn, copied && styles.shareBtnCopied]}
                  onPress={handleShare}
                >
                  <Ionicons name="share-social" size={16} color={copied ? COLORS.green : COLORS.cyan} />
                  <Text style={[styles.shareBtnText, copied && { color: COLORS.green }]}>
                    {copied ? 'Copied!' : 'Share'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.copyBtn} onPress={handleCopy}>
                  <Ionicons name="copy-outline" size={16} color={COLORS.white} />
                  <Text style={styles.copyBtnText}>Copy Link</Text>
                </TouchableOpacity>
              </View>

              {/* Download Section */}
              {movie.episodes && movie.episodes.length > 0 ? (
                <View style={styles.episodeSection}>
                  <Text style={styles.sectionTitle}>Episodes</Text>
                  <View style={styles.episodeGrid}>
                    {movie.episodes.map((ep, i) => (
                      <TouchableOpacity
                        key={i}
                        style={[styles.epItem, selectedEp === i && styles.epItemActive]}
                        onPress={() => {
                          setSelectedEp(i);
                          setDownloading(false);
                          setCountdown(null);
                          setUnlockStep(0);
                          setShowDownloadBtn(false);
                          setTimeout(() => startDownload(ep.link), 100);
                        }}
                      >
                        <Text style={[styles.epTitle, selectedEp === i && { color: '#000' }]}>
                          {ep.title}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  {/* Download flow for episode */}
                  {downloading && renderDownloadFlow(
                    countdown, unlockStep, showDownloadBtn,
                    selectedEp !== null ? movie.episodes[selectedEp]?.link : null,
                    handleUnlock, handleRealDownload, startDownload
                  )}
                </View>
              ) : (
                <View style={styles.downloadSection}>
                  {!downloading ? (
                    <TouchableOpacity
                      style={styles.dlBtn}
                      onPress={() => startDownload(movie.download)}
                    >
                      <Ionicons name="cloud-download" size={20} color="#000" />
                      <Text style={styles.dlBtnText}>Download</Text>
                    </TouchableOpacity>
                  ) : (
                    renderDownloadFlow(
                      countdown, unlockStep, showDownloadBtn,
                      movie.download, handleUnlock, handleRealDownload, startDownload
                    )
                  )}
                </View>
              )}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function renderDownloadFlow(countdown, unlockStep, showDownloadBtn, url, handleUnlock, handleRealDownload, startDownload) {
  return (
    <View style={styles.downloadFlow}>
      {countdown !== null ? (
        <View style={styles.countdownBox}>
          <Text style={styles.countdownText}>
            Generating link in {String(countdown).padStart(2, '0')} seconds...
          </Text>
        </View>
      ) : null}

      {unlockStep === 1 ? (
        <TouchableOpacity style={styles.unlockBtn} onPress={() => handleUnlock(url)}>
          <Ionicons name="key" size={18} color="#000" />
          <Text style={styles.unlockBtnText}>Unlock [Step: 1/2]</Text>
        </TouchableOpacity>
      ) : null}

      {unlockStep === 2 ? (
        <TouchableOpacity style={styles.unlockBtn} onPress={() => handleUnlock(url)}>
          <Ionicons name="key" size={18} color="#000" />
          <Text style={styles.unlockBtnText}>Unlock [Step: 2/2]</Text>
        </TouchableOpacity>
      ) : null}

      {showDownloadBtn ? (
        <TouchableOpacity style={styles.dlBtn} onPress={() => handleRealDownload(url)}>
          <Ionicons name="cloud-download" size={20} color="#000" />
          <Text style={styles.dlBtnText}>Download Now</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: height * 0.92,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  closeBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: '#333',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  thumbContainer: {
    position: 'relative',
    height: 220,
    overflow: 'hidden',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  thumbGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
    backgroundColor: 'transparent',
    // gradient effect
  },
  blurOverlayModal: {
    position: 'absolute',
    inset: 0,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  blurLabel: {
    color: COLORS.red,
    fontSize: 40,
    fontWeight: '900',
  },
  blurSub: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
    marginTop: 6,
  },
  content: {
    padding: 20,
    paddingTop: 16,
  },
  title: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 12,
    paddingRight: 40,
    lineHeight: 26,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 14,
  },
  typeChip: {
    backgroundColor: 'rgba(0,242,255,0.15)',
    borderWidth: 1,
    borderColor: COLORS.cyan,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  typeChipText: {
    color: COLORS.cyan,
    fontSize: 11,
    fontWeight: '700',
  },
  catChip: {
    backgroundColor: 'rgba(0,242,255,0.08)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  catChipText: {
    color: COLORS.cyan,
    fontSize: 11,
    fontWeight: '600',
  },
  trailerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,0,0,0.85)',
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 30,
    marginBottom: 14,
  },
  trailerBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
  screenshot: {
    width: '100%',
    height: 180,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#333',
    marginBottom: 14,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  shareBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 30,
    backgroundColor: 'rgba(0,242,255,0.05)',
    borderWidth: 1,
    borderColor: COLORS.cyan,
  },
  shareBtnCopied: {
    borderColor: COLORS.green,
    backgroundColor: 'rgba(0,255,145,0.1)',
  },
  shareBtnText: {
    color: COLORS.cyan,
    fontWeight: '700',
    fontSize: 14,
  },
  copyBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: '#333',
  },
  copyBtnText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 14,
  },
  sectionTitle: {
    color: COLORS.cyan,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  episodeSection: {
    marginTop: 4,
  },
  episodeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  epItem: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  epItemActive: {
    backgroundColor: COLORS.cyan,
    borderColor: COLORS.cyan,
  },
  epTitle: {
    color: COLORS.cyan,
    fontSize: 12,
    fontWeight: '700',
  },
  downloadSection: {
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 20,
  },
  downloadFlow: {
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 10,
  },
  countdownBox: {
    marginBottom: 12,
  },
  countdownText: {
    color: COLORS.cyan,
    fontWeight: '700',
    fontSize: 14,
  },
  dlBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: COLORS.cyan,
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 12,
    marginTop: 8,
    marginBottom: 20,
    minWidth: 220,
  },
  dlBtnText: {
    color: '#000',
    fontWeight: '800',
    fontSize: 15,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  unlockBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#ffdc00',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 12,
    marginTop: 8,
    minWidth: 220,
  },
  unlockBtnText: {
    color: '#000',
    fontWeight: '800',
    fontSize: 15,
    letterSpacing: 0.5,
  },
});
