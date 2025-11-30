import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

const LANGUAGES = [
  { code: 'en', label: 'English', icon: 'language' as keyof typeof Ionicons.glyphMap },
  { code: 'nl', label: 'Nederlands', icon: 'language' as keyof typeof Ionicons.glyphMap },
];

export default function GeneralSettingsScreen() {
  const { i18n, t } = useTranslation();
  const currentLanguage = i18n.language;

  const changeLanguage = (languageCode: string) => {
    i18n.changeLanguage(languageCode);
  };

  const LanguageItem = ({ 
    code,
    label, 
    icon 
  }: { 
    code: string;
    label: string; 
    icon: keyof typeof Ionicons.glyphMap;
  }) => {
    const isActive = currentLanguage === code;
    
    return (
      <TouchableOpacity
        onPress={() => changeLanguage(code)}
        activeOpacity={0.7}
      >
        <View style={styles.settingItem}>
          <View style={styles.settingIcon}>
            <Ionicons name={icon} size={24} color="#8B6914" />
          </View>
          <View style={styles.settingContent}>
            <Text style={styles.settingTitle}>{label}</Text>
          </View>
          {isActive && (
            <Ionicons name="checkmark" size={24} color="#8B6914" />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          {/* Language Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('profile.settings.general.language')}</Text>
            
            {LANGUAGES.map((lang) => (
              <LanguageItem
                key={lang.code}
                code={lang.code}
                label={lang.label}
                icon={lang.icon}
              />
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});

