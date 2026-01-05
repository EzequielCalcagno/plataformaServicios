import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADII } from '../styles/theme';
import { Button } from './Button';

type Props = {
  visible: boolean;
  loading?: boolean;
  titleTop?: string; // "Califica al profesional"
  title?: string; // "Como fue tu experiencia con X?"
  placeholder?: string;
  onClose: () => void;
  onSubmit: (data: { puntaje: number; comentario?: string }) => void;
};

function StarsRow({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <View style={styles.starsRow}>
      {[1, 2, 3, 4, 5].map((n) => (
        <TouchableOpacity
          key={n}
          activeOpacity={0.85}
          onPress={() => onChange(n)}
          style={styles.starBtn}
        >
          <Ionicons
            name={n <= value ? 'star' : 'star-outline'}
            size={30}
            color="#F7B500"
          />
        </TouchableOpacity>
      ))}
    </View>
  );
}

export function RateReservationSheet({
  visible,
  loading,
  titleTop = 'Califica',
  title = '¿Cómo fue tu experiencia?',
  placeholder = 'Describe tu experiencia...',
  onClose,
  onSubmit,
}: Props) {
  const [puntaje, setPuntaje] = useState(0);
  const [comentario, setComentario] = useState('');

  const translateY = useRef(new Animated.Value(520)).current;
  const backdrop = useRef(new Animated.Value(0)).current;

  const canSend = useMemo(
    () => puntaje >= 1 && puntaje <= 5 && !loading,
    [puntaje, loading],
  );

  useEffect(() => {
    if (!visible) return;

    // reset al abrir
    setPuntaje(0);
    setComentario('');

    translateY.setValue(520);
    backdrop.setValue(0);

    Animated.parallel([
      Animated.timing(backdrop, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        toValue: 0,
        damping: 18,
        stiffness: 160,
        useNativeDriver: true,
      }),
    ]).start();
  }, [visible, translateY, backdrop]);

  const closeAnimated = () => {
    Animated.parallel([
      Animated.timing(backdrop, {
        toValue: 0,
        duration: 160,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 520,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start(() => onClose());
  };

  const handleSend = () => {
    if (!canSend) return;
    onSubmit({
      puntaje,
      comentario: comentario.trim() || undefined,
    });
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={closeAnimated}>
      {/* Backdrop */}
      <Animated.View
        style={[
          styles.backdrop,
          {
            opacity: backdrop.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 0.45],
            }),
          },
        ]}
      >
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={closeAnimated}
        />
      </Animated.View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.kb}
      >
        <Animated.View style={[styles.sheet, { transform: [{ translateY }] }]}>
          {/* Header */}
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={closeAnimated} style={styles.closeBtn} activeOpacity={0.85}>
              <Ionicons name="close" size={20} color={COLORS.text} />
            </TouchableOpacity>

            <Text style={styles.topTitle}>{titleTop}</Text>
          </View>

          <Text style={styles.title}>{title}</Text>

          <Text style={styles.hint}>
            Es posible que las personas se califiquen entre sí según sus interacciones o transacciones.
          </Text>

          <StarsRow value={puntaje} onChange={setPuntaje} />

          <View style={styles.box}>
            <TextInput
              value={comentario}
              onChangeText={setComentario}
              placeholder={placeholder}
              placeholderTextColor="#94a3b8"
              style={styles.textarea}
              multiline
            />
          </View>

          <Button
            title={loading ? 'Enviando…' : 'Enviar'}
            onPress={handleSend}
            disabled={!canSend}
          />

          <Text style={styles.footer}>
            Otras personas pueden ver los comentarios proporcionados en Fixo.
          </Text>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  kb: { flex: 1, justifyContent: 'flex-end' },

  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
  },

  sheet: {
    backgroundColor: COLORS.cardBg,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  headerRow: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 6,
  },
  closeBtn: {
    position: 'absolute',
    left: 0,
    top: -2,
    padding: 8,
  },
  topTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: COLORS.textMuted,
  },

  title: {
    marginTop: 10,
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.text,
    textAlign: 'center',
    lineHeight: 26,
  },
  hint: {
    marginTop: 10,
    fontSize: 11,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 16,
  },

  starsRow: {
    marginTop: 16,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  starBtn: { paddingHorizontal: 6, paddingVertical: 4 },

  box: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    backgroundColor: '#EEF2F6',
    marginTop: 16,
    marginBottom: 12,
    overflow: 'hidden',
  },
  textarea: {
    minHeight: 140,
    padding: 14,
    color: COLORS.text,
    fontSize: 13,
    textAlignVertical: 'top',
  },

  footer: {
    marginTop: 10,
    textAlign: 'center',
    fontSize: 11,
    color: COLORS.textMuted,
    paddingHorizontal: 18,
  },
});
