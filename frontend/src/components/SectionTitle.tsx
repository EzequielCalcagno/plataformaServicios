// src/components/SectionTitle.tsx
import React from 'react';
import { Text, StyleSheet, View, ViewStyle } from 'react-native';
import { COLORS, SPACING } from '../styles/theme';

type Props = {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  rightContent?: React.ReactNode;
};

export const SectionTitle: React.FC<Props> = ({
  children,
  style,
  rightContent,
}) => {
  return (
    <View style={[styles.container, style]}>
      <Text style={styles.title}>{children}</Text>
      {rightContent}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
});
