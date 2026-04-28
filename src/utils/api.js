/**
 * api.js  [CLEAN v2]
 *
 * ✅ fetchMovies() এখন dynamic URL নেয় — settings থেকে content_api_url
 * Admin panel থেকে URL change করলে তৎক্ষণাৎ apply হবে
 */

import { API_URL, DOMAIN } from './constants';

async function gasText(url) {
  const res  = await fetch(url);
  let   text = (await res.text()).trim();
  const m = text.match(/^[\w$]+\(([\s\S]*)\)\s*;?\s*$/);
  if (m) text = m[1];
  return JSON.parse(text);
}

// ✅ url ও domain এখন parameter — AppSettings থেকে pass করা হবে
// fallback হিসেবে constants এর default URL কাজ করবে
export async function fetchMovies(apiUrl = API_URL, domain = DOMAIN) {
  const data = await gasText(`${apiUrl}?action=getMovieData&domain=${domain}`);
  return data;
}

export function normalizeMovie(m) {
  return {
    ...m,
    id:         m.id || (m.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    categories: Array.isArray(m.categories) ? m.categories : [],
    watchUrl:   m.watchUrl || m.download || '',
  };
}
