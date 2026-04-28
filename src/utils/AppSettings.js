/**
 * AppSettings.js  [CLEAN v2]
 *
 * ✅ Settings poll 3 সেকেন্ড — admin change দ্রুত apply হবে
 * ✅ content_api_url settings থেকে — admin panel থেকে change করা যাবে
 * ✅ content_domain settings থেকে
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  APPS_SCRIPT_URL, API_URL, DOMAIN,
  DEFAULT_TELEGRAM_URL, DEFAULT_REQUEST_URL, DEFAULT_AD_GATEWAY,
  DEFAULT_MOVIES_PER_PAGE, DEFAULT_TICKER_TEXT, APP_VERSION,
} from './constants';

function versionLessThan(a, b) {
  const pa = String(a).split('.').map(Number);
  const pb = String(b).split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    const na = pa[i] || 0, nb = pb[i] || 0;
    if (na < nb) return true;
    if (na > nb) return false;
  }
  return false;
}

async function gasText(url) {
  const res  = await fetch(url);
  let   text = (await res.text()).trim();
  const m = text.match(/^[\w$]+\(([\s\S]*)\)\s*;?\s*$/);
  if (m) text = m[1];
  return JSON.parse(text);
}

const defaultSettings = {
  contentApiUrl:      API_URL,
  contentDomain:      DOMAIN,
  tickerText:         DEFAULT_TICKER_TEXT,
  telegramUrl:        DEFAULT_TELEGRAM_URL,
  requestUrl:         DEFAULT_REQUEST_URL,
  adGateway:          DEFAULT_AD_GATEWAY,
  moviesPerPage:      DEFAULT_MOVIES_PER_PAGE,
  splashDuration:     2000,
  maintenanceMode:    false,
  maintenanceMessage: '🔧 আমরা কিছু কাজ করছি, একটু পরে আসুন।',
  bannerEnabled:      false,
  bannerTitle:        '',
  bannerMessage:      '',
  forceUpdateEnabled: false,
  latestVersion:      APP_VERSION,
  apkDownloadUrl:     '',
  updateChangelog:    '',
};

const AppSettingsContext = createContext({
  settings: defaultSettings,
  loading:  true,
  error:    null,
  reload:   () => {},
});

export function AppSettingsProvider({ children }) {
  const [settings, setSettings] = useState(defaultSettings);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);

  const load = async () => {
    try {
      setError(null);
      const data = await gasText(`${APPS_SCRIPT_URL}?action=getSettings`);
      if (data?.status === 'ok' && data.settings) {
        const s = data.settings;
        setSettings({
          contentApiUrl:      s.content_api_url    || API_URL,
          contentDomain:      s.content_domain     || DOMAIN,
          tickerText:         s.ticker_text          || DEFAULT_TICKER_TEXT,
          telegramUrl:        s.telegram_url         || DEFAULT_TELEGRAM_URL,
          requestUrl:         s.request_url          || DEFAULT_REQUEST_URL,
          adGateway:          s.ad_url               || DEFAULT_AD_GATEWAY,
          moviesPerPage:      parseInt(s.movies_per_page) || DEFAULT_MOVIES_PER_PAGE,
          splashDuration:     parseInt(s.splash_duration) || 2000,
          maintenanceMode:    s.maintenance_mode     === 'true',
          maintenanceMessage: s.maintenance_message  || defaultSettings.maintenanceMessage,
          bannerEnabled:      s.banner_enabled       === 'true',
          bannerTitle:        s.banner_title         || '',
          bannerMessage:      s.banner_message       || '',
          forceUpdateEnabled: s.force_update_enabled === 'true',
          latestVersion:      s.latest_version       || APP_VERSION,
          apkDownloadUrl:     s.apk_download_url     || '',
          updateChangelog:    s.update_changelog     || '',
        });
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // ✅ প্রতি ৩ সেকেন্ডে reload
    const iv = setInterval(load, 3000);
    return () => clearInterval(iv);
  }, []);

  return (
    <AppSettingsContext.Provider value={{ settings, loading, error, reload: load }}>
      {children}
    </AppSettingsContext.Provider>
  );
}

export function useAppSettings() {
  return useContext(AppSettingsContext);
}

export function needsForceUpdate(settings) {
  return (
    settings.forceUpdateEnabled &&
    versionLessThan(APP_VERSION, settings.latestVersion)
  );
}
