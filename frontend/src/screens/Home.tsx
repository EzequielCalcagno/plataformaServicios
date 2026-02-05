// src/screens/Home.tsx
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
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

    // 4) Cliente: propuesta/negociación
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
  const firstName = profile?.nombre ? firstWord(profile.nombre) : 'User';

  const [refreshing, setRefreshing] = useState(false);

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

  useFocusEffect(
    useCallback(() => {
      loadPending();
      const t = setInterval(() => {
        loadPending();
      }, 15000);
      return () => clearInterval(t);
    }, [loadPending]),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadPending();
    } finally {
      setRefreshing(false);
    }
  }, [loadPending]);

  const ctaTitle = isProfessional ? 'Ver solicitudes' : 'Buscar profesionales';
  const ctaSubtitle = isProfessional
    ? 'Gestioná solicitudes y trabajos activos.'
    : 'Explorá servicios cerca de tu ubicación.';

  const goCTA = () => {
    if (isProfessional) navigation.navigate('Solicitudes');
    else navigation.navigate('Buscar');
  };

  const openReservation = (reservationId: number) => {
    navigation.navigate('ReservationDetail', { reservationId });
  };

  const toneBg = (tone?: PendingItem['tone']) => {
    if (tone === 'warn') return { backgroundColor: 'rgba(245,158,11,0.12)' };
    if (tone === 'muted') return { backgroundColor: COLORS.bgLightGrey };
    return { backgroundColor: 'rgba(59,130,246,0.10)' };
  };

  const toneIcon = (tone?: PendingItem['tone']) => {
    if (tone === 'warn') return '#F59E0B';
    if (tone === 'muted') return COLORS.textMuted;
    return COLORS.primaryBrilliant;
  };

  if (loading) return <Loading message="Cargando..." />;

  if (!profile) {
    return (
      <Error
        title="No se pudo cargar tu información."
        message="Volvé a iniciar sesión para continuar."
        actionLabel="Reintentar"
        onAction={() => navigation.reset({ index: 0, routes: [{ name: 'Login' }] })}
      />
    );
  }

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* ===== Header (Airbnb-like) ===== */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.hello}>Hola, {firstName}</Text>
            <Text style={styles.subhello}>
              {isProfessional ? 'Tu panel de trabajo' : 'Encontrá ayuda cerca de vos'}
            </Text>
          </View>
        </View>

        {/* ===== CTA principal ===== */}
        <Card style={styles.heroCard} withShadow>
          <View style={styles.heroRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.heroTitle}>{ctaTitle}</Text>
              <Text style={styles.heroSubtitle}>{ctaSubtitle}</Text>
            </View>

            <View style={styles.heroBadge}>
              <Ionicons
                name={isProfessional ? 'briefcase-outline' : 'map-outline'}
                size={18}
                color={COLORS.primaryBrilliant}
              />
            </View>
          </View>

          <Button title={ctaTitle} onPress={goCTA} style={{ marginTop: 10 }} />
        </Card>

        {/* ===== Acciones rápidas ===== */}
        <View style={styles.quickGrid}>
          {!isProfessional ? (
            <>
              <TouchableOpacity
                activeOpacity={0.9}
                style={styles.quickTile}
                onPress={() => navigation.navigate('Buscar')}
              >
                <View style={styles.quickIconWrap}>
                  <Ionicons name="search-outline" size={18} color={COLORS.text} />
                </View>
                <Text style={styles.quickTitle}>Buscar</Text>
                <Text style={styles.quickSub}>Profesionales cerca</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.9}
                style={styles.quickTile}
                onPress={() => navigation.navigate('Solicitudes')}
              >
                <View style={styles.quickIconWrap}>
                  <Ionicons name="calendar-outline" size={18} color={COLORS.text} />
                </View>
                <Text style={styles.quickTitle}>Reservas</Text>
                <Text style={styles.quickSub}>Activas y pasadas</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity
                activeOpacity={0.9}
                style={styles.quickTile}
                onPress={() => navigation.navigate('Solicitudes')}
              >
                <View style={styles.quickIconWrap}>
                  <Ionicons name="notifications-outline" size={18} color={COLORS.text} />
                </View>
                <Text style={styles.quickTitle}>Solicitudes</Text>
                <Text style={styles.quickSub}>Pendientes y activas</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.9}
                style={styles.quickTile}
                onPress={() => navigation.navigate('AddService')}
              >
                <View style={styles.quickIconWrap}>
                  <Ionicons name="add-circle-outline" size={18} color={COLORS.text} />
                </View>
                <Text style={styles.quickTitle}>Servicio</Text>
                <Text style={styles.quickSub}>Agregar nuevo</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* ===== Pendientes ===== */}
        <View style={{ marginTop: 8 }}>
          <SectionTitle>Pendientes</SectionTitle>

          {pendingLoading ? (
            <Card style={styles.pendingCard}>
              <View style={styles.pendingLoadingRow}>
                <ActivityIndicator />
                <Text style={styles.pendingMuted}>Buscando acciones pendientes…</Text>
              </View>
            </Card>
          ) : pendingItems.length === 0 ? (
            <Card style={styles.pendingCard}>
              <View style={styles.pendingLoadingRow}>
                <Ionicons name="checkmark-circle-outline" size={18} color={COLORS.textMuted} />
                <Text style={styles.pendingMuted}>No tenés acciones pendientes</Text>
              </View>
            </Card>
          ) : (
            <Card style={styles.pendingCard} withShadow>
              {pendingItems.map((p, idx) => (
                <TouchableOpacity
                  key={p.key}
                  activeOpacity={0.85}
                  onPress={() => openReservation(p.reservationId)}
                  style={[styles.pendingRow, idx > 0 ? styles.pendingRowBorder : null]}
                >
                  <View style={[styles.pendingIconWrap, toneBg(p.tone)]}>
                    <Ionicons name={p.icon} size={18} color={toneIcon(p.tone)} />
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
        </View>

        {/* ===== Profesional: resumen (placeholder serio) ===== */}
        {isProfessional && (
          <View style={{ marginTop: 10 }}>
            <SectionTitle>Resumen rápido</SectionTitle>

            <View style={styles.summaryRow}>
              <Card style={styles.summaryCard}>
                <Text style={styles.summaryLabel}>Trabajos completados</Text>
                <Text style={styles.summaryValue}>—</Text>
                <Text style={styles.summaryHint}>Próximamente</Text>
              </Card>

              <Card style={styles.summaryCard}>
                <Text style={styles.summaryLabel}>Rating</Text>
                <Text style={styles.summaryValue}>—</Text>
                <Text style={styles.summaryHint}>Próximamente</Text>
              </Card>
            </View>
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: SPACING.lg,
    paddingTop: 10,
    paddingBottom: SPACING.xl * 2,
  },

  /* Header */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  hello: { fontSize: 22, fontWeight: '700', color: COLORS.text },
  subhello: { marginTop: 2, fontSize: 13, fontWeight: '600', color: COLORS.textMuted },
  iconBtn: {
    padding: 10,
    borderRadius: 999,
    backgroundColor: COLORS.bgLightGrey,
  },

  /* Hero card */
  heroCard: {
    borderRadius: RADII.lg,
    paddingVertical: 16,
    paddingHorizontal: 14,
    marginBottom: SPACING.lg,
  },
  heroRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  heroTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  heroSubtitle: { marginTop: 4, fontSize: 13, fontWeight: '600', color: COLORS.textMuted },
  heroBadge: {
    width: 42,
    height: 42,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.bgLightGrey,
  },

  /* Quick actions */
  quickGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 6,
  },
  quickTile: {
    flex: 1,
    borderRadius: RADII.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.cardBg,
  },
  quickIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: COLORS.bgLightGrey,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  quickTitle: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  quickSub: { marginTop: 2, fontSize: 12, fontWeight: '600', color: COLORS.textMuted },

  /* Pending */
  pendingCard: {
    marginTop: SPACING.sm,
    marginBottom: SPACING.lg,
    borderRadius: RADII.lg,
    paddingVertical: 4,
  },
  pendingLoadingRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12 },
  pendingMuted: { color: COLORS.textMuted, fontSize: 12, fontWeight: '600' },

  pendingRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  pendingRowBorder: { borderTopWidth: 1, borderTopColor: COLORS.border },

  pendingIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pendingTitle: { fontSize: 13, fontWeight: '700', color: COLORS.text },
  pendingSub: { marginTop: 2, fontSize: 12, color: COLORS.textMuted, fontWeight: '600' },

  /* Summary */
  summaryRow: { flexDirection: 'row', gap: 12, marginTop: SPACING.sm, marginBottom: 16 },
  summaryCard: { flex: 1, borderRadius: RADII.lg, paddingVertical: 16, paddingHorizontal: 12 },
  summaryLabel: { fontSize: 12, fontWeight: '600', color: COLORS.textMuted },
  summaryValue: { marginTop: 6, fontSize: 18, fontWeight: '700', color: COLORS.text },
  summaryHint: { marginTop: 2, fontSize: 12, fontWeight: '600', color: COLORS.textMuted },
});
