import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './en.json';
import zhHant from './zh-Hant.json';

export const LANGS = ['en', 'zh-Hant'] as const;
export type Lang = (typeof LANGS)[number];

/** 把 i18n 語言碼映射到 metrics 用的 'en' | 'zh'。 */
export function toMetricsLang(lang: string): 'en' | 'zh' {
  return lang.startsWith('zh') ? 'zh' : 'en';
}

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    'zh-Hant': { translation: zhHant },
  },
  lng: 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

export default i18n;
