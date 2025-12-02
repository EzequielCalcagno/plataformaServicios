// src/components/AppCard.tsx
import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { COLORS, RADII, SPACING, SHADOWS } from '../styles/theme';

type Props = {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  withShadow?: boolean;
};

export const AppCard: React.FC<Props> = ({
  children,
  style,
  withShadow = false,
}) => {
  return (
    <View
      style={[
        styles.card,
        withShadow && SHADOWS.soft,
        style,
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.cardBg,
    borderRadius: RADII.lg,
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.md,
  },
});
