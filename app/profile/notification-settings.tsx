import React, { useState } from 'react';
import { View, Text, StyleSheet, Switch, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

export default function NotificationSettingsScreen() {
  const { t } = useTranslation();
  
  // Notification settings state
  const [settings, setSettings] = useState({
    poiNearby: true,
    captureComplete: true,
    kingStatusChanged: true,
    newChallenge: false,
    friendActivity: true,
    leaderboardUpdate: false,
    dailyReminder: true,
    weeklyReport: true,
  });

  const toggleSetting = (key: keyof typeof settings) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const saveSettings = () => {
    // TODO: Save to backend
    Alert.alert(
      t('common.success'),
      t('profile.settings.notifications.saved')
    );
    router.back();
  };

  const SettingItem = ({ 
    title, 
    description, 
    value, 
    onToggle,
    icon 
  }: { 
    title: string; 
    description: string; 
    value: boolean; 
    onToggle: () => void;
    icon: keyof typeof Ionicons.glyphMap;
  }) => (
    <View style={styles.settingItem}>
      <View style={styles.settingIcon}>
        <Ionicons name={icon} size={24} color="#4CAF50" />
      </View>
      <View style={styles.settingContent}>
        <Text style={styles.settingTitle}>{title}</Text>
        <Text style={styles.settingDescription}>{description}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: '#3a3a3a', true: '#4CAF50' }}
        thumbColor={value ? '#fff' : '#f4f3f4'}
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          {/* Game Notifications */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('profile.settings.notifications.sections.game')}</Text>
            
            <SettingItem
              icon="location"
              title={t('profile.settings.notifications.poiNearby.title')}
              description={t('profile.settings.notifications.poiNearby.description')}
              value={settings.poiNearby}
              onToggle={() => toggleSetting('poiNearby')}
            />
            
            <SettingItem
              icon="checkmark-circle"
              title={t('profile.settings.notifications.captureComplete.title')}
              description={t('profile.settings.notifications.captureComplete.description')}
              value={settings.captureComplete}
              onToggle={() => toggleSetting('captureComplete')}
            />
            
            <SettingItem
              icon="trophy"
              title={t('profile.settings.notifications.kingStatus.title')}
              description={t('profile.settings.notifications.kingStatus.description')}
              value={settings.kingStatusChanged}
              onToggle={() => toggleSetting('kingStatusChanged')}
            />
          </View>

          {/* Social Notifications */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('profile.settings.notifications.sections.social')}</Text>
            
            <SettingItem
              icon="flash"
              title={t('profile.settings.notifications.newChallenge.title')}
              description={t('profile.settings.notifications.newChallenge.description')}
              value={settings.newChallenge}
              onToggle={() => toggleSetting('newChallenge')}
            />
            
            <SettingItem
              icon="people"
              title={t('profile.settings.notifications.friendActivity.title')}
              description={t('profile.settings.notifications.friendActivity.description')}
              value={settings.friendActivity}
              onToggle={() => toggleSetting('friendActivity')}
            />
            
            <SettingItem
              icon="podium"
              title={t('profile.settings.notifications.leaderboard.title')}
              description={t('profile.settings.notifications.leaderboard.description')}
              value={settings.leaderboardUpdate}
              onToggle={() => toggleSetting('leaderboardUpdate')}
            />
          </View>

          {/* Reminders */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('profile.settings.notifications.sections.reminders')}</Text>
            
            <SettingItem
              icon="time"
              title={t('profile.settings.notifications.dailyReminder.title')}
              description={t('profile.settings.notifications.dailyReminder.description')}
              value={settings.dailyReminder}
              onToggle={() => toggleSetting('dailyReminder')}
            />
            
            <SettingItem
              icon="stats-chart"
              title={t('profile.settings.notifications.weeklyReport.title')}
              description={t('profile.settings.notifications.weeklyReport.description')}
              value={settings.weeklyReport}
              onToggle={() => toggleSetting('weeklyReport')}
            />
          </View>
        </View>
      </ScrollView>

      {/* Save Button */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.saveButton} onPress={saveSettings}>
          <Text style={styles.saveButtonText}>{t('common.save')}</Text>
        </TouchableOpacity>
      </View>
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
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 13,
    color: '#999',
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#2a2a2a',
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

