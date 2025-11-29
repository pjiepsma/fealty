import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { Ionicons } from '@expo/vector-icons';

export default function EditProfileScreen() {
  const { t } = useTranslation();
  const { user } = useAuth();
  
  const [username, setUsername] = useState(user?.username || '');
  const [email, setEmail] = useState(user?.email || '');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!username.trim()) {
      Alert.alert(t('common.error'), t('profile.edit.errors.usernameRequired'));
      return;
    }

    setLoading(true);
    try {
      // TODO: Update user profile in Supabase
      Alert.alert(
        t('common.success'),
        t('profile.edit.success'),
        [{ text: t('common.confirm'), onPress: () => router.back() }]
      );
    } catch (error: any) {
      Alert.alert(t('common.error'), error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = () => {
    Alert.alert(
      t('profile.edit.changePassword.title'),
      t('profile.edit.changePassword.description'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { 
          text: t('profile.edit.changePassword.send'),
          onPress: () => {
            // TODO: Send password reset email
            Alert.alert(t('common.success'), t('profile.edit.changePassword.emailSent'));
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          {/* Avatar Section */}
          <View style={styles.avatarSection}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatar}>
                <Ionicons name="person" size={48} color="#4CAF50" />
              </View>
              <TouchableOpacity style={styles.avatarButton}>
                <Ionicons name="camera" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
            <Text style={styles.avatarHint}>{t('profile.edit.changeAvatar')}</Text>
          </View>

          {/* Form Fields */}
          <View style={styles.form}>
            <View style={styles.field}>
              <Text style={styles.label}>{t('profile.edit.username')}</Text>
              <TextInput
                style={styles.input}
                value={username}
                onChangeText={setUsername}
                placeholder={t('profile.edit.usernamePlaceholder')}
                placeholderTextColor="#666"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>{t('profile.edit.email')}</Text>
              <TextInput
                style={[styles.input, styles.inputDisabled]}
                value={email}
                editable={false}
                placeholderTextColor="#666"
              />
              <Text style={styles.fieldHint}>{t('profile.edit.emailHint')}</Text>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>{t('profile.edit.password')}</Text>
              <TouchableOpacity style={styles.passwordButton} onPress={handleChangePassword}>
                <Text style={styles.passwordButtonText}>{t('profile.edit.changePassword.button')}</Text>
                <Ionicons name="chevron-forward" size={20} color="#4CAF50" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Location Settings Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('profile.edit.location.title')}</Text>
            
            {/* Country Selector */}
            <View style={styles.field}>
              <Text style={styles.label}>{t('profile.edit.location.country')}</Text>
              <TouchableOpacity 
                style={styles.selectButton}
                onPress={() => router.push('/profile/select-country')}
              >
                <View style={styles.selectButtonContent}>
                  <Text style={styles.selectButtonIcon}>
                    {user?.home_country === 'Netherlands' ? '🇳🇱' : '🌍'}
                  </Text>
                  <Text style={styles.selectButtonText}>
                    {user?.home_country || t('profile.edit.location.selectCountry')}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#999" />
              </TouchableOpacity>
              <Text style={styles.fieldHint}>{t('profile.edit.location.countryHint')}</Text>
            </View>

            {/* City Selector */}
            <View style={styles.field}>
              <Text style={styles.label}>{t('profile.edit.location.city')}</Text>
              <TouchableOpacity 
                style={styles.selectButton}
                onPress={() => router.push('/profile/select-city')}
              >
                <View style={styles.selectButtonContent}>
                  <Ionicons name="location" size={20} color="#4CAF50" />
                  <Text style={styles.selectButtonText}>
                    {user?.home_city || t('profile.edit.location.selectCity')}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#999" />
              </TouchableOpacity>
              <Text style={styles.fieldHint}>{t('profile.edit.location.cityHint')}</Text>
            </View>
          </View>

          {/* Account Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('profile.edit.account.title')}</Text>
            
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>{t('profile.edit.account.memberSince')}</Text>
                <Text style={styles.infoValue}>
                  {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : '-'}
                </Text>
              </View>
              
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>{t('profile.edit.account.accountType')}</Text>
                <Text style={[styles.infoValue, user?.isPremium && styles.premiumText]}>
                  {user?.isPremium ? t('profile.edit.account.premium') : t('profile.edit.account.free')}
                </Text>
              </View>
            </View>
          </View>

          {/* Danger Zone */}
          <View style={styles.dangerSection}>
            <Text style={styles.dangerTitle}>{t('profile.edit.dangerZone.title')}</Text>
            <TouchableOpacity 
              style={styles.dangerButton}
              onPress={() => {
                Alert.alert(
                  t('profile.edit.dangerZone.deleteAccount.title'),
                  t('profile.edit.dangerZone.deleteAccount.description'),
                  [
                    { text: t('common.cancel'), style: 'cancel' },
                    { 
                      text: t('profile.edit.dangerZone.deleteAccount.confirm'),
                      style: 'destructive',
                      onPress: () => {
                        // TODO: Delete account
                      }
                    }
                  ]
                );
              }}
            >
              <Ionicons name="trash" size={20} color="#ff4444" />
              <Text style={styles.dangerButtonText}>{t('profile.edit.dangerZone.deleteAccount.button')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Save Button */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.saveButton, loading && styles.saveButtonDisabled]} 
          onPress={handleSave}
          disabled={loading}
        >
          <Text style={styles.saveButtonText}>
            {loading ? t('common.loading') : t('common.save')}
          </Text>
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
  avatarSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#2a2a2a',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#4CAF50',
  },
  avatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#1a1a1a',
  },
  avatarHint: {
    marginTop: 12,
    fontSize: 14,
    color: '#999',
  },
  form: {
    marginBottom: 32,
  },
  field: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#fff',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  inputDisabled: {
    opacity: 0.6,
  },
  fieldHint: {
    marginTop: 8,
    fontSize: 12,
    color: '#666',
  },
  passwordButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
  },
  passwordButtonText: {
    fontSize: 16,
    color: '#4CAF50',
    fontWeight: '500',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoCard: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#3a3a3a',
  },
  infoLabel: {
    fontSize: 14,
    color: '#999',
  },
  infoValue: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '500',
  },
  premiumText: {
    color: '#FFD700',
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
  },
  selectButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  selectButtonIcon: {
    fontSize: 20,
  },
  selectButtonText: {
    fontSize: 16,
    color: '#fff',
  },
  dangerSection: {
    marginTop: 20,
    marginBottom: 40,
  },
  dangerTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ff4444',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 68, 68, 0.1)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 68, 68, 0.3)',
    gap: 12,
  },
  dangerButtonText: {
    fontSize: 16,
    color: '#ff4444',
    fontWeight: '500',
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
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

