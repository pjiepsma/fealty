import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/hooks/useAuth';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { Ionicons } from '@expo/vector-icons';

export default function ProfileScreen() {
  const { t } = useTranslation();
  const { user, signOut, loading } = useAuth();

  const handleSignOut = async () => {
    Alert.alert(
      t('profile.confirmSignOut.title'),
      t('profile.confirmSignOut.message'),
      [
        { text: t('profile.confirmSignOut.cancel'), style: 'cancel' },
        {
          text: t('profile.confirmSignOut.confirm'),
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
              router.replace('/auth/login');
            } catch (error: any) {
              Alert.alert(t('profile.errors.signOutFailed'), error.message);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.subtitle}>{t('common.loading')}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <Text style={styles.title}>{t('profile.title')}</Text>
          
          {user && (
            <>
              {/* User Info Card */}
              <TouchableOpacity 
                style={styles.userCard}
                onPress={() => router.push('/profile/edit-profile')}
                activeOpacity={0.7}
              >
                <View style={styles.avatar}>
                  <Ionicons name="person" size={32} color="#4CAF50" />
                </View>
                <View style={styles.userDetails}>
                  <Text style={styles.username}>{user.username}</Text>
                  <Text style={styles.email}>{user.email}</Text>
                </View>
                <Ionicons name="chevron-forward" size={24} color="#999" />
              </TouchableOpacity>

              {/* Stats Container */}
              <View style={styles.statsContainer}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>
                    {Math.floor((user.totalSeconds || 0) / 60)}m
                  </Text>
                  <Text style={styles.statLabel}>{t('profile.stats.minutesCaptured')}</Text>
                </View>
                
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{user.totalPOIsClaimed || 0}</Text>
                  <Text style={styles.statLabel}>{t('profile.stats.poisClaimed')}</Text>
                </View>
                
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{user.currentKingOf || 0}</Text>
                  <Text style={styles.statLabel}>{t('profile.stats.currentlyKingOf')}</Text>
                </View>
              </View>

              {/* Menu Sections */}
              <View style={styles.menuSection}>
                <Text style={styles.sectionTitle}>{t('profile.menu.account')}</Text>
                
                <TouchableOpacity 
                  style={styles.menuItem}
                  onPress={() => router.push('/profile/edit-profile')}
                >
                  <View style={styles.menuIcon}>
                    <Ionicons name="person-outline" size={22} color="#4CAF50" />
                  </View>
                  <Text style={styles.menuText}>{t('profile.menu.editProfile')}</Text>
                  <Ionicons name="chevron-forward" size={20} color="#999" />
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.menuItem}
                  onPress={() => router.push('/profile/notifications')}
                >
                  <View style={styles.menuIcon}>
                    <Ionicons name="notifications-outline" size={22} color="#2196F3" />
                  </View>
                  <View style={styles.menuTextContainer}>
                    <Text style={styles.menuText}>{t('profile.menu.notifications')}</Text>
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>3</Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#999" />
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.menuItem}
                  onPress={() => router.push('/profile/notification-settings')}
                >
                  <View style={styles.menuIcon}>
                    <Ionicons name="settings-outline" size={22} color="#9C27B0" />
                  </View>
                  <Text style={styles.menuText}>{t('profile.menu.notificationSettings')}</Text>
                  <Ionicons name="chevron-forward" size={20} color="#999" />
                </TouchableOpacity>
              </View>

              {/* Language Section */}
              <View style={styles.menuSection}>
                <Text style={styles.sectionTitle}>{t('profile.menu.preferences')}</Text>
                <View style={styles.languageContainer}>
                  <LanguageSwitcher />
                </View>
              </View>

              {/* Support Section */}
              <View style={styles.menuSection}>
                <Text style={styles.sectionTitle}>{t('profile.menu.support')}</Text>
                
                <TouchableOpacity 
                  style={styles.menuItem}
                  onPress={() => router.push('/profile/rules')}
                >
                  <View style={styles.menuIcon}>
                    <Ionicons name="book-outline" size={22} color="#FF9800" />
                  </View>
                  <Text style={styles.menuText}>{t('profile.menu.rulesHelp')}</Text>
                  <Ionicons name="chevron-forward" size={20} color="#999" />
                </TouchableOpacity>

                <TouchableOpacity style={styles.menuItem}>
                  <View style={styles.menuIcon}>
                    <Ionicons name="mail-outline" size={22} color="#F44336" />
                  </View>
                  <Text style={styles.menuText}>{t('profile.menu.contact')}</Text>
                  <Ionicons name="chevron-forward" size={20} color="#999" />
                </TouchableOpacity>
              </View>
            </>
          )}

          {/* Sign Out Button */}
          <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
            <Ionicons name="log-out-outline" size={20} color="#fff" />
            <Text style={styles.signOutText}>{t('profile.signOut')}</Text>
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
  content: {
    flex: 1,
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 24,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#4CAF50',
    marginRight: 16,
  },
  userDetails: {
    flex: 1,
  },
  username: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: '#999',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#2a2a2a',
    borderRadius: 16,
    padding: 20,
    marginBottom: 32,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: '#999',
    textAlign: 'center',
  },
  menuSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#999',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
  },
  menuTextContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  badge: {
    backgroundColor: '#F44336',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 8,
  },
  badgeText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: 'bold',
  },
  languageContainer: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  signOutButton: {
    flexDirection: 'row',
    backgroundColor: '#ff4444',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    gap: 8,
  },
  signOutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginTop: 20,
  },
});
