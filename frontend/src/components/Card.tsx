// src/components/AppCard.tsx
import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { COLORS, RADII, SPACING, SHADOWS } from '../styles/theme';

type Props = {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  withShadow?: boolean;
  onPress?: () => void;
};

export const Card: React.FC<Props> = ({ children, style, withShadow = false, onPress }) => {
  return <View style={[styles.card, withShadow && SHADOWS.soft, style]} onTouchEnd={onPress}>{children}</View>;
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.cardBg,
    borderRadius: RADII.lg,
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.md,
    borderColor: COLORS.borderCard,
    borderWidth: 1,
  },
});
