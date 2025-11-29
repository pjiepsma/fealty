import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';

const LANGUAGES = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'nl', label: 'Nederlands', flag: '🇳🇱' },
];

export function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const currentLanguage = i18n.language;

  const changeLanguage = (languageCode: string) => {
    i18n.changeLanguage(languageCode);
  };

  return (
    <View style={styles.container}>
      {LANGUAGES.map((lang) => (
        <TouchableOpacity
          key={lang.code}
          style={[
            styles.languageButton,
            currentLanguage === lang.code && styles.activeLanguage,
          ]}
          onPress={() => changeLanguage(lang.code)}
        >
          <Text style={styles.flag}>{lang.flag}</Text>
          <Text
            style={[
              styles.languageText,
              currentLanguage === lang.code && styles.activeLanguageText,
            ]}
          >
            {lang.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 12,
    marginVertical: 16,
  },
  languageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#2a2a2a',
    gap: 8,
  },
  activeLanguage: {
    backgroundColor: '#4CAF50',
  },
  flag: {
    fontSize: 20,
  },
  languageText: {
    color: '#999',
    fontSize: 14,
    fontWeight: '500',
  },
  activeLanguageText: {
    color: '#fff',
  },
});

