import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { UserTrackingMode } from '@rnmapbox/maps';

interface MapControlsProps {
  followMode: UserTrackingMode;
  onToggle: () => void;
  topInset: number;
}

export function MapControls({ followMode, onToggle, topInset }: MapControlsProps) {
  return (
    <TouchableOpacity
      style={[styles.followButton, { top: topInset + 10, right: 16 }]}
      onPress={onToggle}
    >
      <MaterialIcons
        name={followMode === UserTrackingMode.FollowWithHeading ? "navigation" : "my-location"}
        size={24}
        color="#fff"
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  followButton: {
    position: 'absolute',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
});
