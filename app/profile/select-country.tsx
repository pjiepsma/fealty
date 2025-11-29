import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { GeocodingService, Country } from '@/services/geocoding.service';
import { supabase } from '@/services/supabase';
import { useAuth } from '@/hooks/useAuth';

export default function SelectCountryScreen() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  const countries = GeocodingService.getPopularCountries();

  const filteredCountries = countries.filter(country =>
    country.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelectCountry = async (country: Country) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({ 
          home_country: country.name,
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
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#999" />
        <TextInput
          style={styles.searchInput}
          placeholder={t('profile.edit.location.searchCountry')}
          placeholderTextColor="#999"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Country List */}
      <FlatList
        data={filteredCountries}
        keyExtractor={item => item.code}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.countryCard}
            onPress={() => handleSelectCountry(item)}
            disabled={loading}
          >
            <Text style={styles.flag}>{item.flag}</Text>
            <View style={styles.countryInfo}>
              <Text style={styles.countryName}>{item.name}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
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
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#fff',
  },
  countryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingHorizontal: 20,
  },
  flag: {
    fontSize: 32,
    marginRight: 16,
  },
  countryInfo: {
    flex: 1,
  },
  countryName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#fff',
  },
  separator: {
    height: 1,
    backgroundColor: '#2a2a2a',
    marginLeft: 20,
  },
});

