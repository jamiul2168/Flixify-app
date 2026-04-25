import { API_URL, DOMAIN } from './constants';

export async function fetchMovies() {
  const res  = await fetch(`${API_URL}?action=getMovieData&domain=${DOMAIN}`);
  const data = await res.json();
  return data;
}
