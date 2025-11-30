import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface CaptureTimerProps {
  captureSeconds: number;
  isCaptureActive: boolean;
  topInset: number;
}

export function CaptureTimer({ captureSeconds, isCaptureActive, topInset }: CaptureTimerProps) {
  if (!isCaptureActive) {
    return null;
  }

  const minutes = Math.floor(captureSeconds / 60);
  const seconds = captureSeconds % 60;

  return (
    <View style={[styles.timerOverlay, { top: topInset + 60 }]}>
      <Text style={styles.timerText}>
        {minutes}:{seconds.toString().padStart(2, '0')}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  timerOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 200,
  },
  timerText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#fff',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
  },
});

