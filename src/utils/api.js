import { API_URL, DOMAIN } from './constants';

export async function fetchMovies() {
  const res  = await fetch(`${API_URL}?action=getMovieData&domain=${DOMAIN}`);
  const data = await res.json();
  return data;
}

// Movie object normalize — GAS sheet-এর সব field map করে
export function normalizeMovie(m) {
  return {
    ...m,
    id:          m.id || (m.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    categories:  Array.isArray(m.categories) ? m.categories : [],
    // watchUrl ও download দুটোই support করে
    watchUrl:    m.watchUrl    || m.download || '',
    download:    m.download    || m.watchUrl || '',
    // optional rich fields
    trailer:     m.trailer     || '',
    screenshot:  m.screenshot  || '',
    language:    m.language    || '',
    quality:     m.quality     || '',
    description: m.description || '',
    episodes:    Array.isArray(m.episodes) ? m.episodes : [],
  };
}
