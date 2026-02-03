// src/screens/Home.tsx
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

import { getCurrentUser, UserResponse } from '../services/user.client';
import { ApiError } from '../utils/http';
import { mapRolFromId } from '../utils/roles';

import {
  ReservationListItem,
  listMyReservationsMine,
  listMyReservationsPro,
} from '../services/reservations.client';

import { Screen } from '../components/Screen';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { SectionTitle } from '../components/SectionTitle';
import { COLORS, SPACING, RADII } from '../styles/theme';
import { Loading } from './Loading';
import { Error } from './Error';

type PendingItem = {
  key: string;
  title: string;
  subtitle?: string;
  icon: keyof typeof Ionicons.glyphMap;
  tone?: 'primary' | 'warn' | 'muted';
  reservationId: number;
};

function firstWord(s?: string | null) {
  const t = (s ?? '').trim();
  if (!t) return '';
  return t.split(' ')[0] ?? '';
}


function buildPendingItems(
  all: ReservationListItem[],
  mySide: 'CLIENTE' | 'PROFESIONAL',
): PendingItem[] {
  const map = new Map<number, ReservationListItem>();
  all.forEach((r) => map.set(r.id, r));
  const list = Array.from(map.values());

  const mineRated = (r: ReservationListItem) => {
    if (mySide === 'CLIENTE') return !!r.clienteCalifico;
    return !!r.profesionalCalifico;
  };

  const otherFirst = (r: ReservationListItem) => {
    if (mySide === 'PROFESIONAL') return firstWord(r.clienteNombre) || 'Cliente';
    return firstWord(r.profesionalNombre) || 'Profesional';
  };

  const serviceTitle = (r: ReservationListItem) => r.servicioTitulo ?? 'Servicio';

  const items: PendingItem[] = [];

  for (const r of list) {
    // 1) Calificación pendiente
    if (r.estado === 'CERRADO' && !mineRated(r)) {
      items.push({
        key: `rate_${r.id}`,
        title: `Calificar a ${otherFirst(r)}`,
        subtitle: serviceTitle(r),
        icon: 'star-outline',
        tone: 'primary',
        reservationId: r.id,
      });
      continue;
    }

    // 2) Confirmar finalización pendiente
    if (r.estado === 'FINALIZADO') {
      const accion = r.accionRequeridaPor ?? null;
      if (accion && accion === mySide) {
        items.push({
          key: `finish_${r.id}`,
          title: `Confirmar finalización con ${otherFirst(r)}`,
          subtitle: serviceTitle(r),
          icon: 'checkmark-done-outline',
          tone: 'warn',
          reservationId: r.id,
        });
        continue;
      }
    }

    // 3) Profesional: nueva solicitud
    if (mySide === 'PROFESIONAL' && r.estado === 'PENDIENTE') {
      items.push({
        key: `new_${r.id}`,
        title: `${otherFirst(r)} solicitó tu servicio`,
        subtitle: serviceTitle(r),
        icon: 'notifications-outline',
        tone: 'primary',
        reservationId: r.id,
      });
      continue;
    }

    // 4) Cliente: propuesta/negociación para responder (si hay propuesta o si el backend marca que te toca)
    if (mySide === 'CLIENTE' && r.estado === 'EN_NEGOCIACION') {
      const hasProposal = !!r.fechaHoraPropuesta;
      const isForMe = (r.accionRequeridaPor ?? null) === 'CLIENTE';
      if (hasProposal || isForMe) {
        items.push({
          key: `proposal_${r.id}`,
          title: `Tenés una propuesta de ${otherFirst(r)}`,
          subtitle: serviceTitle(r),
          icon: 'chatbubble-ellipses-outline',
          tone: 'primary',
          reservationId: r.id,
        });
        continue;
      }
    }
  }

  const weight = (t?: PendingItem['tone']) => (t === 'warn' ? 0 : t === 'primary' ? 1 : 2);
  items.sort((a, b) => weight(a.tone) - weight(b.tone));
  return items.slice(0, 6);
}

