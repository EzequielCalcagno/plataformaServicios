// src/screens/CreateRequest.tsx
import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  Platform,
  Animated,
  Easing,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { Screen } from '../components/Screen';
import { TopBar } from '../components/TopBar';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { SectionTitle } from '../components/SectionTitle';
import { COLORS, SPACING, RADII } from '../styles/theme';

import { getProfessionalProfileById, ProfessionalPublicProfileResponse } from '../services/profile.client';
import { createReservation } from '../services/reservations.client';
import { api } from '../utils/api';

type Props = { navigation: any; route: any };

function formatDateTime(d: Date) {
  try {
    return new Intl.DateTimeFormat('es-UY', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  } catch {
    return d.toISOString().slice(0, 16).replace('T', ' ');
  }
}

function SuccessOverlay({
  visible,
  title,
  subtitle,
  type = 'sending', // 'sending' | 'success'
  primaryLabel,
  onPrimary,
}: {
  visible: boolean;
  title: string;
  subtitle?: string;
  type?: 'sending' | 'success';
  primaryLabel?: string;
  onPrimary?: () => void;
}) {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.96)).current;

  const ring = useRef(new Animated.Value(0)).current; 
  const dots = useRef(new Animated.Value(0)).current; 

  React.useEffect(() => {
    if (!visible) {
      opacity.setValue(0);
      scale.setValue(0.96);
      ring.setValue(0);
      dots.setValue(0);
      return;
    }

    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 170,
        useNativeDriver: true,
        easing: Easing.out(Easing.quad),
      }),
      Animated.timing(scale, {
        toValue: 1,
        duration: 170,
        useNativeDriver: true,
        easing: Easing.out(Easing.quad),
      }),
    ]).start();

    if (type === 'sending') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(dots, { toValue: 1, duration: 500, useNativeDriver: true }),
          Animated.timing(dots, { toValue: 0, duration: 500, useNativeDriver: true }),
        ]),
      ).start();
    } else {
      Animated.timing(ring, {
        toValue: 1,
        duration: 520,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }).start();
    }
  }, [visible, type, opacity, scale, ring, dots]);

  if (!visible) return null;

  const dot1 = dots.interpolate({ inputRange: [0, 1], outputRange: [0.2, 1] });
  const dot2 = dots.interpolate({ inputRange: [0, 1], outputRange: [1, 0.2] });
  const dot3 = dots.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] });

  const ringScale = ring.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] });
  const ringOpacity = ring.interpolate({ inputRange: [0, 1], outputRange: [0.2, 1] });

  return (
    <Animated.View style={[styles.overlayWrap, { opacity }]}>
      <Animated.View style={[styles.overlayCard, { transform: [{ scale }] }]}>
        {type === 'sending' ? (
          <View style={styles.iconWrap}>
            <View style={styles.sendingDotRow}>
              <Animated.View style={[styles.sendingDot, { opacity: dot1 }]} />
              <Animated.View style={[styles.sendingDot, { opacity: dot2 }]} />
              <Animated.View style={[styles.sendingDot, { opacity: dot3 }]} />
            </View>
          </View>
        ) : (
          <View style={styles.iconWrap}>
            <Animated.View
              style={[
                styles.checkRing,
                { transform: [{ scale: ringScale }], opacity: ringOpacity },
              ]}
            >
              <Text style={styles.checkIcon}>✓</Text>
            </Animated.View>
          </View>
        )}

        <Text style={styles.overlayTitle}>{title}</Text>
        {!!subtitle && <Text style={styles.overlaySubtitle}>{subtitle}</Text>}

        {type === 'success' && primaryLabel ? (
          <TouchableOpacity activeOpacity={0.9} style={styles.overlayBtn} onPress={onPrimary}>
            <Text style={styles.overlayBtnText}>{primaryLabel}</Text>
          </TouchableOpacity>
        ) : null}
      </Animated.View>
    </Animated.View>
  );
}

