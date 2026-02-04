// i18n Configuration - HAYQ Project

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { translations } from './translations';

const savedLanguage = typeof window !== 'undefined' 
  ? localStorage.getItem('hayq-language') || 'en'
  : 'en';

i18n
  .use(initReactI18next)
  .init({
    resources: translations,
    lng: savedLanguage,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;

export function changeLanguage(lang: 'en' | 'hy' | 'ru') {
  i18n.changeLanguage(lang);
  if (typeof window !== 'undefined') {
    localStorage.setItem('hayq-language', lang);
  }
}

export function getCurrentLanguage(): 'en' | 'hy' | 'ru' {
  return (i18n.language as 'en' | 'hy' | 'ru') || 'en';
}
