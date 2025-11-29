import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, FlatList, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/services/supabase';
import { getCurrentMonth } from '@/utils/date';

type TabType = 'world' | 'country' | 'city' | 'personal';

interface LeaderboardEntry {
  user_id: string;
  username: string;
  seconds: number;
  rank: number;
  poi_name?: string; // For personal tab
}

export default function RankingsScreen() {
  const { t } = useTranslation();
  const { user } = useAuth();
  
  const [activeTab, setActiveTab] = useState<TabType>('world');
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadLeaderboard();
  }, [activeTab]);

  const loadLeaderboard = async () => {
    try {
      setLoading(true);
      let data: LeaderboardEntry[] = [];

      if (activeTab === 'world') {
        // Global leaderboard - query users table directly
        const { data: userData, error } = await supabase
          .from('users')
          .select('id, username, total_seconds')
          .order('total_seconds', { ascending: false })
          .limit(100);
        
        if (error) throw error;
        
        data = (userData || []).map((u, index) => ({
          user_id: u.id,
          username: u.username,
          seconds: u.total_seconds,
          rank: index + 1,
        }));
        
      } else if (activeTab === 'country' && user?.home_country) {
        // Country leaderboard - filter by country
        const { data: userData, error } = await supabase
          .from('users')
          .select('id, username, total_seconds')
          .eq('home_country', user.home_country)
          .order('total_seconds', { ascending: false })
          .limit(100);
        
        if (error) throw error;
        
        data = (userData || []).map((u, index) => ({
          user_id: u.id,
          username: u.username,
          seconds: u.total_seconds,
          rank: index + 1,
        }));
        
      } else if (activeTab === 'city' && user?.home_city) {
        // City leaderboard - filter by city
        const { data: userData, error } = await supabase
          .from('users')
          .select('id, username, total_seconds')
          .eq('home_city', user.home_city)
          .order('total_seconds', { ascending: false })
          .limit(100);
        
        if (error) throw error;
        
        data = (userData || []).map((u, index) => ({
          user_id: u.id,
          username: u.username,
          seconds: u.total_seconds,
          rank: index + 1,
        }));
        
      } else if (activeTab === 'personal' && user?.id) {
        // Personal POI captures - show POIs the user has captured
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

        // Get POI details
        const poiIds = Array.from(poiSecondsMap.keys());
        if (poiIds.length > 0) {
          const { data: poisData, error: poisError } = await supabase
            .from('pois')
            .select('id, name')
            .in('id', poiIds);
          
          if (poisError) throw poisError;

          data = (poisData || []).map((poi, index) => ({
            user_id: user.id,
            username: poi.name,
            seconds: poiSecondsMap.get(poi.id) || 0,
            rank: index + 1,
            poi_name: poi.name,
          })).sort((a, b) => b.seconds - a.seconds);
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

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    }
    return `${remainingSeconds}s`;
  };

  const renderLeaderboardItem = ({ item, index }: { item: LeaderboardEntry; index: number }) => {
    const isCurrentUser = activeTab !== 'personal' && user?.id === item.user_id;
    
    return (
      <View style={[styles.leaderboardItem, isCurrentUser && styles.currentUserItem]}>
        <View style={styles.rankContainer}>
          {item.rank <= 3 ? (
            <Text style={styles.rankMedal}>{['🥇', '🥈', '🥉'][item.rank - 1]}</Text>
          ) : (
            <Text style={styles.rankText}>#{item.rank}</Text>
          )}
        </View>
        <View style={styles.userInfo}>
          <Text style={[styles.username, isCurrentUser && styles.currentUsername]}>
            {item.username}
          </Text>
          {activeTab === 'personal' && item.poi_name && (
            <Text style={styles.poiName}>{item.poi_name}</Text>
          )}
        </View>
        <Text style={[styles.secondsText, isCurrentUser && styles.currentMinutes]}>
          {formatTime(item.seconds)}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{t('rankings.title')}</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'world' && styles.activeTab]}
          onPress={() => setActiveTab('world')}
        >
          <Text style={[styles.tabText, activeTab === 'world' && styles.activeTabText]}>
            {t('rankings.world')}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'country' && styles.activeTab]}
          onPress={() => setActiveTab('country')}
        >
          <Text style={[styles.tabText, activeTab === 'country' && styles.activeTabText]}>
            {t('rankings.country')}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'city' && styles.activeTab]}
          onPress={() => setActiveTab('city')}
        >
          <Text style={[styles.tabText, activeTab === 'city' && styles.activeTabText]}>
            {t('rankings.city')}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'personal' && styles.activeTab]}
          onPress={() => setActiveTab('personal')}
        >
          <Text style={[styles.tabText, activeTab === 'personal' && styles.activeTabText]}>
            {t('rankings.personal')}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      ) : leaderboard.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            {activeTab === 'personal' 
              ? t('rankings.noClaims')
              : t('rankings.noData')}
          </Text>
        </View>
      ) : (
        <FlatList
          data={leaderboard}
          renderItem={renderLeaderboardItem}
          keyExtractor={(item, index) => `${item.user_id}-${index}`}
          contentContainerStyle={styles.leaderboardContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
  },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    backgroundColor: '#111',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#007AFF',
  },
  tabText: {
    fontSize: 14,
    color: '#888',
  },
  activeTabText: {
    color: '#007AFF',
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  leaderboardContainer: {
    padding: 16,
  },
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#111',
    borderRadius: 12,
    marginBottom: 8,
  },
  currentUserItem: {
    backgroundColor: '#1a3a52',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  rankContainer: {
    width: 50,
    alignItems: 'center',
  },
  rankMedal: {
    fontSize: 24,
  },
  rankText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#888',
  },
  userInfo: {
    flex: 1,
    marginLeft: 12,
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  currentUsername: {
    color: '#007AFF',
  },
  poiName: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  secondsText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#888',
  },
  currentMinutes: {
    color: '#007AFF',
  },
});
