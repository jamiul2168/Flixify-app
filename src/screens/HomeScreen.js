import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  StyleSheet, StatusBar, ActivityIndicator, ScrollView,
  RefreshControl, Dimensions, Animated, Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as WebBrowser from 'expo-web-browser';
import {
  COLORS, MOVIES_PER_PAGE, TELEGRAM_URL, REQUEST_URL,
} from '../utils/constants';
import { fetchMovies } from '../utils/api';
import MovieCard from '../components/MovieCard';
import MovieModal from '../components/MovieModal';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const insets = useSafeAreaInsets();

  const [allMovies,    setAllMovies]    = useState([]);
  const [filtered,     setFiltered]     = useState([]);
  const [displayed,    setDisplayed]    = useState([]);
  const [categories,   setCategories]   = useState(['All']);
  const [activeCat,    setActiveCat]    = useState('all');
  const [search,       setSearch]       = useState('');
  const [show18,       setShow18]       = useState(false);
  const [loading,      setLoading]      = useState(true);
  const [refreshing,   setRefreshing]   = useState(false);
  const [error,        setError]        = useState(null);
  const [page,         setPage]         = useState(1);
  const [hasMore,      setHasMore]      = useState(false);
  const [selMovie,     setSelMovie]     = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [suggestions,  setSuggestions]  = useState([]);
  const [showSugg,     setShowSugg]     = useState(false);

  const tickX = useRef(new Animated.Value(width)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(tickX, {
        toValue: -width * 4,
        duration: 22000,
        useNativeDriver: true,
      })
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const load = useCallback(async () => {
    try {
      setError(null);
      const data = await fetchMovies();
      const movies = (data.movies || [])
        .filter(m => m.source === 'MovieDB')
        .map(m => ({
          ...m,
          id: m.id || m.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          categories: Array.isArray(m.categories) ? m.categories : [],
        }));

      setAllMovies(movies);

      const cats = new Set();
      movies.forEach(m => m.categories.forEach(c => cats.add(c)));
      setCategories(['All', ...Array.from(cats).sort()]);

      setFiltered(movies);
      setDisplayed(movies.slice(0, MOVIES_PER_PAGE));
      setHasMore(movies.length > MOVIES_PER_PAGE);
      setPage(1);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (!allMovies.length) return;
    const result = allMovies.filter(m => {
      const s = m.name.toLowerCase().includes(search.toLowerCase());
      const c = activeCat === 'all'
        || m.categories.some(x => x.toLowerCase() === activeCat.toLowerCase());
      const b = !show18 ? true : m.isBlurred;
      return s && c && b;
    });
    setFiltered(result);
    setDisplayed(result.slice(0, MOVIES_PER_PAGE));
    setHasMore(result.length > MOVIES_PER_PAGE);
    setPage(1);
  }, [search, activeCat, show18, allMovies]);

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

  const loadMore = () => {
    if (!hasMore) return;
    const np   = page + 1;
    const more = filtered.slice(0, np * MOVIES_PER_PAGE);
    setDisplayed(more);
    setHasMore(filtered.length > more.length);
    setPage(np);
  };

  const openModal = (movie) => {
    setSelMovie(movie);
    setModalVisible(true);
    setShowSugg(false);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />
        <Text style={styles.logoText}>Flixify</Text>
        <ActivityIndicator size="large" color={COLORS.cyan} style={{ marginTop: 24 }} />
        <Text style={styles.loadTxt}>Loading...</Text>
      </View>
    );
  }

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

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />

      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.logo}>Flixify</Text>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={15} color={COLORS.cyan} style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search movies & series..."
            placeholderTextColor="rgba(255,255,255,0.3)"
            value={search}
            onChangeText={setSearch}
            onFocus={() => search.length > 0 && setShowSugg(true)}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => { setSearch(''); setShowSugg(false); }}>
              <Ionicons name="close-circle" size={17} color="rgba(255,255,255,0.4)" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* SUGGESTIONS */}
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

      {/* TICKER */}
      <View style={styles.ticker}>
        <Animated.Text style={[styles.tickerTxt, { transform: [{ translateX: tickX }] }]}>
          {'🔥 নতুন মুভি পেতে Telegram গ্রুপে join করুন   •   Request করুন আপনার পছন্দের মুভি 🎬'}
        </Animated.Text>
      </View>

      {/* BUTTONS */}
      <View style={styles.btnRow}>
        <TouchableOpacity
          style={[styles.navBtn, styles.btnTg]}
          onPress={() => WebBrowser.openBrowserAsync(TELEGRAM_URL)}
        >
          <Ionicons name="paper-plane" size={13} color="#fff" />
          <Text style={styles.navBtnTxt}>Telegram</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navBtn, styles.btnReq]}
          onPress={() => WebBrowser.openBrowserAsync(REQUEST_URL)}
        >
          <Ionicons name="add-circle-outline" size={13} color="#fff" />
          <Text style={styles.navBtnTxt}>Request</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navBtn, styles.btn18, show18 && styles.btn18On]}
          onPress={() => setShow18(p => !p)}
        >
          <Ionicons name={show18 ? 'eye' : 'eye-off'} size={13} color="#fff" />
          <Text style={styles.navBtnTxt}>{show18 ? 'Hide 18+' : '18+'}</Text>
        </TouchableOpacity>
      </View>

      {/* CATEGORIES */}
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

      {/* GRID */}
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
            onRefresh={() => { setRefreshing(true); load(); }}
            tintColor={COLORS.cyan}
          />
        }
        ListHeaderComponent={
          <View style={styles.listHeader}>
            <Text style={styles.sectionTitle}>Latest</Text>
            <Text style={styles.countTxt}>{filtered.length} titles</Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="film-outline" size={56} color="rgba(255,255,255,0.1)" />
            <Text style={styles.emptyTxt}>No results found</Text>
          </View>
        }
        ListFooterComponent={
          hasMore ? (
            <TouchableOpacity style={styles.moreBtn} onPress={loadMore}>
              <Text style={styles.moreTxt}>Load More</Text>
            </TouchableOpacity>
          ) : null
        }
        renderItem={({ item }) => (
          <MovieCard movie={item} onPress={openModal} />
        )}
      />

      {/* MODAL */}
      <MovieModal
        movie={selMovie}
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
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
  logoText: { color: COLORS.cyan, fontSize: 36, fontWeight: '900', letterSpacing: -1 },
  loadTxt:  { color: COLORS.gray, fontSize: 14, marginTop: 12 },
  errTitle: { color: COLORS.white, fontSize: 20, fontWeight: '800', marginTop: 16 },
  errSub:   { color: COLORS.gray,  fontSize: 13, marginTop: 8, textAlign: 'center', lineHeight: 20 },
  retryBtn: {
    marginTop: 24, backgroundColor: COLORS.cyan,
    paddingHorizontal: 32, paddingVertical: 12, borderRadius: 30,
  },
  retryTxt: { color: '#000', fontWeight: '800', fontSize: 14 },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 11,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
    gap: 12,
  },
  logo: { color: COLORS.cyan, fontSize: 20, fontWeight: '900', letterSpacing: -0.5 },
  searchBox: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 50, borderWidth: 1, borderColor: COLORS.border,
    paddingHorizontal: 14, height: 40,
  },
  searchInput: { flex: 1, color: '#fff', fontSize: 13, paddingVertical: 0 },
  suggBox: {
    position: 'absolute', top: 62, left: 16, right: 16,
    backgroundColor: '#13131c',
    borderRadius: 14, borderWidth: 1, borderColor: COLORS.border,
    zIndex: 999, elevation: 14,
    shadowColor: '#000', shadowOpacity: 0.6, shadowRadius: 12,
    overflow: 'hidden',
  },
  suggRow: {
    flexDirection: 'row', alignItems: 'center',
    gap: 12, padding: 10,
  },
  suggBorder: { borderBottomWidth: 1, borderBottomColor: COLORS.border },
  suggImg:  { width: 36, height: 52, borderRadius: 6, backgroundColor: '#222' },
  suggName: { color: '#fff', fontSize: 13, fontWeight: '600', maxWidth: width - 130 },
  suggPill: {
    backgroundColor: COLORS.cyan, paddingHorizontal: 8, paddingVertical: 2,
    borderRadius: 8, alignSelf: 'flex-start', marginTop: 4,
  },
  suggPillTxt: { color: '#000', fontSize: 9, fontWeight: '800' },
  ticker: {
    backgroundColor: '#0a0a10',
    borderTopWidth: 1, borderBottomWidth: 1, borderColor: COLORS.border,
    paddingVertical: 7, overflow: 'hidden',
  },
  tickerTxt: { color: COLORS.cyan, fontSize: 12, fontWeight: '600' },
  btnRow: {
    flexDirection: 'row', gap: 8,
    paddingHorizontal: 16, paddingVertical: 10,
  },
  navBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 5,
    paddingVertical: 10, borderRadius: 40,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  navBtnTxt: { color: '#fff', fontSize: 11, fontWeight: '700' },
  btnTg:   { borderColor: 'rgba(0,229,255,0.3)' },
  btnReq:  { borderColor: 'rgba(124,58,237,0.35)' },
  btn18:   { borderColor: 'rgba(255,45,85,0.35)' },
  btn18On: { backgroundColor: 'rgba(16,185,129,0.12)', borderColor: COLORS.green },
  catScroll:  { maxHeight: 46 },
  catContent: { paddingHorizontal: 16, paddingVertical: 6, gap: 8, alignItems: 'center' },
  catChip: {
    paddingHorizontal: 16, paddingVertical: 6,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1, borderColor: COLORS.border, borderRadius: 50,
  },
  catChipOn: { backgroundColor: COLORS.cyan, borderColor: COLORS.cyan },
  catTxt:    { color: COLORS.gray, fontSize: 12, fontWeight: '600' },
  catTxtOn:  { color: '#000' },
  gridPad:   { paddingHorizontal: 16, paddingBottom: 40 },
  row:       { justifyContent: 'space-between' },
  listHeader: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 12, marginTop: 10,
  },
  sectionTitle: { color: COLORS.white, fontSize: 18, fontWeight: '800' },
  countTxt:     { color: COLORS.gray, fontSize: 12 },
  empty: {
    alignItems: 'center', justifyContent: 'center',
    padding: 60, gap: 12,
  },
  emptyTxt: { color: 'rgba(255,255,255,0.2)', fontSize: 15, fontWeight: '600' },
  moreBtn: {
    alignSelf: 'center',
    borderWidth: 1, borderColor: COLORS.border,
    paddingVertical: 13, paddingHorizontal: 40,
    borderRadius: 50, marginVertical: 20,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  moreTxt: { color: COLORS.white, fontWeight: '700', fontSize: 14 },
});
