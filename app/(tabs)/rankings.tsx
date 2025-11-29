import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/services/supabase';

type TabType = 'world' | 'country' | 'city' | 'personal';
type SortMode = 'minutes' | 'crowns';

interface LeaderboardEntry {
  user_id: string;
  username: string;
  minutes: number;
  rank: number;
  poi_id?: string; // For personal tab
  is_king?: boolean; // For personal tab
}

export default function RankingsScreen() {
  const { t } = useTranslation();
  const { user } = useAuth();
  
  const [activeTab, setActiveTab] = useState<TabType>('world');
  const [sortMode, setSortMode] = useState<SortMode>('minutes');
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadLeaderboard();
  }, [activeTab, sortMode]);

  const loadLeaderboard = async () => {
    try {
      setLoading(true);
      let data: LeaderboardEntry[] = [];

      if (activeTab === 'world') {
        // Global leaderboard
        const { data: globalData, error } = await supabase
          .from('leaderboard_global_minutes')
          .select('*')
          .limit(100);
        
        if (error) throw error;
        data = globalData || [];
      } else if (activeTab === 'country' && user?.home_country) {
        // Country leaderboard
        const { data: countryData, error } = await supabase
          .rpc('get_country_leaderboard', {
            country_name: user.home_country,
            limit_count: 100
          });
        
        if (error) throw error;
        data = countryData || [];
      } else if (activeTab === 'city' && user?.home_city) {
        // City leaderboard
        const { data: cityData, error } = await supabase
          .rpc('get_city_leaderboard', {
            city_name: user.home_city,
            limit_count: 100
          });
        
        if (error) throw error;
        data = cityData || [];
      } else if (activeTab === 'personal' && user?.id) {
        // Personal POI captures - show POIs the user has captured
        const { data: claimsData, error } = await supabase
          .from('claims')
          .select('poi_id, minutes_earned')
          .eq('user_id', user.id);
        
        if (error) throw error;

        // Group by POI and sum minutes
        const poiMinutesMap = new Map<string, number>();
        claimsData?.forEach((claim: any) => {
          const current = poiMinutesMap.get(claim.poi_id) || 0;
          poiMinutesMap.set(claim.poi_id, current + claim.minutes_earned);
        });

        // Get POI details for each captured POI
        const poiIds = Array.from(poiMinutesMap.keys());
        if (poiIds.length > 0) {
          const { data: poisData, error: poisError } = await supabase
            .from('pois')
            .select('id, name')
            .in('id', poiIds);
          
          if (poisError) throw poisError;

          // Get leaderboard rank for each POI
          const getCurrentMonth = () => {
            const now = new Date();
            return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
          };

          const dataPromises = poisData?.map(async (poi: any) => {
            const userMinutes = poiMinutesMap.get(poi.id) || 0;
            
            // Get this POI's leaderboard to find user's rank
            const { data: leaderboardData } = await supabase
              .rpc('poi_leaderboard', {
                poi_id_param: poi.id,
                month_param: getCurrentMonth()
              });

            const userEntry = leaderboardData?.find((entry: any) => entry.user_id === user.id);
            const isKing = userEntry?.rank === 1;

            return {
              user_id: poi.id,
              poi_id: poi.id,
              username: poi.name,
              minutes: userMinutes,
              rank: userEntry?.rank || 999,
              is_king: isKing,
            };
          }) || [];

          data = await Promise.all(dataPromises);
          // Sort by minutes descending
          data.sort((a, b) => b.minutes - a.minutes);
        }
      }

      setLeaderboard(data);
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadLeaderboard();
  };

  const renderLeaderboardItem = ({ item, index }: { item: LeaderboardEntry; index: number }) => {
    const isCurrentUser = activeTab !== 'personal' && item.user_id === user?.id;
    const rank = item.rank || index + 1;
    const isPersonalTab = activeTab === 'personal';

    return (
      <View style={[styles.leaderboardItem, isCurrentUser && styles.currentUserItem]}>
        {/* Rank */}
        <View style={styles.rankContainer}>
          {isPersonalTab && item.is_king ? (
            <Text style={styles.rankEmoji}>👑</Text>
          ) : rank <= 3 ? (
            <Text style={styles.rankEmoji}>
              {rank === 1 ? '🥇' : rank === 2 ? '🥈' : '🥉'}
            </Text>
          ) : (
            <Text style={styles.rankText}>#{rank}</Text>
          )}
        </View>

        {/* Username or POI Name */}
        <View style={styles.usernameContainer}>
          <Text style={[styles.username, isCurrentUser && styles.currentUsername]}>
            {item.username}
            {isCurrentUser && ' (You)'}
          </Text>
          {isPersonalTab && !item.is_king && item.rank < 999 && (
            <Text style={styles.rankBadge}>#{item.rank}</Text>
          )}
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <Ionicons name="time" size={16} color="#4CAF50" />
          <Text style={styles.minutesText}>{item.minutes}m</Text>
        </View>
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="trophy-outline" size={64} color="#3a3a3a" />
      <Text style={styles.emptyTitle}>
        {activeTab === 'country' && !user?.home_country
          ? t('rankings.setCountryFirst')
          : activeTab === 'city' && !user?.home_city
          ? t('rankings.setCityFirst')
          : t('rankings.noData')}
      </Text>
      <Text style={styles.emptySubtitle}>
        {activeTab === 'country' && !user?.home_country
          ? t('rankings.setCountryHint')
          : activeTab === 'city' && !user?.home_city
          ? t('rankings.setCityHint')
          : t('rankings.noDataHint')}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('rankings.title')}</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'world' && styles.activeTab]}
          onPress={() => setActiveTab('world')}
        >
          <Ionicons 
            name="globe" 
            size={20} 
            color={activeTab === 'world' ? '#4CAF50' : '#999'} 
          />
          <Text style={[styles.tabText, activeTab === 'world' && styles.activeTabText]}>
            {t('rankings.tabs.world')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'country' && styles.activeTab]}
          onPress={() => setActiveTab('country')}
        >
          <Ionicons 
            name="flag" 
            size={20} 
            color={activeTab === 'country' ? '#4CAF50' : '#999'} 
          />
          <Text style={[styles.tabText, activeTab === 'country' && styles.activeTabText]}>
            {user?.home_country || t('rankings.tabs.country')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'city' && styles.activeTab]}
          onPress={() => setActiveTab('city')}
        >
          <Ionicons 
            name="location" 
            size={20} 
            color={activeTab === 'city' ? '#4CAF50' : '#999'} 
          />
          <Text style={[styles.tabText, activeTab === 'city' && styles.activeTabText]}>
            {user?.home_city || t('rankings.tabs.city')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'personal' && styles.activeTab]}
          onPress={() => setActiveTab('personal')}
        >
          <Ionicons 
            name="person" 
            size={20} 
            color={activeTab === 'personal' ? '#4CAF50' : '#999'} 
          />
          <Text style={[styles.tabText, activeTab === 'personal' && styles.activeTabText]}>
            {t('rankings.tabs.personal')}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Sort Mode Toggle (future feature - hidden for MVP) */}
      {/* <View style={styles.sortContainer}>
        <TouchableOpacity
          style={[styles.sortButton, sortMode === 'minutes' && styles.activeSortButton]}
          onPress={() => setSortMode('minutes')}
        >
          <Text style={[styles.sortText, sortMode === 'minutes' && styles.activeSortText]}>
            {t('rankings.sortBy.minutes')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.sortButton, sortMode === 'crowns' && styles.activeSortButton]}
          onPress={() => setSortMode('crowns')}
        >
          <Text style={[styles.sortText, sortMode === 'crowns' && styles.activeSortText]}>
            {t('rankings.sortBy.crowns')}
          </Text>
        </TouchableOpacity>
      </View> */}

      {/* Leaderboard */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loadingText}>{t('common.loading')}</Text>
        </View>
      ) : (
        <FlatList
          data={leaderboard}
          keyExtractor={(item) => item.user_id}
          renderItem={renderLeaderboardItem}
          contentContainerStyle={styles.leaderboardContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#4CAF50"
              colors={['#4CAF50']}
            />
          }
          ListEmptyComponent={renderEmptyState}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  header: {
    padding: 20,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    gap: 6,
  },
  activeTab: {
    backgroundColor: '#2a2a2a',
  },
  tabText: {
    fontSize: 12,
    color: '#999',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  sortContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 12,
  },
  sortButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#2a2a2a',
    alignItems: 'center',
  },
  activeSortButton: {
    backgroundColor: '#4CAF50',
  },
  sortText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#999',
  },
  activeSortText: {
    color: '#fff',
  },
  leaderboardContainer: {
    padding: 16,
  },
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  currentUserItem: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  rankContainer: {
    width: 50,
    alignItems: 'center',
  },
  rankEmoji: {
    fontSize: 24,
  },
  rankText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#999',
  },
  usernameContainer: {
    flex: 1,
    marginLeft: 12,
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  currentUsername: {
    color: '#4CAF50',
  },
  rankBadge: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#1a1a1a',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  minutesText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
    color: '#999',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#555',
    marginTop: 8,
    textAlign: 'center',
  },
});
