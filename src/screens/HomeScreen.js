import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  StyleSheet, StatusBar, ActivityIndicator, ScrollView,
  RefreshControl, Dimensions, Animated, Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../utils/constants';
import { fetchMovies, normalizeMovie } from '../utils/api';
import MovieCard from '../components/MovieCard';
import MovieModal from '../components/MovieModal';
import { SkeletonGrid } from '../components/SkeletonCard';
// LiveUserBadge removed

const LOGO = require('../../assets/logo.png');
const { width } = Dimensions.get('window');

export default function HomeScreen({ show18 = false, settings = {} }) {
  const insets = useSafeAreaInsets();

  // settings থেকে dynamic values
  const moviesPerPage = settings.moviesPerPage || 18;
  const tickerText    = settings.tickerText    || '🎬 Flixify তে স্বাগতম!';

  const [allMovies,    setAllMovies]    = useState([]);
  const [filtered,     setFiltered]     = useState([]);
  const [displayed,    setDisplayed]    = useState([]);
  const [categories,   setCategories]   = useState(['All']);
  const [activeCat,    setActiveCat]    = useState('all');
  const [search,       setSearch]       = useState('');
  const [loading,      setLoading]      = useState(true);
  const [refreshing,   setRefreshing]   = useState(false);
  const [error,        setError]        = useState(null);
  const [page,         setPage]         = useState(1);
  const [hasMore,      setHasMore]      = useState(false);
  const [selMovie,     setSelMovie]     = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [suggestions,  setSuggestions]  = useState([]);
  const [showSugg,     setShowSugg]     = useState(false);

  const tickX    = useRef(new Animated.Value(width)).current;
  const tickAnim = useRef(null);

  useEffect(() => {
    // আগের animation বন্ধ করো
    if (tickAnim.current) tickAnim.current.stop();
    // শুরু থেকে reset
    tickX.setValue(width);
    // ✅ Infinite loop — শেষ হলে আবার শুরু থেকে
    tickAnim.current = Animated.loop(
      Animated.timing(tickX, {
        toValue:        -width * 5,
        duration:       25000,
        useNativeDriver: true,
      })
    );
    tickAnim.current.start();
    return () => { if (tickAnim.current) tickAnim.current.stop(); };
  }, [tickerText]); // ✅ tickerText change হলে restart

  const load = useCallback(async () => {
    try {
      setError(null);
      const data = await fetchMovies();
      const movies = (data.movies || [])
        .filter(m => m.source === 'MovieDB')
        .map(normalizeMovie);  // ← normalizeMovie দিয়ে সব field সেট

      setAllMovies(movies);

      const cats = new Set();
      movies.forEach(m => m.categories.forEach(c => cats.add(c)));
      setCategories(['All', ...Array.from(cats).sort()]);

      setFiltered(movies);
      setDisplayed(movies.slice(0, moviesPerPage));
      setHasMore(movies.length > moviesPerPage);
      setPage(1);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [moviesPerPage]);

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (!allMovies.length) return;
    let result = allMovies.filter(m => {
      const s = m.name.toLowerCase().includes(search.toLowerCase());
      const c = activeCat === 'all'
        || m.categories.some(x => x.toLowerCase() === activeCat.toLowerCase());
      return s && c;
    });
    if (show18) {
      const adult  = result.filter(m => m.isBlurred);
      const normal = result.filter(m => !m.isBlurred);
      result = [...adult, ...normal];
    }
    setFiltered(result);
    setDisplayed(result.slice(0, moviesPerPage));
    setHasMore(result.length > moviesPerPage);
    setPage(1);
  }, [search, activeCat, show18, allMovies, moviesPerPage]);

  useEffect(() => {
    if (search.length > 0) {
      setSuggestions(
        allMovies
          .filter(m => m.name.toLowerCase().includes(search.toLowerCase()))
          .slice(0, 6)
      );
      setShowSugg(true);
    } else {
      setShowSugg(false);
    }
  }, [search, allMovies]);

  const searchRef = useRef(null);
  const refreshRotate = useRef(new Animated.Value(0)).current;

  const startRefreshAnim = () => {
    refreshRotate.setValue(0);
    Animated.loop(
      Animated.timing(refreshRotate, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      })
    ).start();
  };

  const stopRefreshAnim = () => refreshRotate.stopAnimation();

  const loadMore = () => {
    if (!hasMore) return;
    const np   = page + 1;
    const more = filtered.slice(0, np * moviesPerPage);
    setDisplayed(more);
    setHasMore(filtered.length > more.length);
    setPage(np);
  };

  const openModal = (movie) => {
    setSelMovie(movie);
    setModalVisible(true);
    setShowSugg(false);
  };

  // ── Loading skeleton ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />
        <View style={styles.header}>
          <Text style={styles.logoTxt}>Flixify</Text>
          <View style={{ flex: 1 }} />
          <View style={[styles.searchBox, { opacity: 0.35 }]}>
            <Ionicons name="search" size={18} color={COLORS.cyan} style={{ marginRight: 10 }} />
            <Text style={{ color: 'rgba(255,255,255,0.2)', fontSize: 14 }}>Loading…</Text>
          </View>
        </View>
        <SkeletonGrid />
      </View>
    );
  }

  // ── Error ───────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <View style={styles.center}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />
        <Ionicons name="cloud-offline-outline" size={64} color={COLORS.red} />
        <Text style={styles.errTitle}>Failed to Load</Text>
        <Text style={styles.errSub}>{error}</Text>
        <TouchableOpacity
          style={styles.retryBtn}
          onPress={() => { setLoading(true); load(); }}
        >
          <Text style={styles.retryTxt}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Main UI ─────────────────────────────────────────────────────────────────
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />

      {/* ── HEADER ── */}
      <View style={styles.header}>
        <Text style={styles.logoTxt}>Flixify</Text>
        {show18 && (
          <View style={styles.adultBadge}>
            <Text style={styles.adultBadgeTxt}>18+</Text>
          </View>
        )}

        <View style={{ flex: 1 }} />

        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color={COLORS.pink} style={{ marginRight: 10 }} />
          <TextInput
            ref={searchRef}
            style={styles.searchInput}
            placeholder="Search movies & series…"
            placeholderTextColor="rgba(255,255,255,0.28)"
            value={search}
            onChangeText={setSearch}
            onFocus={() => search.length > 0 && setShowSugg(true)}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => { setSearch(''); setShowSugg(false); }}>
              <Ionicons name="close-circle" size={19} color="rgba(255,255,255,0.35)" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ── SUGGESTIONS ── */}
      {showSugg && suggestions.length > 0 && (
        <View style={styles.suggBox}>
          {suggestions.map((m, i) => (
            <TouchableOpacity
              key={i}
              style={[styles.suggRow, i < suggestions.length - 1 && styles.suggBorder]}
              onPress={() => { openModal(m); setSearch(''); setShowSugg(false); }}
            >
              <Image source={{ uri: m.thumbnail }} style={styles.suggImg} />
              <View style={{ flex: 1 }}>
                <Text style={styles.suggName} numberOfLines={1}>{m.name}</Text>
                <View style={styles.suggPill}>
                  <Text style={styles.suggPillTxt}>{m.type || 'Movie'}</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* ── TICKER — GAS settings থেকে ── */}
      <View style={styles.ticker}>
        <Animated.Text
          style={[styles.tickerTxt, { transform: [{ translateX: tickX }] }]}
          numberOfLines={1}
        >
          {tickerText}
        </Animated.Text>
      </View>

      {/* ── CATEGORY CHIPS ── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.catScroll}
        contentContainerStyle={styles.catContent}
      >
        {categories.map((cat, i) => {
          const key = cat === 'All' ? 'all' : cat;
          const on  = activeCat === key;
          return (
            <TouchableOpacity
              key={i}
              style={[styles.catChip, on && styles.catChipOn]}
              onPress={() => setActiveCat(key)}
            >
              <Text style={[styles.catTxt, on && styles.catTxtOn]}>{cat}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* ── GRID ── */}
      <FlatList
        data={displayed}
        keyExtractor={item => item.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.gridPad}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              startRefreshAnim();
              load().finally(() => stopRefreshAnim());
            }}
            tintColor={COLORS.cyan}
            colors={[COLORS.cyan]}
            progressBackgroundColor="#0e0e14"
          />
        }
        ListHeaderComponent={
          <View style={styles.listHeader}>
            <Text style={styles.sectionTitle}>
              {activeCat === 'all' ? 'Latest' : activeCat}
            </Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="film-outline" size={56} color="rgba(255,255,255,0.08)" />
            <Text style={styles.emptyTxt}>No results found</Text>
          </View>
        }
        ListFooterComponent={
          hasMore ? (
            <TouchableOpacity style={styles.moreBtn} onPress={loadMore}>
              <LinearGradient
                colors={['rgba(0,229,255,0.10)', 'rgba(0,229,255,0.03)']}
                style={StyleSheet.absoluteFillObject}
                borderRadius={50}
              />
              <Ionicons name="chevron-down" size={16} color={COLORS.cyan} />
              <Text style={styles.moreTxt}>Load More</Text>
            </TouchableOpacity>
          ) : null
        }
        renderItem={({ item }) => (
          <MovieCard movie={item} onPress={openModal} show18={show18} />
        )}
      />

      {/* ── MODAL ── */}
      <MovieModal
        movie={selMovie}
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        settings={settings}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  center: {
    flex: 1, backgroundColor: COLORS.bg,
    alignItems: 'center', justifyContent: 'center', padding: 30,
  },
  errTitle: { color: COLORS.white, fontSize: 20, fontWeight: '800', marginTop: 16 },
  errSub:   { color: COLORS.gray,  fontSize: 13, marginTop: 8, textAlign: 'center', lineHeight: 20 },
  retryBtn: {
    marginTop: 24, backgroundColor: COLORS.cyan,
    paddingHorizontal: 32, paddingVertical: 12, borderRadius: 30,
  },
  retryTxt: { color: '#000', fontWeight: '800', fontSize: 14 },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)',
    gap: 8,
    backgroundColor: '#06060b',
  },
  logoTxt: {
    color: COLORS.cyan, fontSize: 19, fontWeight: '900',
    letterSpacing: -0.5,
  },
  adultBadge: {
    backgroundColor: '#f43f5e',
    paddingHorizontal: 7, paddingVertical: 2,
    borderRadius: 6,
  },
  adultBadgeTxt: { color: '#fff', fontSize: 9, fontWeight: '900', letterSpacing: 0.5 },
  searchBox: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 50, borderWidth: 1.5,
    borderColor: 'rgba(0,229,255,0.20)',
    paddingHorizontal: 16, height: 44,
    width: 200,
  },
  searchInput: { flex: 1, color: '#fff', fontSize: 14, paddingVertical: 0 },
  suggBox: {
    position: 'absolute', top: 60, left: 14, right: 14,
    backgroundColor: '#13131e',
    borderRadius: 16, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    zIndex: 999, elevation: 18,
    shadowColor: '#000', shadowOpacity: 0.7, shadowRadius: 16,
    overflow: 'hidden',
  },
  suggRow: {
    flexDirection: 'row', alignItems: 'center',
    gap: 12, padding: 10,
  },
  suggBorder: { borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  suggImg:   { width: 36, height: 52, borderRadius: 6, backgroundColor: '#222' },
  suggName:  { color: '#fff', fontSize: 13, fontWeight: '600', maxWidth: width - 130 },
  suggPill: {
    backgroundColor: COLORS.cyan, paddingHorizontal: 8, paddingVertical: 2,
    borderRadius: 8, alignSelf: 'flex-start', marginTop: 4,
  },
  suggPillTxt: { color: '#000', fontSize: 9, fontWeight: '800' },
  ticker: {
    backgroundColor: '#07070e',
    borderBottomWidth: 1, borderBottomColor: 'rgba(0,229,255,0.07)',
    paddingVertical: 7, overflow: 'hidden', height: 32,
  },
  tickerTxt: { color: COLORS.cyan, fontSize: 11.5, fontWeight: '600' },
  catScroll:  { flexShrink: 0 },
  catContent: {
    paddingHorizontal: 14, paddingVertical: 10,
    gap: 8, alignItems: 'center',
  },
  catChip: {
    paddingHorizontal: 16, paddingVertical: 7,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
    borderRadius: 50, overflow: 'hidden',
  },
  catChipOn: { backgroundColor: COLORS.cyan, borderColor: COLORS.cyan },
  catTxt:    { color: 'rgba(255,255,255,0.40)', fontSize: 12, fontWeight: '600' },
  catTxtOn:  { color: '#000', fontWeight: '800' },
  gridPad: { paddingHorizontal: 14, paddingBottom: 40 },
  row:     { justifyContent: 'space-between' },
  listHeader: { marginBottom: 10, marginTop: 8 },
  sectionTitle: {
    color: COLORS.white, fontSize: 17, fontWeight: '800',
    letterSpacing: -0.3,
  },
  empty: {
    alignItems: 'center', justifyContent: 'center',
    padding: 60, gap: 12,
  },
  emptyTxt: { color: 'rgba(255,255,255,0.18)', fontSize: 15, fontWeight: '600' },
  moreBtn: {
    flexDirection: 'row',
    alignSelf: 'center',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1, borderColor: 'rgba(0,229,255,0.20)',
    paddingVertical: 12, paddingHorizontal: 36,
    borderRadius: 50, marginVertical: 20,
    overflow: 'hidden',
  },
  moreTxt: { color: COLORS.cyan, fontWeight: '700', fontSize: 13 },
});
