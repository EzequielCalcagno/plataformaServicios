// src/components/AppScreen.tsx
import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet, ViewStyle } from 'react-native';
import { COLORS } from '../styles/theme';

type Props = {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
};

export const AppScreen: React.FC<Props> = ({ children, style }) => {
  return (
    <SafeAreaView style={[styles.screen, style]}>
      {children}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
});
