import { API_URL, DOMAIN } from './constants';

export async function fetchMovies() {
  try {
    const res = await fetch(`${API_URL}?action=getMovieData&domain=${DOMAIN}`);
    const data = await res.json();
    return data;
  } catch (e) {
    throw new Error('Failed to fetch movies: ' + e.message);
  }
}

export async function fetchMovieDetails(movieId) {
  try {
    const res = await fetch(`${API_URL}?action=getMovieDetails&id=${movieId}&domain=${DOMAIN}`);
    const data = await res.json();
    return data;
  } catch (e) {
    throw new Error('Failed to fetch movie details: ' + e.message);
  }
}