export default function Home() {
  const navigation = useNavigation<any>();
  const [profile, setProfile] = useState<UserResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const [pendingLoading, setPendingLoading] = useState(false);
  const [pendingItems, setPendingItems] = useState<PendingItem[]>([]);

  const isProfessional = mapRolFromId(profile?.id_rol) === 'professional';
  const firstName = profile?.nombre ? profile.nombre.split(' ')[0] : 'User';

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const data = await getCurrentUser();
        setProfile(data);
      } catch (err) {
        console.error('Error cargando perfil en Home:', err);
        if (err instanceof ApiError && err.status === 401) {
          await AsyncStorage.removeItem('authToken');
          navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
        }
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, [navigation]);

  // ✅ NUEVO: función reusable para recargar pendientes
  const loadPending = useCallback(async () => {
    if (!profile) return;
    try {
      setPendingLoading(true);

      if (isProfessional) {
        const [pending, active, done] = await Promise.all([
          listMyReservationsPro('pending'),
          listMyReservationsPro('active'),
          listMyReservationsPro('done'),
        ]);
        setPendingItems(buildPendingItems([...pending, ...active, ...done], 'PROFESIONAL'));
      } else {
        const [waiting, active, done] = await Promise.all([
          listMyReservationsMine('waiting'),
          listMyReservationsMine('active'),
          listMyReservationsMine('done'),
        ]);
        setPendingItems(buildPendingItems([...waiting, ...active, ...done], 'CLIENTE'));
      }
    } catch (e) {
      console.log('❌ loadPending error', e);
      setPendingItems([]);
    } finally {
      setPendingLoading(false);
    }
  }, [profile, isProfessional]);

  // ✅ NUEVO: refresca AL VOLVER al Home
  useFocusEffect(
    useCallback(() => {
      loadPending();

      // ✅ opcional: refresco automático cada 15s mientras estás en Home
      const t = setInterval(() => {
        loadPending();
      }, 15000);

      return () => clearInterval(t);
    }, [loadPending]),
  );

  if (loading) return <Loading message="Cargando..." />;

  if (!profile) {
    return (
      <Error
        title="No se pudo cargar tu información."
        message="Volver a iniciar sesión para continuar."
        actionLabel="Reintentar"
        onAction={() => navigation.reset({ index: 0, routes: [{ name: 'Login' }] })}
      />
    );
  }

  return (
    <Screen>
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        <Card style={styles.heroCard} withShadow>
          <Text style={styles.heroTitle}>
            Hola {firstName} 👋{'\n'}¿Qué necesitas arreglar hoy?
          </Text>
          <Text style={styles.heroSubtitle}>Reserva hoy con un profesional!</Text>

          <Button
            title={isProfessional ? 'Ver solicitudes' : 'Ver profesionales disponibles'}
            onPress={() => {
              if (isProfessional) navigation.navigate('Bookings');
              else navigation.navigate('Search');
            }}
            style={styles.heroButton}
          />
        </Card>

        <SectionTitle>Pendientes</SectionTitle>

        {pendingLoading ? (
          <Card style={styles.pendingCard}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <ActivityIndicator />
              <Text style={styles.pendingMuted}>Buscando acciones pendientes…</Text>
            </View>
          </Card>
        ) : pendingItems.length === 0 ? (
          <Card style={styles.pendingCard}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Ionicons name="checkmark-circle-outline" size={18} color={COLORS.textMuted} />
              <Text style={styles.pendingMuted}>No tenés acciones pendientes 🎉</Text>
            </View>
          </Card>
        ) : (
          <Card style={styles.pendingCard}>
            {pendingItems.map((p, idx) => (
              <TouchableOpacity
                key={p.key}
                activeOpacity={0.85}
                onPress={() => navigation.navigate('ReservationDetail', { reservationId: p.reservationId })}
                style={[styles.pendingRow, idx > 0 ? styles.pendingRowBorder : null]}
              >
                <View
                  style={[
                    styles.pendingIconWrap,
                    p.tone === 'warn' ? styles.iconWarn : p.tone === 'muted' ? styles.iconMuted : styles.iconPrimary,
                  ]}
                >
                  <Ionicons name={p.icon} size={18} color={COLORS.text} />
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.pendingTitle}>{p.title}</Text>
                  {!!p.subtitle && <Text style={styles.pendingSub}>{p.subtitle}</Text>}
                </View>

                <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
              </TouchableOpacity>
            ))}
          </Card>
        )}

        <SectionTitle>{isProfessional ? 'Tu panel' : '¿Qué querés hacer hoy?'}</SectionTitle>

        {isProfessional && (
          <>
            <SectionTitle>Resumen rápido</SectionTitle>
            <View style={styles.summaryRow}>
              <Card style={styles.summaryCard}>
                <Text style={styles.summaryLabel}>Trabajos completados</Text>
              </Card>
              <Card style={styles.summaryCard}>
                <Text style={styles.summaryLabel}>Rating</Text>
              </Card>
            </View>
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.xl * 2,
  },

  heroCard: {
    borderRadius: RADII.lg,
    marginBottom: SPACING.xl,
    backgroundColor: '#111827',
  },
  heroTitle: { color: 'white', fontSize: 22, fontWeight: '700', marginBottom: 8 },
  heroSubtitle: { color: '#E5E7EB', fontSize: 13, marginBottom: 16 },
  heroButton: { alignSelf: 'flex-start', marginTop: 4 },

  pendingCard: { marginTop: SPACING.sm, marginBottom: SPACING.xl, borderRadius: RADII.lg },
  pendingMuted: { color: COLORS.textMuted, fontSize: 12, fontWeight: '700' },
  pendingRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  pendingRowBorder: { borderTopWidth: 1, borderTopColor: COLORS.border },

  pendingIconWrap: { width: 34, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  iconPrimary: { backgroundColor: '#eef2ff' },
  iconWarn: { backgroundColor: '#fffbeb' },
  iconMuted: { backgroundColor: '#f3f4f6' },

  pendingTitle: { fontSize: 13, fontWeight: '900', color: COLORS.text },
  pendingSub: { marginTop: 2, fontSize: 12, color: COLORS.textMuted, fontWeight: '700' },

  summaryRow: { flexDirection: 'row', gap: 12, marginBottom: 32, marginTop: SPACING.sm },
  summaryCard: { flex: 1, borderRadius: RADII.lg, paddingVertical: 16, paddingHorizontal: 12 },
  summaryLabel: { fontSize: 12, color: COLORS.textMuted },
});
