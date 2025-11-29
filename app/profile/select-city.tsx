import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { Ionicons } from '@expo/vector-icons';
import { GeocodingService, City } from '@/services/geocoding.service';
import { supabase } from '@/services/supabase';

export default function SelectCityScreen() {
  const { t } = useTranslation();
  const { user } = useAuth();
  
  const [search, setSearch] = useState('');
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Load popular cities on mount
  useEffect(() => {
    loadPopularCities();
  }, []);

  // Search when user types
  useEffect(() => {
    if (search.length >= 2) {
      searchCities(search);
    } else if (search.length === 0) {
      loadPopularCities();
    }
  }, [search]);

  const searchCities = async (query: string) => {
    setLoading(true);
    try {
      const countryCode = user?.home_country 
        ? GeocodingService.getCountryCode(user.home_country)
        : undefined;
      const results = await GeocodingService.searchCities(query, countryCode);
      setCities(results);
    } catch (error) {
      console.error('Error searching cities:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPopularCities = async () => {
    setLoading(true);
    try {
      const popular = await GeocodingService.getPopularCities(user?.home_country);
      setCities(popular);
    } catch (error) {
      console.error('Error loading cities:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAutoDetect = async () => {
    setLoading(true);
    try {
      const city = await GeocodingService.autoDetectLocation();
      if (city) {
        await handleSelectCity(city);
      } else {
        Alert.alert(t('common.error'), t('profile.edit.location.autoDetectFailed'));
      }
    } catch (error: any) {
      Alert.alert(t('common.error'), error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCity = async (city: City) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({ 
          home_city: city.name,
          home_city_lat: city.lat,
          home_city_lng: city.lng,
          location_updated_at: new Date().toISOString(),
        })
        .eq('id', user?.id);

      if (error) throw error;

      Alert.alert(
        t('common.success'),
        t('profile.edit.location.locationUpdated'),
        [{ text: t('common.confirm'), onPress: () => router.back() }]
      );
    } catch (error: any) {
      Alert.alert(t('common.error'), error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#999" />
        <TextInput
          style={styles.searchInput}
          placeholder={t('profile.edit.location.searchCity')}
          placeholderTextColor="#999"
          value={search}
          onChangeText={setSearch}
          autoFocus
        />
        {loading && <ActivityIndicator size="small" color="#4CAF50" />}
      </View>

      {/* Auto-Detect Button */}
      <TouchableOpacity 
        style={styles.autoDetectButton}
        onPress={handleAutoDetect}
        disabled={loading || saving}
      >
        <Ionicons name="navigate" size={20} color="#2196F3" />
        <Text style={styles.autoDetectText}>
          {t('profile.edit.location.autoDetect')}
        </Text>
      </TouchableOpacity>

      {/* Hint */}
      <Text style={styles.hint}>
        {search.length >= 2 
          ? t('profile.edit.location.searchResults')
          : t('profile.edit.location.popularCities', { country: user?.home_country || 'your country' })
        }
      </Text>

      {/* City List */}
      <FlatList
        data={cities}
        keyExtractor={(item, index) => `${item.name}-${item.lat}-${index}`}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.cityCard}
            onPress={() => handleSelectCity(item)}
            disabled={saving}
          >
            <View style={styles.cityIcon}>
              <Ionicons name="location" size={24} color="#4CAF50" />
            </View>
            <View style={styles.cityInfo}>
              <Text style={styles.cityName}>{item.name}</Text>
              {item.country && (
                <Text style={styles.cityCountry}>{item.country}</Text>
              )}
            </View>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={() => (
          <View style={styles.emptyState}>
            <Ionicons name="search" size={48} color="#3a3a3a" />
            <Text style={styles.emptyText}>
              {t('profile.edit.location.noCitiesFound')}
            </Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 12,
    margin: 20,
    marginBottom: 12,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#fff',
  },
  autoDetectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 14,
    marginHorizontal: 20,
    marginBottom: 12,
    gap: 8,
  },
  autoDetectText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2196F3',
  },
  hint: {
    fontSize: 14,
    color: '#999',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  cityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingHorizontal: 20,
  },
  cityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2a2a2a',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cityInfo: {
    flex: 1,
  },
  cityName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#fff',
    marginBottom: 2,
  },
  cityCountry: {
    fontSize: 13,
    color: '#999',
  },
  separator: {
    height: 1,
    backgroundColor: '#2a2a2a',
    marginLeft: 72,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
  },
});

