import React, { useState, useEffect, useRef } from 'react';
import { FlatList, RefreshControl, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTypedTranslation } from '@/hooks/useTypedTranslation';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/services/supabase';
import { XStack, YStack, Text, View, styled, useTheme } from 'tamagui';
import { Crown, Trophy, Award, Search, User } from '@tamagui/lucide-icons';
import { ActivityIndicator, TouchableOpacity } from 'react-native';

// Styled components with Tamagui theme
const Card = styled(View, {
  backgroundColor: '$cardBackground',
  borderRadius: 12,
  padding: 16,
  marginBottom: 8,
  borderWidth: 1,
  borderColor: '$borderColor',
});

type TabType = 'world' | 'country' | 'city';
type TimePeriod = 'seasonal' | 'lifetime';

interface LeaderboardEntry {
  user_id: string;
  username: string;
  crowns: number;
  rank: number;
}

export default function RankingsScreen() {
  const { t } = useTypedTranslation();
  const { user } = useAuth();
  const theme = useTheme();
  
  const [activeTab, setActiveTab] = useState<TabType>('city');
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('seasonal');
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedUserId, setHighlightedUserId] = useState<string | null>(null);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    loadLeaderboard();
  }, [activeTab, timePeriod]);

  useEffect(() => {
    // Find and scroll to user when search query matches
    if (searchQuery.trim() && leaderboard.length > 0) {
      const matchedUser = leaderboard.find((entry) =>
        entry.username.toLowerCase().includes(searchQuery.toLowerCase())
      );
      
      if (matchedUser) {
        setHighlightedUserId(matchedUser.user_id);
        const index = leaderboard.findIndex((e) => e.user_id === matchedUser.user_id);
        if (index >= 0 && flatListRef.current) {
          setTimeout(() => {
            flatListRef.current?.scrollToIndex({ index, animated: true, viewPosition: 0.3 });
          }, 100);
        }
      } else {
        setHighlightedUserId(null);
      }
    } else {
      setHighlightedUserId(null);
    }
  }, [searchQuery, leaderboard]);

  const loadLeaderboard = async () => {
    try {
      setLoading(true);
      let data: LeaderboardEntry[] = [];

      // Get current month in YYYY-MM format
      const currentMonth = new Date().toISOString().slice(0, 7);
      
      // Build query to calculate crowns per user
      // For each POI, find the user with most seconds (king)
      // Then count how many POIs each user is king of
      
      let query = supabase
        .from('claims')
        .select('poi_id, user_id, seconds_earned, month');
      
      // Filter by month if monthly period
      if (timePeriod === 'seasonal') {
        query = query.eq('month', currentMonth);
      }
      
      // Filter by location scope
      if (activeTab === 'country' && user?.home_country) {
        // Get user IDs in the country
        const { data: countryUsers } = await supabase
          .from('users')
          .select('id')
          .eq('home_country', user.home_country);
        
        const userIds = countryUsers?.map(u => u.id) || [];
        if (userIds.length === 0) {
          setLeaderboard([]);
          return;
        }
        query = query.in('user_id', userIds);
      } else if (activeTab === 'city' && user?.home_city) {
        // Get user IDs in the city
        const { data: cityUsers } = await supabase
          .from('users')
          .select('id')
          .eq('home_city', user.home_city);
        
        const userIds = cityUsers?.map(u => u.id) || [];
        if (userIds.length === 0) {
          setLeaderboard([]);
          return;
        }
        query = query.in('user_id', userIds);
      }
      
      const { data: claimsData, error } = await query;
      
      if (error) throw error;
      
      // Group by POI and user, sum seconds
      const poiUserSeconds = new Map<string, Map<string, number>>();
      
      claimsData?.forEach((claim: any) => {
        const poiKey = claim.poi_id;
        const userKey = claim.user_id;
        
        if (!poiUserSeconds.has(poiKey)) {
          poiUserSeconds.set(poiKey, new Map());
        }
        
        const userMap = poiUserSeconds.get(poiKey)!;
        const current = userMap.get(userKey) || 0;
        userMap.set(userKey, current + claim.seconds_earned);
      });
      
      // For each POI, find the king (user with most seconds)
      const userCrowns = new Map<string, number>();
      
      poiUserSeconds.forEach((userMap, poiId) => {
        let maxSeconds = 0;
        let kingUserId: string | null = null;
        
        userMap.forEach((seconds, userId) => {
          if (seconds > maxSeconds) {
            maxSeconds = seconds;
            kingUserId = userId;
          }
        });
        
        if (kingUserId) {
          const current = userCrowns.get(kingUserId) || 0;
          userCrowns.set(kingUserId, current + 1);
        }
      });
      
      // Get user details for crown holders
      const userIds = Array.from(userCrowns.keys());
      if (userIds.length > 0) {
        const { data: usersData, error: usersError } = await supabase
          .from('users')
          .select('id, username')
          .in('id', userIds);
        
        if (usersError) throw usersError;
        
        data = (usersData || [])
          .map((u) => ({
            user_id: u.id,
            username: u.username,
            crowns: userCrowns.get(u.id) || 0,
            rank: 0, // Will be set after sorting
          }))
          .sort((a, b) => b.crowns - a.crowns)
          .map((entry, index) => ({
            ...entry,
            rank: index + 1,
          }));
      }

      setLeaderboard(data);
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const scrollToUser = () => {
    if (!user?.id || !flatListRef.current) return;
    
    const userIndex = leaderboard.findIndex((entry) => entry.user_id === user.id);
    if (userIndex >= 0) {
      setSearchQuery('');
      setHighlightedUserId(user.id);
      setTimeout(() => {
        flatListRef.current?.scrollToIndex({ index: userIndex, animated: true, viewPosition: 0.3 });
      }, 100);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadLeaderboard();
  };

  const renderRankIcon = (rank: number, isCurrentUser: boolean, isHighlighted: boolean) => {
    const accentColor = theme.accent?.val || '#8B6914';
    const textColor = theme.color?.val || '#f5f5f5';
    const backgroundColor = theme.background?.val || '#0a0a0a';
    
    // Rank color: if card is gold (current user), use dark background color, otherwise use accent/text
    const rankTextColor = isCurrentUser || isHighlighted 
      ? backgroundColor 
      : (rank <= 3 ? accentColor : textColor);
    const rankIconColor = isCurrentUser || isHighlighted 
      ? backgroundColor 
      : accentColor;
    
    return (
      <YStack alignItems="center" gap="$1" minWidth={50}>
        <Text 
          fontSize={16} 
          fontWeight="700" 
          color={rankTextColor}
          opacity={1}
        >
          #{rank}
        </Text>
      </YStack>
    );
  };

  const renderLeaderboardItem = ({ item, index }: { item: LeaderboardEntry; index: number }) => {
    const isCurrentUser = user?.id === item.user_id;
    const isHighlighted = highlightedUserId === item.user_id;
    const cardBg = isCurrentUser || isHighlighted 
      ? accentColor 
      : (theme.cardBackground?.val || '#151515');
    const cardBorder = isCurrentUser || isHighlighted 
      ? (theme.accentHover?.val || '#A67C00') 
      : borderColor;
    const itemTextColor = isCurrentUser || isHighlighted ? backgroundColor : textColor;
    const itemCrownColor = isCurrentUser || isHighlighted ? backgroundColor : accentColor;
    
    return (
      <Card
        backgroundColor={cardBg}
        borderColor={cardBorder}
        opacity={isCurrentUser ? 1 : 0.95}
      >
        <XStack alignItems="center" gap="$3">
          {/* Rank - Always visible */}
          {renderRankIcon(item.rank, isCurrentUser, isHighlighted)}

          {/* User Info */}
          <YStack flex={1}>
            <Text 
              fontSize={16} 
              fontWeight="600" 
              color={itemTextColor}
            >
              {item.username}
            </Text>
          </YStack>

          {/* Crowns */}
          <XStack alignItems="center" gap="$1">
            <Crown size={20} color={itemCrownColor} />
            <Text 
              fontSize={16} 
              fontWeight="600" 
              color={itemCrownColor}
            >
              {item.crowns}
            </Text>
          </XStack>
        </XStack>
      </Card>
    );
  };

  const tabs: { key: TabType; label: string }[] = [
    { key: 'city', label: t('rankings.tabs.city') },
    { key: 'country', label: t('rankings.tabs.country') },
    { key: 'world', label: t('rankings.tabs.world') },
  ];


  const backgroundColor = theme.background?.val || '#0a0a0a';
  const textColor = theme.color?.val || '#f5f5f5';
  const accentColor = theme.accent?.val || '#8B6914';
  const borderColor = theme.borderColor?.val || '#1a1a1a';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor }} edges={['top']}>
      <YStack flex={1} backgroundColor={backgroundColor}>
        {/* Header */}
        <YStack padding="$4" paddingTop="$5">
          <Text fontSize={32} fontWeight="700" color={textColor}>
            {t('rankings.title')}
          </Text>
        </YStack>

        {/* Time Period Toggle */}
        <XStack 
          backgroundColor={backgroundColor}
          paddingHorizontal="$4"
          paddingBottom="$3"
          gap="$2"
        >
          <XStack
            flex={1}
            backgroundColor={timePeriod === 'seasonal' ? accentColor : (theme.cardBackground?.val || '#151515')}
            borderRadius={8}
            paddingVertical="$2"
            paddingHorizontal="$3"
            alignItems="center"
            justifyContent="center"
            onPress={() => setTimePeriod('seasonal')}
            pressStyle={{ opacity: 0.7 }}
          >
            <Text
              fontSize={14}
              fontWeight={timePeriod === 'seasonal' ? '600' : '400'}
              color={timePeriod === 'seasonal' ? backgroundColor : textColor}
            >
              {t('rankings.timePeriod.seasonal')}
            </Text>
          </XStack>
          <XStack
            flex={1}
            backgroundColor={timePeriod === 'lifetime' ? accentColor : (theme.cardBackground?.val || '#151515')}
            borderRadius={8}
            paddingVertical="$2"
            paddingHorizontal="$3"
            alignItems="center"
            justifyContent="center"
            onPress={() => setTimePeriod('lifetime')}
            pressStyle={{ opacity: 0.7 }}
          >
            <Text
              fontSize={14}
              fontWeight={timePeriod === 'lifetime' ? '600' : '400'}
              color={timePeriod === 'lifetime' ? backgroundColor : textColor}
            >
              {t('rankings.timePeriod.lifetime')}
            </Text>
          </XStack>
        </XStack>

        {/* Location Tabs */}
        <XStack 
          backgroundColor={backgroundColor}
          borderBottomWidth={1}
          borderBottomColor={borderColor}
        >
          {tabs.map(tab => {
            const active = activeTab === tab.key

            return (
              <YStack
                key={tab.key}
                flex={1}
                onPress={() => setActiveTab(tab.key)}
                pressStyle={{ opacity: 0.7 }}
                alignItems="center"
                justifyContent="center"
                paddingVertical="$3"
                borderBottomWidth={active ? 2 : 0}
                borderBottomColor={accentColor}
              >
                <Text
                  fontSize={14}
                  fontWeight={active ? '600' : '400'}
                  color={active ? accentColor : textColor}
                  opacity={active ? 1 : 0.7}
                >
                  {tab.label}
                </Text>
              </YStack>
            )
          })}
        </XStack>

        {/* Search and Find Me */}
        <XStack 
          backgroundColor={backgroundColor}
          paddingHorizontal="$4"
          paddingVertical="$3"
          gap="$2"
          alignItems="center"
        >
          <XStack
            flex={1}
            backgroundColor={theme.cardBackground?.val || '#151515'}
            borderRadius={8}
            paddingHorizontal="$3"
            paddingVertical="$2"
            alignItems="center"
            gap="$2"
            borderWidth={1}
            borderColor={borderColor}
          >
            <Search size={16} color={textColor} opacity={0.5} />
            <TextInput
              style={{
                flex: 1,
                color: textColor,
                fontSize: 14,
              }}
              placeholder={t('rankings.searchPlaceholder')}
              placeholderTextColor={textColor + '80'}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </XStack>
          {user && (
            <TouchableOpacity
              onPress={scrollToUser}
              style={{
                backgroundColor: accentColor,
                borderRadius: 8,
                paddingHorizontal: 12,
                paddingVertical: 8,
                height: 40,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
              }}
            >
              <User size={16} color={backgroundColor} />
              <Text fontSize={14} fontWeight="600" color={backgroundColor}>
                {t('rankings.findMe')}
              </Text>
            </TouchableOpacity>
          )}
        </XStack>

        {/* Content */}
        {loading ? (
          <YStack flex={1} alignItems="center" justifyContent="center">
            <ActivityIndicator size="large" color={accentColor} />
          </YStack>
        ) : leaderboard.length === 0 ? (
          <YStack flex={1} alignItems="center" justifyContent="center" padding="$8">
            <Text fontSize={16} color={textColor} opacity={0.5} textAlign="center">
              {t('rankings.noData')}
            </Text>
          </YStack>
        ) : (
          <FlatList
            ref={flatListRef}
            data={leaderboard}
            renderItem={renderLeaderboardItem}
            keyExtractor={(item, index) => `${item.user_id}-${index}`}
            contentContainerStyle={{ padding: 16 }}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            onScrollToIndexFailed={(info) => {
              // Handle scroll to index failure gracefully
              const wait = new Promise(resolve => setTimeout(resolve, 500));
              wait.then(() => {
                flatListRef.current?.scrollToIndex({ index: info.index, animated: true, viewPosition: 0.3 });
              });
            }}
          />
        )}
      </YStack>
    </SafeAreaView>
  );
}
