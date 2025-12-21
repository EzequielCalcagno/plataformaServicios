import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { COLORS } from '../styles/theme';

interface DividerProps {
  marginVertical?: number;
  style?: ViewStyle;
}

export function Divider({ marginVertical = 8, style }: DividerProps) {
  return <View style={[styles.divider, { marginVertical }, style]} />;
}

const styles = StyleSheet.create({
  divider: {
    height: 1,
    width: '100%',
    backgroundColor: COLORS.bgDivider,
  },
});
