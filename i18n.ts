import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';

// Import translations
import en from './locales/en.json';
import nl from './locales/nl.json';

// Get device language
const deviceLanguage = Localization.getLocales()[0]?.languageCode || 'en';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      nl: { translation: nl },
    },
    lng: deviceLanguage, // Use device language
    fallbackLng: 'en', // Fallback to English
    interpolation: {
      escapeValue: false, // React already escapes
    },
    compatibilityJSON: 'v3', // Use v3 format
  });

export default i18n;

