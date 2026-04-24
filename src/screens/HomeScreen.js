import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
  Dimensions,
  Animated,
  Image,
} from 'react-native';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import { COLORS, MOVIES_PER_PAGE, TELEGRAM_URL, REQUEST_URL } from '../utils/constants';
import { fetchMovies } from '../utils/api';
import MovieCard from '../components/MovieCard';
import MovieModal from '../components/MovieModal';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const [allMovies, setAllMovies] = useState([]);
  const [filteredMovies, setFilteredMovies] = useState([]);
  const [displayedMovies, setDisplayedMovies] = useState([]);
  const [categories, setCategories] = useState(['All']);
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchText, setSearchText] = useState('');
  const [show18, setShow18] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [blocked, setBlocked] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const tickerAnim = useRef(new Animated.Value(width)).current;

  // Ticker animation
  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(tickerAnim, {
        toValue: -width * 3,
        duration: 18000,
        useNativeDriver: true,
      })
    );
    loop.start();
    return () => loop.stop();
  }, []);

  // Load movies
  const loadMovies = useCallback(async () => {
    try {
      setError(null);
      const data = await fetchMovies();

      if (data.domainBlocked) {
        setBlocked(true);
        setLoading(false);
        setRefreshing(false);
        return;
      }

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

      const initial = movies.slice(0, MOVIES_PER_PAGE);
      setFilteredMovies(movies);
      setDisplayedMovies(initial);
      setHasMore(movies.length > MOVIES_PER_PAGE);
      setPage(1);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadMovies();
  }, []);

  // Apply filters
  useEffect(() => {
    if (!allMovies.length) return;

    let result = allMovies.filter(m => {
      const matchSearch = m.name.toLowerCase().includes(searchText.toLowerCase());
      const matchCat =
        activeCategory === 'all' ||
        m.categories.some(c => c.toLowerCase() === activeCategory.toLowerCase());
      const matchBlur = !show18 ? true : m.isBlurred;
      return matchSearch && matchCat && matchBlur;
    });

    setFilteredMovies(result);
    const initial = result.slice(0, MOVIES_PER_PAGE);
    setDisplayedMovies(initial);
    setHasMore(result.length > MOVIES_PER_PAGE);
    setPage(1);
  }, [searchText, activeCategory, show18, allMovies]);

  // Search suggestions
  useEffect(() => {
    if (searchText.length > 0) {
      const sugg = allMovies
        .filter(m => m.name.toLowerCase().includes(searchText.toLowerCase()))
        .slice(0, 6);
      setSearchSuggestions(sugg);
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  }, [searchText, allMovies]);

  const loadMore = () => {
    if (!hasMore) return;
    const nextPage = page + 1;
    const more = filteredMovies.slice(0, nextPage * MOVIES_PER_PAGE);
    setDisplayedMovies(more);
    setHasMore(filteredMovies.length > more.length);
    setPage(nextPage);
  };

  const openModal = (movie) => {
    setSelectedMovie(movie);
    setModalVisible(true);
    setShowSuggestions(false);
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadMovies();
  };

  // ====== RENDER STATES ======

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />
        <ActivityIndicator size="large" color={COLORS.cyan} />
        <Text style={styles.loadingText}>Loading Flixify...</Text>
      </View>
    );
  }

  if (blocked) {
    return (
      <View style={styles.blockedContainer}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />
        <Ionicons name="lock-closed" size={60} color={COLORS.red} />
        <Text style={styles.blockedTitle}>Access Denied</Text>
        <Text style={styles.blockedText}>
          এই ডোমেইনে সাইটটি চালানোর অনুমতি নেই।{'\n'}Developer এর সাথে যোগাযোগ করুন।
        </Text>
        <TouchableOpacity
          style={styles.contactBtn}
          onPress={() => WebBrowser.openBrowserAsync('https://web.facebook.com/jamiul2168')}
        >
          <Text style={styles.contactBtnText}>Contact Developer</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.blockedContainer}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />
        <Ionicons name="alert-circle" size={60} color={COLORS.red} />
        <Text style={styles.blockedTitle}>Failed to Load</Text>
        <Text style={styles.blockedText}>{error}</Text>
        <TouchableOpacity style={styles.contactBtn} onPress={onRefresh}>
          <Text style={styles.contactBtnText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />

      {/* ===== HEADER ===== */}
      <View style={styles.header}>
        <Text style={styles.logo}>Flixify</Text>
        <View style={styles.searchWrapper}>
          <Ionicons name="search" size={16} color={COLORS.cyan} style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search movies..."
            placeholderTextColor="rgba(255,255,255,0.4)"
            value={searchText}
            onChangeText={setSearchText}
            onFocus={() => searchText.length > 0 && setShowSuggestions(true)}
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={() => { setSearchText(''); setShowSuggestions(false); }}>
              <Ionicons name="close-circle" size={18} color="rgba(255,255,255,0.5)" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Search Suggestions */}
      {showSuggestions && searchSuggestions.length > 0 && (
        <View style={styles.suggestions}>
          {searchSuggestions.map((m, i) => (
            <TouchableOpacity
              key={i}
              style={styles.suggestionItem}
              onPress={() => { openModal(m); setSearchText(''); setShowSuggestions(false); }}
            >
              <Image source={{ uri: m.thumbnail }} style={styles.suggThumb} />
              <View>
                <Text style={styles.suggName} numberOfLines={1}>{m.name}</Text>
                <View style={styles.suggTypeBadge}>
                  <Text style={styles.suggTypeText}>{m.type || 'Movie'}</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* ===== TICKER ===== */}
      <View style={styles.ticker}>
        <Animated.Text style={[styles.tickerText, { transform: [{ translateX: tickerAnim }] }]}>
          🔥 Visit our site - Ads may appear. If redirected, just go back and click again. For ad-free downloads, join Premium! 🔥
        </Animated.Text>
      </View>

      {/* ===== ACTION BUTTONS ===== */}
      <View style={styles.btnGroup}>
        <TouchableOpacity
          style={[styles.navBtn, styles.btnTelegram]}
          onPress={() => WebBrowser.openBrowserAsync(TELEGRAM_URL)}
        >
          <Ionicons name="paper-plane" size={14} color="#fff" />
          <Text style={styles.navBtnText}>Telegram</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navBtn, styles.btnRequest]}
          onPress={() => WebBrowser.openBrowserAsync(REQUEST_URL)}
        >
          <Ionicons name="add" size={14} color="#fff" />
          <Text style={styles.navBtnText}>Request</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navBtn, styles.btn18, show18 && styles.btn18Active]}
          onPress={() => setShow18(!show18)}
        >
          <Ionicons name={show18 ? 'eye' : 'eye-off'} size={14} color="#fff" />
          <Text style={styles.navBtnText}>{show18 ? 'Hide 18+' : 'Show 18+'}</Text>
        </TouchableOpacity>
      </View>

      {/* ===== CATEGORIES ===== */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.catScroll}
        contentContainerStyle={styles.catContent}
      >
        {categories.map((cat, i) => {
          const key = cat === 'All' ? 'all' : cat;
          return (
            <TouchableOpacity
              key={i}
              style={[styles.chip, activeCategory === key && styles.chipActive]}
              onPress={() => setActiveCategory(key)}
            >
              <Text style={[styles.chipText, activeCategory === key && styles.chipTextActive]}>
                {cat}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* ===== MOVIE GRID ===== */}
      <FlatList
        data={displayedMovies}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.gridContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.cyan} />}
        ListHeaderComponent={<Text style={styles.sectionTitle}>Latest</Text>}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Ionicons name="film-outline" size={50} color="rgba(255,255,255,0.2)" />
            <Text style={styles.emptyText}>No Movies Found</Text>
          </View>
        }
        ListFooterComponent={
          hasMore ? (
            <TouchableOpacity style={styles.moreBtn} onPress={loadMore}>
              <Text style={styles.moreBtnText}>Load More</Text>
            </TouchableOpacity>
          ) : null
        }
        renderItem={({ item }) => (
          <MovieCard
            movie={item}
            onPress={openModal}
            showBlurred={show18}
          />
        )}
      />

      {/* ===== MOVIE MODAL ===== */}
      <MovieModal
        movie={selectedMovie}
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        show18={show18}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.bg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  loadingText: {
    color: COLORS.gray,
    fontSize: 15,
    fontWeight: '600',
  },
  blockedContainer: {
    flex: 1,
    backgroundColor: COLORS.bg,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    gap: 14,
  },
  blockedTitle: {
    color: COLORS.white,
    fontSize: 22,
    fontWeight: '800',
  },
  blockedText: {
    color: COLORS.gray,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
  },
  contactBtn: {
    backgroundColor: COLORS.red,
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 30,
    marginTop: 10,
  },
  contactBtnText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 14,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.grayDim,
    gap: 12,
  },
  logo: {
    color: COLORS.cyan,
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  searchWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f0f0f',
    borderRadius: 50,
    borderWidth: 1,
    borderColor: COLORS.grayDim,
    paddingHorizontal: 14,
    height: 42,
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 14,
    paddingVertical: 0,
  },

  // Suggestions
  suggestions: {
    position: 'absolute',
    top: 70,
    left: 16,
    right: 16,
    backgroundColor: '#111',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#222',
    zIndex: 999,
    maxHeight: 280,
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  suggThumb: {
    width: 35,
    height: 50,
    borderRadius: 6,
    backgroundColor: '#222',
  },
  suggName: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
    maxWidth: width - 130,
  },
  suggTypeBadge: {
    backgroundColor: COLORS.cyan,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  suggTypeText: {
    color: '#000',
    fontSize: 9,
    fontWeight: '800',
  },

  // Ticker
  ticker: {
    backgroundColor: '#111',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#222',
    paddingVertical: 8,
    overflow: 'hidden',
  },
  tickerText: {
    color: COLORS.cyan,
    fontWeight: '700',
    fontSize: 13,
    whiteSpace: 'nowrap',
  },

  // Buttons
  btnGroup: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  navBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 11,
    borderRadius: 40,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  navBtnText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  btnTelegram: {
    borderColor: 'rgba(0,255,180,0.4)',
  },
  btnRequest: {
    borderColor: 'rgba(99,102,241,0.4)',
  },
  btn18: {
    borderColor: 'rgba(255,0,89,0.4)',
  },
  btn18Active: {
    backgroundColor: 'rgba(0,255,150,0.15)',
    borderColor: COLORS.green,
  },

  // Categories
  catScroll: {
    maxHeight: 48,
  },
  catContent: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    gap: 8,
    alignItems: 'center',
  },
  chip: {
    paddingHorizontal: 18,
    paddingVertical: 6,
    backgroundColor: '#111',
    borderWidth: 1,
    borderColor: '#222',
    borderRadius: 50,
  },
  chipActive: {
    backgroundColor: COLORS.cyan,
    borderColor: COLORS.cyan,
  },
  chipText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  chipTextActive: {
    color: '#000',
  },

  // Grid
  sectionTitle: {
    color: COLORS.cyan,
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
    marginTop: 8,
  },
  gridContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  row: {
    justifyContent: 'space-between',
  },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 50,
    gap: 12,
  },
  emptyText: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 16,
    fontWeight: '600',
  },
  moreBtn: {
    backgroundColor: '#111',
    borderWidth: 1,
    borderColor: '#222',
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 50,
    alignSelf: 'center',
    marginVertical: 20,
  },
  moreBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
});
