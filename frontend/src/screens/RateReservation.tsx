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
import { Button } from '../components/Button';
type Props = {
  visible: boolean;
  loading?: boolean;
  titleTop?: string;      // "Califica al profesional"
  title?: string;         // "Como fue tu experiencia con X?"
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
            color="#F4C430"
          />
        </TouchableOpacity>
      ))}
    </View>
  );
}

export default function RateReservationSheet({
  visible,
  loading,
  titleTop = 'Califica',
  title = '¿Cómo fue tu experiencia?',
  onClose,
  onSubmit,
}: Props) {
  const [puntaje, setPuntaje] = useState(0);
  const [comentario, setComentario] = useState('');

  const translateY = useRef(new Animated.Value(500)).current;
  const backdrop = useRef(new Animated.Value(0)).current;

  const canSend = useMemo(() => puntaje >= 1 && puntaje <= 5 && !loading, [puntaje, loading]);

  useEffect(() => {
    if (!visible) return;

    // reset cada vez que abre
    setPuntaje(0);
    setComentario('');

    translateY.setValue(500);
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
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={closeAnimated} />
      </Animated.View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.kb}
      >
        <Animated.View style={[styles.sheet, { transform: [{ translateY }] }]}>
          {/* Header (X + título) */}
          <View style={styles.sheetHeader}>
            <TouchableOpacity onPress={closeAnimated} style={styles.closeBtn} activeOpacity={0.85}>
              <Ionicons name="close" size={20} color={COLORS.text} />
            </TouchableOpacity>

            <Text style={styles.sheetTopTitle}>{titleTop}</Text>
          </View>

          <Text style={styles.sheetTitle}>{title}</Text>

          <Text style={styles.sheetHint}>
            Es posible que las personas se califiquen entre sí según sus interacciones o transacciones.
          </Text>

          <StarsRow value={puntaje} onChange={setPuntaje} />

          <TextInput
            value={comentario}
            onChangeText={setComentario}
            placeholder="Describe tu experiencia..."
            placeholderTextColor="#9ca3af"
            style={styles.textarea}
            multiline
          />

          <View style={{ height: 14 }} />

          <Button title={loading ? 'Enviando…' : 'Enviar'} onPress={handleSend} disabled={!canSend} />

          <Text style={styles.footerNote}>
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
    backgroundColor: COLORS.cardBg ?? '#fff',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  sheetHeader: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 8,
  },
  closeBtn: {
    position: 'absolute',
    left: 0,
    top: -2,
    padding: 8,
  },
  sheetTopTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.textMuted,
  },

  sheetTitle: {
    marginTop: 10,
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.text,
    textAlign: 'center',
    lineHeight: 26,
  },
  sheetHint: {
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
    gap: 10,
  },
  starBtn: { padding: 2 },

  textarea: {
    marginTop: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADII.lg,
    padding: 12,
    backgroundColor: '#EEF2F6',
    color: COLORS.text,
    minHeight: 140,
    textAlignVertical: 'top',
  },

  footerNote: {
    marginTop: 10,
    fontSize: 11,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
});
