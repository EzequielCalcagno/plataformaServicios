import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { Screen } from '../components/Screen';

interface LoadingProps {
  message?: string;
}

export function Loading({ message = 'Cargando…' }: LoadingProps) {
  return (
    <Screen>
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#111827" />
        <Text style={styles.text}>{message}</Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  text: {
    marginTop: 16,
    fontSize: 14,
    color: '#6B7280',
  },
});
