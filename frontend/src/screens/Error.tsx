import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Screen } from '../components/Screen';

interface ErrorProps {
  title?: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function Error({
  title = 'Ups...',
  message = 'Algo salió mal. Intenta nuevamente.',
  actionLabel = 'Reintentar',
  onAction,
}: ErrorProps) {
  return (
    <Screen>
      <View style={styles.container}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.message}>{message}</Text>

        {onAction && (
          <TouchableOpacity style={styles.button} onPress={onAction}>
            <Text style={styles.buttonText}>{actionLabel}</Text>
          </TouchableOpacity>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 20,
  },
  button: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#111827',
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
});
