// src/components/TopBar.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS, SPACING, RADII } from '../styles/theme';

type Props = {
  title: string;
  rightIcon?: React.ReactNode;       // ej: ⚙️
  onPressRight?: () => void;
};

export const TopBar: React.FC<Props> = ({
  title,
  rightIcon,
  onPressRight,
}) => {
  return (
    <View style={styles.container}>
      <View style={{ width: 24 }} />
      <Text style={styles.title}>{title}</Text>
      {rightIcon ? (
        <TouchableOpacity
          onPress={onPressRight}
          style={styles.rightButton}
        >
          {rightIcon}
        </TouchableOpacity>
      ) : (
        <View style={{ width: 24 }} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm + 2,
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    zIndex: 20,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  rightButton: {
    padding: 4,
    borderRadius: RADII.sm,
  },
});
    