import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/services/supabase';
import { useAuth } from '@/hooks/useAuth';

interface POICalloutProps {
  poiId: string;
  poiName: string;
}

interface POIKing {
  username: string;
  minutes: number;
}

export function POICallout({ poiId, poiName }: POICalloutProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [king, setKing] = useState<POIKing | null>(null);
  const [userMinutes, setUserMinutes] = useState<number>(0);

  useEffect(() => {
    loadPOIData();
  }, [poiId]);

  const loadPOIData = async () => {
    try {
      setLoading(true);

      const getCurrentMonth = () => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      };

      // Get POI leaderboard
      const { data: leaderboardData, error: leaderboardError } = await supabase
        .rpc('poi_leaderboard', {
          poi_id_param: poiId,
          month_param: getCurrentMonth()
        })
        .limit(1);

      if (leaderboardError) {
        console.error('❌ POI Leaderboard error:', leaderboardError);
        throw leaderboardError;
      }

      // Set king (first place)
      if (leaderboardData && leaderboardData.length > 0) {
        setKing({
          username: leaderboardData[0].username,
          minutes: leaderboardData[0].minutes,
        });
      }

      // Get user's minutes for this POI
      if (user?.id) {
        const { data: userClaimsData, error: claimsError } = await supabase
          .from('claims')
          .select('minutes_earned')
          .eq('user_id', user.id)
          .eq('poi_id', poiId);

        if (claimsError) throw claimsError;

        const total = userClaimsData?.reduce((sum, claim) => sum + claim.minutes_earned, 0) || 0;
        setUserMinutes(total);
      }
    } catch (error) {
      console.error('Error loading POI data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="small" color="#4CAF50" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Current King */}
      {king ? (
        <View style={styles.kingSection}>
          <Text style={styles.crownIcon}>👑</Text>
          <View style={styles.kingInfo}>
            <Text style={styles.kingLabel}>King</Text>
            <Text style={styles.kingName}>{king.username}</Text>
            <Text style={styles.kingMinutes}>{king.minutes} minutes</Text>
          </View>
        </View>
      ) : (
        <View style={styles.noKingSection}>
          <Text style={styles.noKingIcon}>🏰</Text>
          <Text style={styles.noKingText}>No king yet!</Text>
        </View>
      )}

      {/* User's Progress */}
      {userMinutes > 0 && (
        <View style={styles.userSection}>
          <Ionicons name="time" size={16} color="#4CAF50" />
          <Text style={styles.userMinutes}>
            Your time: {userMinutes} minutes
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minWidth: 200,
    maxWidth: 300,
    padding: 12,
  },
  kingSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
  },
  crownIcon: {
    fontSize: 32,
    marginRight: 10,
  },
  kingInfo: {
    flex: 1,
  },
  kingLabel: {
    fontSize: 11,
    color: '#FFD700',
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  kingName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 2,
  },
  kingMinutes: {
    fontSize: 12,
    color: '#999',
  },
  noKingSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3a3a3a',
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
  },
  noKingIcon: {
    fontSize: 24,
    marginRight: 8,
  },
  noKingText: {
    fontSize: 14,
    color: '#ddd',
    fontStyle: 'italic',
  },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderRadius: 8,
    padding: 10,
  },
  userMinutes: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4CAF50',
  },
});
