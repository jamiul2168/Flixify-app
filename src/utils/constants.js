export const COLORS = {
  bg: '#050508',
  bgCard: '#0e0e14',
  bgModal: '#12121a',
  border: 'rgba(255,255,255,0.07)',
  cyan: '#00e5ff',
  pink: '#eb0050',
  blue: '#1a6eff',
  cyanDim: 'rgba(0,229,255,0.12)',
  red: '#ff2d55',
  purple: '#7c3aed',
  gold: '#f59e0b',
  green: '#10b981',
  white: '#ffffff',
  gray: 'rgba(255,255,255,0.45)',
  grayDim: 'rgba(255,255,255,0.06)',
};

// ── GAS Endpoints ──────────────────────────────────────────────────────────────
// Movie data API (getMovieData) — admin panel থেকে content_api_url দিয়ে override হবে
export const API_URL =
  'https://script.google.com/macros/s/AKfycbx-rB3PNtoZVc6pm3GXq4kAeQkzvOTDkhJkL-XIQSIauG02Pp8gVMTA73bwb4MGvuMytg/exec';

// App settings + users API — এটা তোমার নতুন code.gs deploy URL দাও
export const APPS_SCRIPT_URL =
  'https://script.google.com/macros/s/AKfycbwtS79w-8doHBbTv48j2eINoew1mlaofDVX2IIhDYfAQG6MXkkn6pgyaU6r24Ss8gPlFQ/exec';

export const DOMAIN = 'movieden.app';

// ── Default values (GAS Settings দিয়ে override হবে) ──────────────────────────
export const DEFAULT_TELEGRAM_URL    = 'https://t.me/movieden';
export const DEFAULT_REQUEST_URL     = 'https://request.movieden.app/';
export const DEFAULT_AD_GATEWAY      = '';
export const DEFAULT_MOVIES_PER_PAGE = 18;
export const DEFAULT_TICKER_TEXT     = '🎬 Welcome to MovieDen!   •   নতুন মুভি প্রতিদিন আসছে   •   Request করুন আপনার পছন্দের মুভি 🔥';

// App version — force update check-এ ব্যবহার হবে
// নতুন version release এর সময় এটা বাড়াও এবং app.json এও বাড়াও
export const APP_VERSION = '1.0.0';
