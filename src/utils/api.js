import { API_URL, DOMAIN } from './constants';

// ✅ FIX — MovieDB GAS ও JSONP দেয়, res.json() কাজ করত না
async function gasText(url) {
  const res  = await fetch(url);
  let   text = (await res.text()).trim();
  const m = text.match(/^[\w$]+\(([\s\S]*)\)\s*;?\s*$/);
  if (m) text = m[1];
  return JSON.parse(text);
}

export async function fetchMovies() {
  const data = await gasText(`${API_URL}?action=getMovieData&domain=${DOMAIN}`);
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
