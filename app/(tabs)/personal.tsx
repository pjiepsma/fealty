import React, { useState, useEffect } from 'react';
import { FlatList, RefreshControl, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTypedTranslation } from '@/hooks/useTypedTranslation';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/services/supabase';
import { formatTime } from '@/utils/formatTime';
import { XStack, YStack, Text, View, styled, useTheme } from 'tamagui';
import { MapPin, Crown } from '@tamagui/lucide-icons';
import { ActivityIndicator } from 'react-native';
import { router } from 'expo-router';

// Styled components with Tamagui theme
const Card = styled(View, {
  backgroundColor: '$cardBackground',
  borderRadius: 12,
  padding: 16,
  marginBottom: 8,
  borderWidth: 1,
  borderColor: '$borderColor',
});

interface PersonalPOIEntry {
  poi_id: string;
  poi_name: string;
  seconds: number;
  rank?: number;
  isKing: boolean;
  kingUsername?: string;
  kingSeconds?: number;
}

export default function PersonalScreen() {
  const { t } = useTypedTranslation();
  const { user } = useAuth();
  const theme = useTheme();
  
  const [pois, setPois] = useState<PersonalPOIEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadPersonalPOIs();
  }, []);

  const loadPersonalPOIs = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Get all claims for the user
      const { data: claimsData, error } = await supabase
        .from('claims')
        .select('poi_id, seconds_earned')
        .eq('user_id', user.id);
      
      if (error) throw error;

      // Group by POI and sum seconds
      const poiSecondsMap = new Map<string, number>();
      claimsData?.forEach((claim: any) => {
        const current = poiSecondsMap.get(claim.poi_id) || 0;
        poiSecondsMap.set(claim.poi_id, current + claim.seconds_earned);
      });

      const poiIds = Array.from(poiSecondsMap.keys());
      if (poiIds.length === 0) {
        setPois([]);
        return;
      }

      // Get POI details
      const { data: poisData, error: poisError } = await supabase
        .from('pois')
        .select('id, name')
        .in('id', poiIds);
      
      if (poisError) throw poisError;

      // For each POI, find the king (user with most seconds)
      const poiKingData = await Promise.all(
        (poisData || []).map(async (poi) => {
          const { data: poiClaims, error: claimsError } = await supabase
            .from('claims')
            .select('user_id, seconds_earned')
            .eq('poi_id', poi.id);
          
          if (claimsError) {
            console.error(`Error fetching claims for POI ${poi.id}:`, claimsError);
            return null;
          }

          // Group by user and sum seconds
          const userSecondsMap = new Map<string, number>();
          poiClaims?.forEach((claim: any) => {
            const current = userSecondsMap.get(claim.user_id) || 0;
            userSecondsMap.set(claim.user_id, current + claim.seconds_earned);
          });

          // Find king (user with most seconds)
          let maxSeconds = 0;
          let kingUserId: string | null = null;
          userSecondsMap.forEach((seconds, userId) => {
            if (seconds > maxSeconds) {
              maxSeconds = seconds;
              kingUserId = userId;
            }
          });

          const userSeconds = poiSecondsMap.get(poi.id) || 0;
          const isKing = kingUserId === user.id;

          // Get king username if not the current user
          let kingUsername: string | undefined;
          let kingSeconds: number | undefined;
          if (!isKing && kingUserId) {
            const { data: kingUser } = await supabase
              .from('users')
              .select('username')
              .eq('id', kingUserId)
              .single();
            
            kingUsername = kingUser?.username;
            kingSeconds = maxSeconds;
          }

          return {
            poi_id: poi.id,
            poi_name: poi.name,
            seconds: userSeconds,
            isKing,
            kingUsername,
            kingSeconds,
          };
        })
      );

      const data: PersonalPOIEntry[] = poiKingData
        .filter((entry): entry is PersonalPOIEntry => entry !== null)
        .sort((a, b) => b.seconds - a.seconds)
        .map((entry, index) => ({
          ...entry,
          rank: index + 1,
        }));

      setPois(data);
    } catch (error) {
      console.error('Error loading personal POIs:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadPersonalPOIs();
  };

  const renderPOIItem = ({ item }: { item: PersonalPOIEntry }) => {
    const backgroundColor = theme.background?.val || '#0a0a0a';
    const textColor = theme.color?.val || '#f5f5f5';
    const accentColor = theme.accent?.val || '#8B6914';
    const borderColor = theme.borderColor?.val || '#1a1a1a';
    
    const handlePOIClick = () => {
      // Navigate to map tab with POI ID
      router.push({
        pathname: '/(tabs)/map',
        params: { poiId: item.poi_id }
      });
    };
    
    return (
      <TouchableOpacity onPress={handlePOIClick} activeOpacity={0.7}>
        <Card borderColor={item.isKing ? accentColor : borderColor} borderWidth={item.isKing ? 2 : 1}>
          <XStack alignItems="center" gap="$3">
            {/* POI Info */}
            <YStack flex={1} gap="$1">
              <XStack alignItems="center" gap="$2">
                <Text 
                  fontSize={16} 
                  fontWeight="600" 
                  color={textColor}
                >
                  {item.poi_name}
                </Text>
                {item.isKing && (
                  <Crown size={16} color={accentColor} />
                )}
              </XStack>
              {item.isKing ? (
                <Text fontSize={12} color={accentColor} opacity={0.8}>
                  👑 You are King
                </Text>
              ) : item.kingUsername && item.kingSeconds !== undefined ? (
                <Text fontSize={12} color={textColor} opacity={0.6}>
                  👑 King: {item.kingUsername} ({formatTime(item.kingSeconds)})
                </Text>
              ) : null}
            </YStack>

            {/* Your Time */}
            <YStack alignItems="flex-end">
              <Text 
                fontSize={14} 
                fontWeight="500" 
                color={textColor}
                opacity={0.6}
              >
                Your time
              </Text>
              <Text 
                fontSize={16} 
                fontWeight="600" 
                color={accentColor}
              >
                {formatTime(item.seconds)}
              </Text>
            </YStack>
          </XStack>
        </Card>
      </TouchableOpacity>
    );
  };

  const backgroundColor = theme.background?.val || '#0a0a0a';
  const textColor = theme.color?.val || '#f5f5f5';

  if (!user) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor }} edges={['top']}>
        <YStack flex={1} alignItems="center" justifyContent="center" padding="$8">
          <Text fontSize={16} color={textColor} opacity={0.5} textAlign="center">
            {t('rankings.noClaims')}
          </Text>
        </YStack>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor }} edges={['top']}>
      <YStack flex={1} backgroundColor={backgroundColor}>
        {/* Header */}
        <YStack padding="$4" paddingTop="$5">
          <Text fontSize={32} fontWeight="700" color={textColor}>
            {t('rankings.tabs.personal')}
          </Text>
        </YStack>

        {/* Content */}
        {loading ? (
          <YStack flex={1} alignItems="center" justifyContent="center">
            <ActivityIndicator size="large" color={theme.accent?.val || '#8B6914'} />
          </YStack>
        ) : pois.length === 0 ? (
          <YStack flex={1} alignItems="center" justifyContent="center" padding="$8">
            <Text fontSize={16} color={textColor} opacity={0.5} textAlign="center">
              {t('rankings.noClaims')}
            </Text>
          </YStack>
        ) : (
          <FlatList
            data={pois}
            renderItem={renderPOIItem}
            keyExtractor={(item) => item.poi_id}
            contentContainerStyle={{ padding: 16 }}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          />
        )}
      </YStack>
    </SafeAreaView>
  );
}

