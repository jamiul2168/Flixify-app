import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  StyleSheet, StatusBar, Animated, Image,
  Dimensions, ScrollView, RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../utils/constants';
import { fetchMovies, normalizeMovie } from '../utils/api';
import MovieCard from '../components/MovieCard';
import MovieModal from '../components/MovieModal';
import { SkeletonGrid } from '../components/SkeletonCard';

const LOGO = require('../../assets/logo.png');
const { width } = Dimensions.get('window');
const CYAN   = '#00f2ff';
const PINK   = '#ff0059';
const BG     = '#030303';
const BG1    = '#0f0f0f';
const BG2    = '#111111';
const BORDER = 'rgba(0,242,255,0.12)';

export default function HomeScreen({ show18 = false, settings = {} }) {
  const insets = useSafeAreaInsets();

  const moviesPerPage = settings.moviesPerPage || 18;
  const tickerText    = settings.tickerText    || '🎬 MovieDen তে স্বাগতম!';
  const contentApiUrl = settings.contentApiUrl || undefined;
  const contentDomain = settings.contentDomain || undefined;
  const telegramUrl   = settings.telegramUrl   || 'https://t.me/movieden';
  const requestUrl    = settings.requestUrl    || 'https://movieden.app/';
  const appName       = settings.appName       || 'MovieDen';
  const logoUrl       = settings.logoUrl       || '';

  const [allMovies,    setAllMovies]    = useState([]);
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
  const [showAdult,    setShowAdult]    = useState(false);
  const [popularList,  setPopularList]  = useState([]);

  const tickX    = useRef(new Animated.Value(width)).current;
  const tickAnim = useRef(null);
  const searchRef = useRef(null);

  // Ticker animation
  useEffect(() => {
    if (tickAnim.current) tickAnim.current.stop();
    tickX.setValue(width);
    tickAnim.current = Animated.loop(
      Animated.timing(tickX, { toValue: -width * 5, duration: 28000, useNativeDriver: true })
    );
    tickAnim.current.start();
    return () => { if (tickAnim.current) tickAnim.current.stop(); };
  }, [tickerText]);

  const getFiltered = useCallback((movies, cat, q, adult) => {
    return movies.filter(m => {
      const matchQ   = !q || m.name.toLowerCase().includes(q.toLowerCase());
      const matchCat = cat === 'all' || (m.categories || []).some(c => c.toLowerCase() === cat.toLowerCase());
      const matchAdult = adult ? m.isBlurred : true;
      return matchQ && matchCat && matchAdult;
    });
  }, []);

  const load = useCallback(async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      setError(null);
      const data   = await fetchMovies(contentApiUrl, contentDomain);
      const movies = (data.movies || []).filter(m => m.source === 'MovieDB').map(normalizeMovie);
      setAllMovies(movies);
      const cats = new Set();
      movies.forEach(m => m.categories.forEach(c => cats.add(c)));
      setCategories(['All', ...Array.from(cats).sort()]);
      const filtered = getFiltered(movies, 'all', '', false);
      setDisplayed(filtered.slice(0, moviesPerPage));
      setHasMore(filtered.length > moviesPerPage);
      setPopularList(movies.slice(0, 12));
      setPage(1);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [contentApiUrl, contentDomain, moviesPerPage, getFiltered]);

  useEffect(() => { load(); }, [load]);

  const applyFilter = (cat, q, adult) => {
    const filtered = getFiltered(allMovies, cat, q, adult);
    setDisplayed(filtered.slice(0, moviesPerPage));
    setHasMore(filtered.length > moviesPerPage);
    setPage(1);
  };

  const onCatPress = (cat) => {
    const key = cat === 'All' ? 'all' : cat;
    setActiveCat(key);
    applyFilter(key, search, showAdult);
  };

  const onSearch = (q) => {
    setSearch(q);
    if (q.length > 1) {
      const sugg = allMovies.filter(m => m.name.toLowerCase().includes(q.toLowerCase())).slice(0, 6);
      setSuggestions(sugg); setShowSugg(true);
    } else { setShowSugg(false); }
    applyFilter(activeCat, q, showAdult);
  };

  const onToggleAdult = () => {
    const next = !showAdult;
    setShowAdult(next);
    applyFilter(activeCat, search, next);
  };

  const loadMore = () => {
    const filtered = getFiltered(allMovies, activeCat, search, showAdult);
    const nextPage = page + 1;
    const more = filtered.slice(0, nextPage * moviesPerPage);
    setDisplayed(more);
    setHasMore(more.length < filtered.length);
    setPage(nextPage);
  };

  const openModal = (movie) => { setSelMovie(movie); setModalVisible(true); };

  // ── HEADER ──────────────────────────────────────────────────────────────────
  const Header = () => (
    <View style={[s.header, { paddingTop: insets.top + 8 }]}>
      {/* Logo + Name */}
      <View style={s.headerLeft}>
        {logoUrl ? (
          <Image source={{ uri: logoUrl }} style={s.headerLogo} />
        ) : (
          <Image source={LOGO} style={s.headerLogo} />
        )}
        <Text style={s.headerName}>{appName}</Text>
      </View>
      {/* Search */}
      <View style={s.searchBox}>
        <Ionicons name="search" size={14} color={CYAN} style={{ marginRight: 6 }} />
        <TextInput
          ref={searchRef}
          style={s.searchInput}
          placeholder="Search movies, series..."
          placeholderTextColor="rgba(255,255,255,0.35)"
          value={search}
          onChangeText={onSearch}
          returnKeyType="search"
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => { setSearch(''); setShowSugg(false); applyFilter(activeCat, '', showAdult); }}>
            <Ionicons name="close-circle" size={15} color="rgba(255,255,255,0.4)" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  // ── TICKER ──────────────────────────────────────────────────────────────────
  const Ticker = () => (
    <View style={s.ticker}>
      <Animated.Text style={[s.tickerText, { transform: [{ translateX: tickX }] }]}>
        {tickerText}
      </Animated.Text>
    </View>
  );

  // ── ACTION BUTTONS ───────────────────────────────────────────────────────────
  const ActionBtns = () => (
    <View style={s.btnRow}>
      <TouchableOpacity style={[s.actionBtn, s.btnTg]} onPress={() => require('react-native').Linking.openURL(telegramUrl)}>
        <Ionicons name="paper-plane" size={14} color={CYAN} />
        <Text style={[s.actionBtnTxt, { color: CYAN }]}>Telegram</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[s.actionBtn, s.btnReq]} onPress={() => require('react-native').Linking.openURL(requestUrl)}>
        <Ionicons name="add-circle-outline" size={14} color="#a78bfa" />
        <Text style={[s.actionBtnTxt, { color: '#a78bfa' }]}>Request</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[s.actionBtn, showAdult ? s.btn18On : s.btn18]} onPress={onToggleAdult}>
        <Ionicons name={showAdult ? 'eye' : 'eye-off-outline'} size={14} color={showAdult ? '#00ff91' : PINK} />
        <Text style={[s.actionBtnTxt, { color: showAdult ? '#00ff91' : PINK }]}>
          {showAdult ? 'Hide 18+' : 'Show 18+'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  // ── POPULAR SLIDER ───────────────────────────────────────────────────────────
  const PopularSlider = () => {
    if (!popularList.length) return null;
    return (
      <View style={s.sliderSection}>
        <View style={s.sliderHdr}>
          <View style={s.titleBar} />
          <Ionicons name="flame" size={14} color={PINK} style={{ marginRight: 6 }} />
          <Text style={s.sliderTitle}>Popular Movies</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 14, gap: 10 }}>
          {popularList.map((m, i) => (
            <TouchableOpacity key={i} style={s.popularCard} onPress={() => openModal(m)} activeOpacity={0.8}>
              <Image source={{ uri: m.thumbnail }} style={s.popularImg} />
              <Text style={s.popularName} numberOfLines={1}>{m.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  // ── CATEGORIES ───────────────────────────────────────────────────────────────
  const Categories = () => (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.catScroll}>
      {categories.map((cat, i) => {
        const key    = cat === 'All' ? 'all' : cat;
        const active = activeCat === key;
        return (
          <TouchableOpacity key={i} style={[s.chip, active && s.chipActive]} onPress={() => onCatPress(cat)} activeOpacity={0.8}>
            <Text style={[s.chipTxt, active && s.chipTxtActive]}>{cat}</Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );

  // ── SUGGESTIONS ──────────────────────────────────────────────────────────────
  const Suggestions = () => {
    if (!showSugg || !suggestions.length) return null;
    return (
      <View style={s.suggBox}>
        {suggestions.map((m, i) => (
          <TouchableOpacity key={i} style={s.suggItem} onPress={() => { setShowSugg(false); setSearch(m.name); openModal(m); }}>
            <Image source={{ uri: m.thumbnail }} style={s.suggImg} />
            <View style={{ flex: 1 }}>
              <Text style={s.suggName} numberOfLines={1}>{m.name}</Text>
              <View style={s.suggBadge}>
                <Text style={s.suggType}>{m.type || 'Movie'}</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  // ── SECTION HEADER ───────────────────────────────────────────────────────────
  const SectionHdr = () => (
    <View style={s.sectionHdr}>
      <View style={s.titleBar} />
      <Ionicons name="time-outline" size={16} color={CYAN} style={{ marginRight: 6 }} />
      <Text style={s.sectionTitle}>Latest Updates</Text>
    </View>
  );

  // ── LOAD MORE ────────────────────────────────────────────────────────────────
  const LoadMoreBtn = () => {
    if (!hasMore) return null;
    return (
      <TouchableOpacity style={s.loadMoreBtn} onPress={loadMore} activeOpacity={0.8}>
        <Text style={s.loadMoreTxt}>Load More</Text>
      </TouchableOpacity>
    );
  };

  // ── ERROR ────────────────────────────────────────────────────────────────────
  if (error) return (
    <View style={s.errBox}>
      <Ionicons name="alert-circle-outline" size={48} color={PINK} />
      <Text style={s.errTxt}>Failed to load movies</Text>
      <TouchableOpacity style={s.retryBtn} onPress={() => load()}>
        <Text style={s.retryTxt}>Retry</Text>
      </TouchableOpacity>
    </View>
  );

  const ListHeader = () => (
    <>
      <Ticker />
      <ActionBtns />
      <PopularSlider />
      <Categories />
      <SectionHdr />
      {showSugg && <Suggestions />}
    </>
  );

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={BG} />
      <Header />

      {loading ? (
        <>
          <ListHeader />
          <SkeletonGrid />
        </>
      ) : (
        <FlatList
          data={displayed}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={s.colWrap}
          contentContainerStyle={[s.listContent, { paddingBottom: insets.bottom + 80 }]}
          ListHeaderComponent={<ListHeader />}
          ListFooterComponent={<LoadMoreBtn />}
          renderItem={({ item }) => (
            <MovieCard
              movie={item}
              show18={show18}
              onPress={() => openModal(item)}
              appName={appName}
            />
          )}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(true); }} tintColor={CYAN} />}
          showsVerticalScrollIndicator={false}
          onScrollBeginDrag={() => setShowSugg(false)}
        />
      )}

      <MovieModal
        visible={modalVisible}
        movie={selMovie}
        settings={settings}
        onClose={() => { setModalVisible(false); setSelMovie(null); }}
      />
    </View>
  );
}

const s = StyleSheet.create({
  root:    { flex: 1, backgroundColor: BG },

  // Header
  header:  { backgroundColor: BG, borderBottomWidth: 1, borderBottomColor: BORDER, paddingHorizontal: 14, paddingBottom: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerLogo: { width: 32, height: 32, borderRadius: 8 },
  headerName: { fontSize: 20, fontWeight: '900', color: '#fff', letterSpacing: -0.5 },
  searchBox:  { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 10, paddingHorizontal: 12, height: 38 },
  searchInput: { flex: 1, color: '#fff', fontSize: 13, padding: 0 },

  // Ticker
  ticker:     { backgroundColor: BG1, borderBottomWidth: 1, borderBottomColor: 'rgba(0,242,255,0.15)', paddingVertical: 9, overflow: 'hidden' },
  tickerText: { color: CYAN, fontSize: 13, fontWeight: '600', whiteSpace: 'nowrap' },

  // Action buttons
  btnRow:    { flexDirection: 'row', gap: 8, paddingHorizontal: 14, paddingVertical: 12 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 11, borderRadius: 10, borderWidth: 1 },
  actionBtnTxt: { fontSize: 12, fontWeight: '700' },
  btnTg:    { backgroundColor: 'rgba(0,242,255,0.04)', borderColor: 'rgba(0,242,255,0.3)' },
  btnReq:   { backgroundColor: 'rgba(167,139,250,0.06)', borderColor: 'rgba(167,139,250,0.3)' },
  btn18:    { backgroundColor: 'rgba(255,0,89,0.05)', borderColor: 'rgba(255,0,89,0.3)' },
  btn18On:  { backgroundColor: 'rgba(0,255,145,0.08)', borderColor: '#00ff91' },

  // Popular slider
  sliderSection: { marginBottom: 14 },
  sliderHdr:     { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, marginBottom: 10 },
  sliderTitle:   { fontSize: 15, fontWeight: '800', color: '#fff' },
  popularCard:   { width: 85, alignItems: 'center', gap: 5 },
  popularImg:    { width: 85, height: 120, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  popularName:   { fontSize: 10, fontWeight: '600', color: 'rgba(255,255,255,0.7)', textAlign: 'center', width: 85 },

  // Categories
  catScroll: { paddingHorizontal: 14, paddingBottom: 12, gap: 7 },
  chip:      { paddingHorizontal: 16, paddingVertical: 7, backgroundColor: BG1, borderWidth: 1, borderColor: '#222', borderRadius: 8 },
  chipActive: { backgroundColor: CYAN, borderColor: CYAN },
  chipTxt:   { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.7)' },
  chipTxtActive: { color: '#000', fontWeight: '800' },

  // Suggestions
  suggBox:  { position: 'absolute', top: 0, left: 14, right: 14, backgroundColor: '#111', borderWidth: 1, borderColor: '#222', borderRadius: 12, zIndex: 999, elevation: 10, overflow: 'hidden' },
  suggItem: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10, borderBottomWidth: 1, borderBottomColor: '#1a1a1a' },
  suggImg:  { width: 32, height: 46, borderRadius: 5, objectFit: 'cover' },
  suggName: { fontSize: 13, fontWeight: '600', color: '#fff' },
  suggBadge:{ marginTop: 3 },
  suggType: { fontSize: 10, fontWeight: '800', backgroundColor: CYAN, color: '#000', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 10, alignSelf: 'flex-start' },

  // Section
  sectionHdr:   { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, marginBottom: 12, marginTop: 4 },
  titleBar:     { width: 4, height: 18, borderRadius: 2, backgroundColor: CYAN, marginRight: 8, shadowColor: CYAN, shadowOpacity: 0.8, shadowRadius: 4 },
  sectionTitle: { fontSize: 17, fontWeight: '800', color: '#fff' },

  // Grid
  listContent: { paddingHorizontal: 14 },
  colWrap:     { justifyContent: 'space-between', marginBottom: 12 },

  // Load more
  loadMoreBtn: { margin: 20, marginHorizontal: 60, paddingVertical: 14, backgroundColor: BG2, borderWidth: 1, borderColor: '#222', borderRadius: 10, alignItems: 'center' },
  loadMoreTxt: { color: '#fff', fontWeight: '700', fontSize: 14 },

  // Error
  errBox:    { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: BG, gap: 16 },
  errTxt:    { color: 'rgba(255,255,255,0.6)', fontSize: 16 },
  retryBtn:  { paddingHorizontal: 32, paddingVertical: 12, backgroundColor: CYAN, borderRadius: 30 },
  retryTxt:  { color: '#000', fontWeight: '800', fontSize: 14 },
});
