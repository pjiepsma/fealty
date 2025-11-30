import React from 'react';
import { XStack, YStack, Text, useTheme } from 'tamagui';
import { Sheet } from '@tamagui/sheet';
import { POI } from '@/types';
import { X } from '@tamagui/lucide-icons';
import { TouchableOpacity } from 'react-native';

interface POIDrawerProps {
  poi: POI | null;
  isOpen: boolean;
  onClose: () => void;
}

export function POIDrawer({ poi, isOpen, onClose }: POIDrawerProps) {
  const theme = useTheme();
  
  if (!poi) return null;

  return (
    <Sheet
      open={isOpen}
      onOpenChange={(open: boolean) => {
        if (!open) {
          onClose();
        }
      }}
      snapPoints={[40]}
      dismissOnSnapToBottom
      zIndex={100_000}
      animation="medium"
    >
      <Sheet.Handle />
      <Sheet.Frame
        backgroundColor={theme.cardBackground?.val || '#1a1a1a'}
        padding="$4"
        borderTopLeftRadius={20}
        borderTopRightRadius={20}
      >
        <YStack gap="$3">
          {/* Header */}
          <XStack justifyContent="space-between" alignItems="center">
            <YStack flex={1}>
              <Text fontSize={24} fontWeight="700" color={theme.color?.val || '#f5f5f5'}>
                {poi.name}
              </Text>
              <Text fontSize={16} color={theme.accent?.val || '#8B6914'} textTransform="capitalize">
                {poi.type}
              </Text>
            </YStack>
            <TouchableOpacity onPress={onClose} style={{ padding: 8 }}>
              <X size={24} color={theme.color?.val || '#f5f5f5'} />
            </TouchableOpacity>
          </XStack>

          {/* Content */}
          <YStack gap="$2">
            {/* Add more POI details here */}
          </YStack>
        </YStack>
      </Sheet.Frame>
    </Sheet>
  );
}
