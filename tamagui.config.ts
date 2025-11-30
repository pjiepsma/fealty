import { createTamagui } from '@tamagui/core';
import { config } from '@tamagui/config/v3';

// Custom theme with 3-tone color scheme
const appConfig = createTamagui({
  ...config,
  themes: {
    ...config.themes,
    dark: {
      ...config.themes.dark,
      // Tone 1: Dark background
      background: '#0a0a0a',
      backgroundHover: '#151515',
      backgroundPress: '#1a1a1a',
      backgroundFocus: '#1f1f1f',
      
      // Tone 2: Light text
      color: '#f5f5f5',
      colorHover: '#ffffff',
      colorPress: '#e0e0e0',
      
      // Tone 3: Accent (bronze/gold)
      accent: '#8B6914',
      accentHover: '#A67C00',
      accentPress: '#6B4F00',
      
      // Use accent for all secondary colors to keep it simple
      green: '#8B6914',
      greenHover: '#A67C00',
      brown: '#8B6914',
      red: '#8B6914',
      
      // Border colors - dark
      borderColor: '#1a1a1a',
      borderColorHover: '#2a2a2a',
      
      // Card colors - dark
      cardBackground: '#151515',
      cardBackgroundHover: '#1a1a1a',
    },
  },
  tokens: {
    ...config.tokens,
    // Custom spacing for generous spacing
    space: {
      ...config.tokens.space,
      0: 0,
      1: 4,
      2: 8,
      3: 12,
      4: 16,
      5: 20,
      6: 24,
      7: 28,
      8: 32,
      9: 36,
      10: 40,
    },
    // Custom radius - slightly more structured, not too rounded
    radius: {
      ...config.tokens.radius,
      0: 0,
      1: 3,
      2: 6,
      3: 9,
      4: 12,
      5: 16,
      6: 20,
    },
  },
});

export default appConfig;

export type Conf = typeof appConfig;

declare module '@tamagui/core' {
  interface TamaguiCustomConfig extends Conf {}
}

