// src/components/AppAlert.tsx
import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { COLORS, SPACING, RADII } from '../styles/theme';

type AppAlertProps = {
  type?: 'success' | 'error';
  message: string;
  style?: ViewStyle | ViewStyle[];
};

export const Alert: React.FC<AppAlertProps> = ({ type = 'success', message, style }) => {
  const isSuccess = type === 'success';

  return (
    <View
      style={[styles.container, isSuccess ? styles.successContainer : styles.errorContainer, style]}
    >
      <Text style={isSuccess ? styles.successText : styles.errorText}>{message}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: RADII.md,
    borderWidth: 1,
  },
  successContainer: {
    backgroundColor: '#dcfce7',
    borderColor: '#bbf7d0',
  },
  errorContainer: {
    backgroundColor: '#fee2e2',
    borderColor: '#fecaca',
  },
  successText: {
    color: '#166534',
    fontSize: 14,
  },
  errorText: {
    color: '#b91c1c',
    fontSize: 14,
  },
});
