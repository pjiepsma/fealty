import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

interface RuleSection {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  content: string;
  expanded: boolean;
}

export default function RulesScreen() {
  const { t } = useTranslation();
  
  const [sections, setSections] = useState<RuleSection[]>([
    {
      id: '1',
      icon: 'game-controller',
      title: t('rules.sections.howToPlay.title'),
      content: t('rules.sections.howToPlay.content'),
      expanded: true,
    },
    {
      id: '2',
      icon: 'time',
      title: t('rules.sections.captureMode.title'),
      content: t('rules.sections.captureMode.content'),
      expanded: false,
    },
    {
      id: '3',
      icon: 'trophy',
      title: t('rules.sections.rewards.title'),
      content: t('rules.sections.rewards.content'),
      expanded: false,
    },
    {
      id: '4',
      icon: 'shield',
      title: t('rules.sections.kingStatus.title'),
      content: t('rules.sections.kingStatus.content'),
      expanded: false,
    },
    {
      id: '5',
      icon: 'location',
      title: t('rules.sections.pois.title'),
      content: t('rules.sections.pois.content'),
      expanded: false,
    },
    {
      id: '6',
      icon: 'people',
      title: t('rules.sections.community.title'),
      content: t('rules.sections.community.content'),
      expanded: false,
    },
  ]);

  const toggleSection = (id: string) => {
    setSections(prev =>
      prev.map(section =>
        section.id === id
          ? { ...section, expanded: !section.expanded }
          : section
      )
    );
  };

  const renderSection = (section: RuleSection) => (
    <TouchableOpacity
      key={section.id}
      style={styles.section}
      onPress={() => toggleSection(section.id)}
      activeOpacity={0.7}
    >
      <View style={styles.sectionHeader}>
        <View style={styles.sectionIcon}>
          <Ionicons name={section.icon} size={24} color="#4CAF50" />
        </View>
        <Text style={styles.sectionTitle}>{section.title}</Text>
        <Ionicons
          name={section.expanded ? 'chevron-up' : 'chevron-down'}
          size={24}
          color="#999"
        />
      </View>
      
      {section.expanded && (
        <View style={styles.sectionContent}>
          <Text style={styles.sectionText}>{section.content}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Hero Section */}
        <View style={styles.hero}>
          <View style={styles.heroIcon}>
            <Ionicons name="book" size={48} color="#4CAF50" />
          </View>
          <Text style={styles.heroTitle}>{t('rules.title')}</Text>
          <Text style={styles.heroSubtitle}>{t('rules.subtitle')}</Text>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Ionicons name="time" size={24} color="#4CAF50" />
            <Text style={styles.statValue}>10s</Text>
            <Text style={styles.statLabel}>{t('rules.quickStats.entryTime')}</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="hourglass" size={24} color="#2196F3" />
            <Text style={styles.statValue}>60s</Text>
            <Text style={styles.statLabel}>{t('rules.quickStats.maxCapture')}</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="gift" size={24} color="#FFD700" />
            <Text style={styles.statValue}>+10s</Text>
            <Text style={styles.statLabel}>{t('rules.quickStats.bonus')}</Text>
          </View>
        </View>

        {/* Rules Sections */}
        <View style={styles.content}>
          {sections.map(renderSection)}
        </View>

        {/* Tips Section */}
        <View style={styles.tipsSection}>
          <Text style={styles.tipsTitle}>{t('rules.tips.title')}</Text>
          <View style={styles.tipCard}>
            <Ionicons name="bulb" size={20} color="#FFD700" />
            <Text style={styles.tipText}>{t('rules.tips.tip1')}</Text>
          </View>
          <View style={styles.tipCard}>
            <Ionicons name="bulb" size={20} color="#FFD700" />
            <Text style={styles.tipText}>{t('rules.tips.tip2')}</Text>
          </View>
          <View style={styles.tipCard}>
            <Ionicons name="bulb" size={20} color="#FFD700" />
            <Text style={styles.tipText}>{t('rules.tips.tip3')}</Text>
          </View>
        </View>

        {/* Support Section */}
        <View style={styles.supportSection}>
          <Text style={styles.supportTitle}>{t('rules.support.title')}</Text>
          <Text style={styles.supportText}>{t('rules.support.description')}</Text>
          <TouchableOpacity style={styles.supportButton}>
            <Ionicons name="mail" size={20} color="#fff" />
            <Text style={styles.supportButtonText}>{t('rules.support.contact')}</Text>
          </TouchableOpacity>
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
  hero: {
    alignItems: 'center',
    padding: 32,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  heroIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#2a2a2a',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
    textAlign: 'center',
  },
  content: {
    padding: 20,
  },
  section: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  sectionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  sectionTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  sectionContent: {
    padding: 16,
    paddingTop: 0,
  },
  sectionText: {
    fontSize: 14,
    color: '#ccc',
    lineHeight: 22,
  },
  tipsSection: {
    padding: 20,
    paddingTop: 0,
  },
  tipsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  tipCard: {
    flexDirection: 'row',
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    gap: 12,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: '#ccc',
    lineHeight: 20,
  },
  supportSection: {
    padding: 20,
    paddingTop: 0,
    marginBottom: 40,
  },
  supportTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  supportText: {
    fontSize: 14,
    color: '#999',
    marginBottom: 16,
    lineHeight: 20,
  },
  supportButton: {
    flexDirection: 'row',
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  supportButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});

