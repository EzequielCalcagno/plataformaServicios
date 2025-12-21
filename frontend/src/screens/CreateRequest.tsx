// src/screens/CreateRequest.tsx
import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';

import { Screen } from '../components/Screen';
import { TopBar } from '../components/TopBar';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { SectionTitle } from '../components/SectionTitle';
import { COLORS, SPACING, RADII } from '../styles/theme';

import { getProfessionalProfileById, ProfessionalPublicProfileResponse } from '../services/profile.client';
import { createReservation } from '../services/reservations.client';

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
    // fallback
    return d.toISOString().slice(0, 16).replace('T', ' ');
  }
}

export default function CreateRequest({ navigation, route }: Props) {
  const profesionalId = route?.params?.profesionalId as string | undefined;

  const [profile, setProfile] = useState<ProfessionalPublicProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const [selectedServiceId, setSelectedServiceId] = useState<number | null>(null);
  const [descripcion, setDescripcion] = useState('');

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showPicker, setShowPicker] = useState(false);

  const services = useMemo(() => profile?.services ?? [], [profile?.services]);

  const fetchProfile = useCallback(async () => {
    if (!profesionalId) {
      setProfile(null);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const p = await getProfessionalProfileById(profesionalId);
console.log('📲 CreateRequest profile:', p);
console.log('📲 CreateRequest services:', p?.services);

      // DEBUG útil
      // console.log('PROFILE', JSON.stringify(p, null, 2));

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

    try {
      await createReservation({
        servicioId: selectedServiceId!,
        profesionalId: profesionalId!,
        descripcionCliente: descripcion.trim() || undefined,
        fechaHoraSolicitada: selectedDate ? selectedDate.toISOString() : null,
      });

      Alert.alert('Solicitud enviada', 'El profesional recibirá tu solicitud.', [
        {
          text: 'OK',
          onPress: () => navigation.navigate('Bookings'),
        },
      ]);
    } catch (e) {
      console.log('❌ CreateRequest submit error', e);
      Alert.alert('Error', 'No se pudo enviar la solicitud.');
    }
  };

  const onPickDate = (_event: any, date?: Date) => {
    // Android: al elegir, se cierra
    if (Platform.OS === 'android') setShowPicker(false);
    if (date) setSelectedDate(date);
  };

  return (
    <Screen>
      <TopBar title="Solicitar servicio" />

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
            </Card>

            <SectionTitle>Servicio</SectionTitle>

            {services.length === 0 ? (
              <Text style={styles.muted}>
                Este profesional todavía no tiene servicios publicados.
              </Text>
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

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => setShowPicker(true)}
            >
              <Card style={styles.dateCard}>
                <Text style={styles.dateText}>
                  {selectedDate ? formatDateTime(selectedDate) : 'Elegir fecha y hora'}
                </Text>
                <Text style={styles.hint}>
                  (Después lo podés negociar si el profesional no puede)
                </Text>
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
              title="Enviar solicitud"
              onPress={handleSubmit}
              disabled={!canSubmit || services.length === 0}
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
});