export default function CreateRequest({ navigation, route }: Props) {
  const profesionalId = route?.params?.profesionalId as string | undefined;

  const [profile, setProfile] = useState<ProfessionalPublicProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const [selectedServiceId, setSelectedServiceId] = useState<number | null>(null);
  const [descripcion, setDescripcion] = useState('');

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showPicker, setShowPicker] = useState(false);

  const [sending, setSending] = useState(false);
  const [sentOk, setSentOk] = useState(false);

  //  Para bloquear reservas a uno mismo
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const services = useMemo(() => profile?.services ?? [], [profile?.services]);

  const fetchProfile = useCallback(async () => {
    if (!profesionalId) {
      setProfile(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // se intenta leer userId desde storage (si lo guardás)
      const storedUserId = await AsyncStorage.getItem('@userId');
      if (storedUserId) setCurrentUserId(storedUserId);

      // pedirlo al backend (si no está guardado)
      if (!storedUserId) {
        try {
          const me = await api.get<any>('/private/currentUser');
          const id = String(me?.id ?? '');
          if (id) setCurrentUserId(id);
        } catch {

        }
      }

      const p = await getProfessionalProfileById(profesionalId);

      setProfile(p);

      // autoselecciona primer servicio si existe
      const first = p?.services?.[0]?.id;
      if (first && !selectedServiceId) {
        const n = Number(first);
        if (Number.isFinite(n)) setSelectedServiceId(n);
      }
    } catch (e) {
      console.log('❌ CreateRequest fetch profile error', e);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, [profesionalId, selectedServiceId]);

  useFocusEffect(
    useCallback(() => {
      fetchProfile();
    }, [fetchProfile]),
  );

  const canSubmit = !!profesionalId && !!selectedServiceId;

  const handleSubmit = async () => {
    if (!canSubmit) {
      Alert.alert('Falta información', 'Elegí un servicio para continuar.');
      return;
    }

    // Bloqueo: no enviar a uno mismo
    if (currentUserId && profesionalId && String(currentUserId) === String(profesionalId)) {
      Alert.alert('No permitido', 'No podés enviarte una solicitud a vos mismo.');
      return;
    }

    try {
      setSending(true);

      await createReservation({
        servicioId: selectedServiceId!,
        profesionalId: profesionalId!,
        descripcionCliente: descripcion.trim() || undefined,
        fechaHoraSolicitada: selectedDate ? selectedDate.toISOString() : null,
      });

      setSending(false);
      setSentOk(true);

      setTimeout(() => {
        setSentOk(false);
        navigation.navigate('Requests');
      }, 900);
    } catch (e) {
      console.log('❌ CreateRequest submit error', e);
      setSending(false);
      Alert.alert('Error', 'No se pudo enviar la solicitud.');
    }
  };

  const onPickDate = (_event: any, date?: Date) => {
    if (Platform.OS === 'android') setShowPicker(false);
    if (date) setSelectedDate(date);
  };

  return (
    <Screen>
      <TopBar title="Solicitar servicio" />

     
      <SuccessOverlay
        visible={sending}
        type="sending"
        title="Enviando solicitud…"
        subtitle="Estamos notificando al profesional."
      />
      <SuccessOverlay
        visible={sentOk}
        type="success"
        title="¡Solicitud enviada!"
        subtitle="Te avisaremos cuando el profesional responda."
        primaryLabel="Ver mis reservas"
        onPrimary={() => {
          setSentOk(false);
          navigation.navigate('Requests');
        }}
      />

      <ScrollView contentContainerStyle={styles.content}>
        {loading ? (
          <Text style={styles.muted}>Cargando…</Text>
        ) : !profile ? (
          <Text style={styles.muted}>No se pudo cargar el profesional.</Text>
        ) : (
          <>
            <Card withShadow style={styles.headerCard}>
              <Text style={styles.title}>{profile.name}</Text>
              {!!profile.specialty && <Text style={styles.muted}>{profile.specialty}</Text>}
              {!!profile.location && <Text style={styles.muted}>{profile.location}</Text>}

              {currentUserId && profesionalId && String(currentUserId) === String(profesionalId) ? (
                <Text style={styles.selfWarn}>
                  Estás viendo tu propio perfil. No podés enviarte solicitudes.
                </Text>
              ) : null}
            </Card>

            <SectionTitle>Servicio</SectionTitle>

            {services.length === 0 ? (
              <Text style={styles.muted}>Este profesional todavía no tiene servicios publicados.</Text>
            ) : (
              services.map((s) => {
                const idNum = Number(s.id);
                const selected = selectedServiceId === idNum;

                return (
                  <TouchableOpacity
                    key={String(s.id)}
                    activeOpacity={0.85}
                    onPress={() => setSelectedServiceId(idNum)}
                  >
                    <Card
                      style={[
                        styles.serviceCard,
                        ...(selected ? [styles.serviceCardSelected] : []),
                      ]}
                    >
                      <Text style={styles.serviceTitle}>{s.title}</Text>
                      <Text style={styles.serviceCategory}>{s.category}</Text>
                    </Card>
                  </TouchableOpacity>
                );
              })
            )}

            <SectionTitle>Detalle</SectionTitle>

            <View style={styles.inputBox}>
              <TextInput
                value={descripcion}
                onChangeText={setDescripcion}
                placeholder="Contale al profesional lo que necesitás…"
                placeholderTextColor="#9ca3af"
                style={styles.input}
                multiline
              />
            </View>

            <SectionTitle>Fecha y hora sugerida</SectionTitle>

            <TouchableOpacity activeOpacity={0.85} onPress={() => setShowPicker(true)}>
              <Card style={styles.dateCard}>
                <Text style={styles.dateText}>
                  {selectedDate ? formatDateTime(selectedDate) : 'Elegir fecha y hora'}
                </Text>
                <Text style={styles.hint}>(Después lo podés negociar si el profesional no puede)</Text>
              </Card>
            </TouchableOpacity>

            {showPicker && (
              <DateTimePicker
                value={selectedDate ?? new Date()}
                mode="datetime"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={onPickDate}
              />
            )}

            {Platform.OS === 'ios' && showPicker && (
              <Button
                title="Listo"
                variant="outline"
                style={{ marginTop: 8 }}
                onPress={() => setShowPicker(false)}
              />
            )}

            <Button
              title={
                currentUserId && profesionalId && String(currentUserId) === String(profesionalId)
                  ? 'No disponible'
                  : 'Enviar solicitud'
              }
              onPress={handleSubmit}
              disabled={
                !canSubmit ||
                services.length === 0 ||
                (currentUserId && profesionalId && String(currentUserId) === String(profesionalId)) ||
                sending ||
                sentOk
              }
              style={{ marginTop: SPACING.md }}
            />
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xl,
  },
  headerCard: { marginBottom: SPACING.md },
  title: { fontSize: 16, fontWeight: '800', color: COLORS.text },
  muted: { fontSize: 13, color: COLORS.textMuted, marginTop: 4 },

  selfWarn: {
    marginTop: 10,
    fontSize: 12,
    color: '#b45309',
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fde68a',
    padding: 10,
    borderRadius: 12,
  },

  serviceCard: { marginBottom: 8, borderWidth: 1, borderColor: 'transparent' },
  serviceCardSelected: {
    borderColor: '#0284c7',
    backgroundColor: '#ecfeff',
  },
  serviceTitle: { fontSize: 14, fontWeight: '800', color: COLORS.text },
  serviceCategory: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },

  inputBox: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADII.lg,
    backgroundColor: '#fff',
    padding: 10,
    marginBottom: SPACING.md,
  },
  input: {
    fontSize: 14,
    color: COLORS.text,
    minHeight: 44,
  },

  dateCard: {
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: '#fff',
    marginBottom: SPACING.md,
  },
  dateText: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  hint: { fontSize: 11, color: COLORS.textMuted, marginTop: 6 },

  // overlay
  overlayWrap: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 999,
    elevation: 999,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
  },
  overlayCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#fff',
    borderRadius: 18,
    paddingVertical: 18,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  sendingDotRow: { flexDirection: 'row', gap: 8 },
  sendingDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: '#2563eb',
  },
  checkRing: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#dcfce7',
    borderWidth: 1,
    borderColor: '#86efac',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkIcon: { fontSize: 22, fontWeight: '900', color: '#166534' },
  overlayTitle: { fontSize: 16, fontWeight: '800', color: '#0f172a', marginTop: 2 },
  overlaySubtitle: { fontSize: 13, color: '#475569', marginTop: 6, textAlign: 'center' },
  overlayBtn: {
    marginTop: 14,
    backgroundColor: '#2563eb',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    minWidth: 160,
    alignItems: 'center',
  },
  overlayBtnText: { color: '#fff', fontWeight: '800', fontSize: 13 },
});
