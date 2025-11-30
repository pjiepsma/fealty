import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { UserTrackingMode } from '@rnmapbox/maps';

interface MapControlsProps {
  followUserMode: UserTrackingMode;
  onToggleFollowMode: () => void;
  topInset: number;
}

export function MapControls({ followUserMode, onToggleFollowMode, topInset }: MapControlsProps) {
  return (
    <TouchableOpacity
      style={[styles.toggleButton, { top: topInset + 16 }]}
      onPress={onToggleFollowMode}
    >
      <MaterialIcons
        name={followUserMode === UserTrackingMode.FollowWithHeading ? 'explore' : 'explore-off'}
        size={24}
        color="#007AFF"
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  toggleButton: {
    position: 'absolute',
    right: 16,
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 100,
  },
});

