// src/components/Modal.tsx
import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Button } from './Button';

type AppModalProps = {
  visible: boolean;
  title: string;
  text: string;
  onClose: () => void;
};

export function AppModal({ visible, title, text, onClose }: AppModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.title}>{title}</Text>

          <Text style={styles.text}>{text}</Text>

          <Button onPress={onClose} title="Cerrar" variant='neutral' />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  container: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  text: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    marginBottom: 20,
  },
});
