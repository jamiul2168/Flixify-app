import { API_URL, DOMAIN } from './constants';

export async function fetchMovies() {
  const res  = await fetch(`${API_URL}?action=getMovieData&domain=${DOMAIN}`);
  const data = await res.json();
  return data;
}

// Movie object normalize — sheet-এর fields সঠিকভাবে map করে
export function normalizeMovie(m) {
  return {
    ...m,
    id:         m.id || (m.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    categories: Array.isArray(m.categories) ? m.categories : [],
    watchUrl:   m.watchUrl || m.download || '',
  };
}
