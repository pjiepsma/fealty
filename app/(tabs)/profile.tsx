import React from 'react';
import { ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/hooks/useAuth';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { XStack, YStack, Text, View, styled, useTheme } from 'tamagui';
import { 
  User, 
  Mail, 
  ChevronRight, 
  Settings, 
  Bell, 
  BookOpen, 
  MessageSquare, 
  LogOut,
  Clock,
  MapPin,
  Crown
} from '@tamagui/lucide-icons';
import { formatTime } from '@/utils/formatTime';

// Styled components
const Card = styled(View, {
  backgroundColor: '$cardBackground',
  borderRadius: 12,
  padding: 16,
  marginBottom: 12,
  borderWidth: 1,
  borderColor: '$borderColor',
});

const StatCard = styled(Card, {
  flex: 1,
  alignItems: 'center',
  padding: 20,
  marginHorizontal: 4,
});

export default function ProfileScreen() {
  const { t } = useTranslation();
  const { user, signOut, loading } = useAuth();
  const theme = useTheme();

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

  const backgroundColor = theme.background?.val || '#0a0a0a';
  const textColor = theme.color?.val || '#f5f5f5';
  const accentColor = theme.accent?.val || '#8B6914';
  const cardBg = theme.cardBackground?.val || '#151515';
  const cardBgHover = theme.cardBackgroundHover?.val || '#1a1a1a';
  const colorHover = theme.colorHover?.val || '#ffffff';

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor }}>
        <YStack flex={1} alignItems="center" justifyContent="center">
          <ActivityIndicator size="large" color={accentColor} />
          <Text marginTop="$4" fontSize={16} color={textColor} opacity={0.5}>
            {t('common.loading')}
          </Text>
        </YStack>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor }} edges={['top', 'bottom']}>
      <ScrollView 
        style={{ flex: 1, backgroundColor }} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        <YStack flex={1} backgroundColor={backgroundColor} padding="$5" paddingTop="$6">
          {/* Header */}
          <Text fontSize={32} fontWeight="700" color={textColor} marginBottom="$6">
            {t('profile.title')}
          </Text>
          
          {user && (
            <>
              {/* User Info Card */}
              <TouchableOpacity 
                activeOpacity={0.7}
                onPress={() => router.push('/profile/edit-profile')}
              >
                <Card backgroundColor={cardBgHover}>
                  <XStack alignItems="center" gap="$4">
                    <YStack
                      width={64}
                      height={64}
                      borderRadius={32}
                      backgroundColor={backgroundColor}
                      borderWidth={2}
                      borderColor={accentColor}
                      alignItems="center"
                      justifyContent="center"
                    >
                      <User size={32} color={accentColor} />
                    </YStack>
                    
                    <YStack flex={1} gap="$1">
                      <Text fontSize={20} fontWeight="700" color={textColor}>
                        {user.username}
                      </Text>
                      <XStack alignItems="center" gap="$1">
                        <Mail size={14} color={colorHover} opacity={0.6} />
                        <Text fontSize={14} color={colorHover} opacity={0.7}>
                          {user.email}
                        </Text>
                      </XStack>
                      {(user.home_city || user.home_country) && (
                        <XStack alignItems="center" gap="$1" marginTop="$1">
                          <MapPin size={12} color={colorHover} opacity={0.5} />
                          <Text fontSize={12} color={colorHover} opacity={0.6}>
                            {[user.home_city, user.home_country].filter(Boolean).join(', ')}
                          </Text>
                        </XStack>
                      )}
                    </YStack>
                    
                    <ChevronRight size={24} color={colorHover} opacity={0.4} />
                  </XStack>
                </Card>
              </TouchableOpacity>

              {/* Stats Cards */}
              <XStack marginTop="$5" marginBottom="$8">
                <StatCard>
                  <Clock size={28} color={accentColor} marginBottom="$2" />
                  <Text fontSize={24} fontWeight="700" color={accentColor} marginBottom="$1">
                    {formatTime(user.totalSeconds || 0)}
                  </Text>
                  <Text fontSize={11} color={textColor} opacity={0.5} textAlign="center">
                    {t('profile.stats.minutesCaptured')}
                  </Text>
                </StatCard>
                
                <StatCard>
                  <MapPin size={28} color={accentColor} marginBottom="$2" />
                  <Text fontSize={24} fontWeight="700" color={accentColor} marginBottom="$1">
                    {user.totalPOIsClaimed || 0}
                  </Text>
                  <Text fontSize={11} color={textColor} opacity={0.5} textAlign="center">
                    {t('profile.stats.poisClaimed')}
                  </Text>
                </StatCard>
                
                <StatCard>
                  <Crown size={28} color={accentColor} marginBottom="$2" />
                  <Text fontSize={24} fontWeight="700" color={accentColor} marginBottom="$1">
                    {user.currentKingOf || 0}
                  </Text>
                  <Text fontSize={11} color={textColor} opacity={0.5} textAlign="center">
                    {t('profile.stats.currentlyKingOf')}
                  </Text>
                </StatCard>
              </XStack>

              {/* Menu Sections */}
              <YStack marginBottom="$6">
                <Text 
                  fontSize={12} 
                  fontWeight="600" 
                  color={colorHover} 
                  opacity={0.6}
                  marginBottom="$3"
                  textTransform="uppercase"
                  letterSpacing={1}
                >
                  {t('profile.menu.account')}
                </Text>
                
                <TouchableOpacity 
                  onPress={() => router.push('/profile/edit-profile')}
                  activeOpacity={0.7}
                >
                  <Card marginBottom="$2">
                    <XStack alignItems="center" gap="$3">
                      <YStack
                        width={40}
                        height={40}
                        borderRadius={20}
                        backgroundColor={backgroundColor}
                        alignItems="center"
                        justifyContent="center"
                      >
                        <User size={20} color={accentColor} />
                      </YStack>
                      <Text flex={1} fontSize={16} fontWeight="500" color={textColor}>
                        {t('profile.menu.editProfile')}
                      </Text>
                      <ChevronRight size={20} color={colorHover} opacity={0.4} />
                    </XStack>
                  </Card>
                </TouchableOpacity>

                <TouchableOpacity 
                  onPress={() => router.push('/profile/notifications')}
                  activeOpacity={0.7}
                >
                  <Card marginBottom="$2">
                    <XStack alignItems="center" gap="$3">
                      <YStack
                        width={40}
                        height={40}
                        borderRadius={20}
                        backgroundColor={backgroundColor}
                        alignItems="center"
                        justifyContent="center"
                      >
                        <Bell size={20} color={accentColor} />
                      </YStack>
                      <XStack flex={1} alignItems="center" gap="$2">
                        <Text fontSize={16} fontWeight="500" color={textColor}>
                          {t('profile.menu.notifications')}
                        </Text>
                        <YStack
                          backgroundColor={accentColor}
                          borderRadius={10}
                          paddingHorizontal={8}
                          paddingVertical={2}
                        >
                          <Text fontSize={12} color={backgroundColor} fontWeight="700">
                            3
                          </Text>
                        </YStack>
                      </XStack>
                      <ChevronRight size={20} color={colorHover} opacity={0.4} />
                    </XStack>
                  </Card>
                </TouchableOpacity>

                <TouchableOpacity 
                  onPress={() => router.push('/profile/notification-settings')}
                  activeOpacity={0.7}
                >
                  <Card marginBottom="$2">
                    <XStack alignItems="center" gap="$3">
                      <YStack
                        width={40}
                        height={40}
                        borderRadius={20}
                        backgroundColor={backgroundColor}
                        alignItems="center"
                        justifyContent="center"
                      >
                        <Settings size={20} color={accentColor} />
                      </YStack>
                      <Text flex={1} fontSize={16} fontWeight="500" color={textColor}>
                        {t('profile.menu.notificationSettings')}
                      </Text>
                      <ChevronRight size={20} color={colorHover} opacity={0.4} />
                    </XStack>
                  </Card>
                </TouchableOpacity>
              </YStack>

              {/* Language Section */}
              <YStack marginBottom="$6">
                <Text 
                  fontSize={12} 
                  fontWeight="600" 
                  color={colorHover} 
                  opacity={0.6}
                  marginBottom="$3"
                  textTransform="uppercase"
                  letterSpacing={1}
                >
                  {t('profile.menu.preferences')}
                </Text>
                <TouchableOpacity 
                  onPress={() => router.push('/profile/general-settings')}
                  activeOpacity={0.7}
                >
                  <Card marginBottom="$2">
                    <XStack alignItems="center" gap="$3">
                      <YStack
                        width={40}
                        height={40}
                        borderRadius={20}
                        backgroundColor={backgroundColor}
                        alignItems="center"
                        justifyContent="center"
                      >
                        <MessageSquare size={20} color={accentColor} />
                      </YStack>
                      <Text flex={1} fontSize={16} fontWeight="500" color={textColor}>
                        {t('profile.menu.language')}
                      </Text>
                      <ChevronRight size={20} color={colorHover} opacity={0.4} />
                    </XStack>
                  </Card>
                </TouchableOpacity>
              </YStack>

              {/* Support Section */}
              <YStack marginBottom="$6">
                <Text 
                  fontSize={12} 
                  fontWeight="600" 
                  color={colorHover} 
                  opacity={0.6}
                  marginBottom="$3"
                  textTransform="uppercase"
                  letterSpacing={1}
                >
                  {t('profile.menu.support')}
                </Text>
                
                <TouchableOpacity 
                  onPress={() => router.push('/profile/rules')}
                  activeOpacity={0.7}
                >
                  <Card marginBottom="$2">
                    <XStack alignItems="center" gap="$3">
                      <YStack
                        width={40}
                        height={40}
                        borderRadius={20}
                        backgroundColor={backgroundColor}
                        alignItems="center"
                        justifyContent="center"
                      >
                        <BookOpen size={20} color={accentColor} />
                      </YStack>
                      <Text flex={1} fontSize={16} fontWeight="500" color={textColor}>
                        {t('profile.menu.rulesHelp')}
                      </Text>
                      <ChevronRight size={20} color={colorHover} opacity={0.4} />
                    </XStack>
                  </Card>
                </TouchableOpacity>

                <TouchableOpacity activeOpacity={0.7}>
                  <Card marginBottom="$2">
                    <XStack alignItems="center" gap="$3">
                      <YStack
                        width={40}
                        height={40}
                        borderRadius={20}
                        backgroundColor={backgroundColor}
                        alignItems="center"
                        justifyContent="center"
                      >
                        <MessageSquare size={20} color={accentColor} />
                      </YStack>
                      <Text flex={1} fontSize={16} fontWeight="500" color={textColor}>
                        {t('profile.menu.contact')}
                      </Text>
                      <ChevronRight size={20} color={colorHover} opacity={0.4} />
                    </XStack>
                  </Card>
                </TouchableOpacity>
              </YStack>
            </>
          )}

          {/* Sign Out Button */}
          <TouchableOpacity 
            onPress={handleSignOut}
            activeOpacity={0.8}
          >
            <Card backgroundColor={accentColor} borderColor={accentColor}>
              <XStack alignItems="center" justifyContent="center" gap="$2">
                <LogOut size={20} color={backgroundColor} />
                <Text fontSize={16} fontWeight="700" color={backgroundColor}>
                  {t('profile.signOut')}
                </Text>
              </XStack>
            </Card>
          </TouchableOpacity>
        </YStack>
      </ScrollView>
    </SafeAreaView>
  );
}
