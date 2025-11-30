import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { MapPin, CheckCircle, Trophy, Zap, Users, Award } from '@tamagui/lucide-icons';

interface Notification {
  id: string;
  type: 'poi' | 'capture' | 'king' | 'challenge' | 'friend' | 'leaderboard';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

export default function NotificationCenterScreen() {
  const { t } = useTranslation();
  
  // Mock notifications - TODO: Fetch from backend
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      type: 'poi',
      title: t('notifications.types.poiNearby'),
      message: t('notifications.messages.poiNearby', { name: 'Berg en Bos Park' }),
      timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
      read: false,
    },
    {
      id: '2',
      type: 'capture',
      title: t('notifications.types.captureComplete'),
      message: t('notifications.messages.captureComplete', { minutes: 5 }),
      timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      read: false,
    },
    {
      id: '3',
      type: 'king',
      title: t('notifications.types.kingStatus'),
      message: t('notifications.messages.becameKing', { name: 'Amersfoort Museum' }),
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
      read: true,
    },
    {
      id: '4',
      type: 'leaderboard',
      title: t('notifications.types.leaderboard'),
      message: t('notifications.messages.leaderboardRank', { rank: 5 }),
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
      read: true,
    },
  ]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'poi': return MapPin;
      case 'capture': return CheckCircle;
      case 'king': return Trophy;
      case 'challenge': return Zap;
      case 'friend': return Users;
      case 'leaderboard': return Award;
      default: return MapPin;
    }
  };

  const formatTimestamp = (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    const minutes = Math.floor(diff / 1000 / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return t('notifications.time.justNow');
    if (minutes < 60) return t('notifications.time.minutesAgo', { count: minutes });
    if (hours < 24) return t('notifications.time.hoursAgo', { count: hours });
    if (days < 7) return t('notifications.time.daysAgo', { count: days });
    return date.toLocaleDateString();
  };

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notif => ({ ...notif, read: true }))
    );
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const renderNotification = ({ item }: { item: Notification }) => {
    const IconComponent = getIcon(item.type);
    return (
      <TouchableOpacity
        style={[styles.notificationCard, !item.read && styles.unreadCard]}
        onPress={() => markAsRead(item.id)}
        activeOpacity={0.7}
      >
        <View style={styles.iconContainer}>
          <IconComponent size={24} color="#8B6914" />
        </View>
      
      <View style={styles.notificationContent}>
        <View style={styles.notificationHeader}>
          <Text style={styles.notificationTitle}>{item.title}</Text>
          {!item.read && <View style={styles.unreadDot} />}
        </View>
        <Text style={styles.notificationMessage}>{item.message}</Text>
        <Text style={styles.notificationTime}>{formatTimestamp(item.timestamp)}</Text>
      </View>
    </TouchableOpacity>
    );
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>{t('notifications.title')}</Text>
          {unreadCount > 0 && (
            <Text style={styles.headerSubtitle}>
              {t('notifications.unread', { count: unreadCount })}
            </Text>
          )}
        </View>
        {notifications.length > 0 && (
          <View style={styles.headerActions}>
            {unreadCount > 0 && (
              <TouchableOpacity style={styles.headerButton} onPress={markAllAsRead}>
                <Text style={styles.headerButtonText}>{t('notifications.markAllRead')}</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.headerButton} onPress={clearAll}>
              <Text style={styles.headerButtonText}>{t('notifications.clearAll')}</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Notifications List */}
      {notifications.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>{t('notifications.empty.title')}</Text>
          <Text style={styles.emptyMessage}>{t('notifications.empty.message')}</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderNotification}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#8B6914',
    marginTop: 4,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  headerButton: {
    padding: 8,
  },
  headerButtonText: {
    fontSize: 14,
    color: '#8B6914',
    fontWeight: '500',
  },
  listContent: {
    padding: 20,
  },
  notificationCard: {
    flexDirection: 'row',
    backgroundColor: '#151515',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#1a1a1a',
  },
  unreadCard: {
    backgroundColor: '#151515',
    borderLeftWidth: 3,
    borderLeftColor: '#8B6914',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    backgroundColor: '#1a1a1a',
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    flex: 1,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#8B6914',
    marginLeft: 8,
  },
  notificationMessage: {
    fontSize: 14,
    color: '#ccc',
    marginBottom: 8,
    lineHeight: 20,
  },
  notificationTime: {
    fontSize: 12,
    color: '#666',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
  },
});

