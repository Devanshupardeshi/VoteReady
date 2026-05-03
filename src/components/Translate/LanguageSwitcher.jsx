/**
 * LanguageSwitcher — Google Translate API v2 integration
 *
 * Languages: English, Hindi, Marathi, Tamil, Telugu, Bengali,
 *            Kannada, Gujarati, Punjabi, Malayalam
 * Caches translated strings in sessionStorage per language
 * 300ms debounce on rapid switching
 */
import { useCallback, useRef } from 'react';
import { useVoterProfile } from '../../context/VoterProfileContext.jsx';

const LANGUAGE_CODES = {
  English: 'en',
  Hindi: 'hi',
  Marathi: 'mr',
  Tamil: 'ta',
  Telugu: 'te',
  Bengali: 'bn',
  Kannada: 'kn',
  Gujarati: 'gu',
  Punjabi: 'pa',
  Malayalam: 'ml',
};

/** Translate text using Google Translate API v2 */
export async function translateText(text, targetLang) {
  if (!text || targetLang === 'English') return text;

  const langCode = LANGUAGE_CODES[targetLang] || 'en';

  // Check cache
  const cacheKey = `translate_${langCode}_${text.substring(0, 50)}`;
  try {
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) return cached;
  } catch { /* sessionStorage unavailable */ }

  try {
    const response = await fetch(
      `/api/translate`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          q: text,
          target: langCode,
          source: 'en',
          format: 'text',
        }),
      }
    );

    if (!response.ok) return text;

    const data = await response.json();
    const translated = data.data?.translations?.[0]?.translatedText || text;

    // Cache result
    try {
      sessionStorage.setItem(cacheKey, translated);
    } catch { /* sessionStorage full */ }

    return translated;
  } catch {
    return text;
  }
}

/** Batch translate multiple strings */
export async function translateBatch(texts, targetLang) {
  if (targetLang === 'English') return texts;

  const langCode = LANGUAGE_CODES[targetLang] || 'en';

  // Check cache for each
  const results = new Array(texts.length);
  const uncached = [];
  const uncachedIndices = [];

  texts.forEach((text, i) => {
    const cacheKey = `translate_${langCode}_${text.substring(0, 50)}`;
    try {
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        results[i] = cached;
        return;
      }
    } catch { /* ignore */ }
    uncached.push(text);
    uncachedIndices.push(i);
  });

  if (uncached.length === 0) return results;

  try {
    const response = await fetch(
      `/api/translate`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          q: uncached,
          target: langCode,
          source: 'en',
          format: 'text',
        }),
      }
    );

    if (!response.ok) {
      uncachedIndices.forEach((idx, j) => { results[idx] = uncached[j]; });
      return results;
    }

    const data = await response.json();
    const translations = data.data?.translations || [];

    translations.forEach((t, j) => {
      const translated = t.translatedText || uncached[j];
      results[uncachedIndices[j]] = translated;
      // Cache
      const cacheKey = `translate_${langCode}_${uncached[j].substring(0, 50)}`;
      try { sessionStorage.setItem(cacheKey, translated); } catch { /* ignore */ }
    });

    return results;
  } catch {
    uncachedIndices.forEach((idx, j) => { results[idx] = uncached[j]; });
    return results;
  }
}

/**
 * useTranslation — hook with debounced language switching
 */
export function useTranslation() {
  const { profile } = useVoterProfile();
  const debounceRef = useRef(null);

  const translate = useCallback((text) => {
    return new Promise((resolve) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(async () => {
        const result = await translateText(text, profile.language);
        resolve(result);
      }, 300);
    });
  }, [profile.language]);

  return { translate, translateText, translateBatch, language: profile.language };
}

export { LANGUAGE_CODES };
