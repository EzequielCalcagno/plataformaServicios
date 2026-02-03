// src/screens/Bookings.tsx
import React, { useCallback, useMemo, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  Image,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { Screen } from '../components/Screen';
import { TopBar } from '../components/TopBar';
import { COLORS, SPACING, RADII } from '../styles/theme';

import {
  listMyReservationsMine,
  listMyReservationsPro,
  ReservationListItem,
} from '../services/reservations.client';

import { decodeJwtPayload } from '../utils/jwt';
import { mapRolFromId, Role } from '../utils/roles';

type Props = { navigation: any; route: any };

type RoleUI = 'CLIENTE' | 'PROFESIONAL';
type TabKey = 'PENDIENTES' | 'ACTIVAS' | 'COMPLETADAS';
type ProMailbox = 'RECIBIDAS' | 'HECHAS';

const TAB_LABELS: Record<TabKey, string> = {
  PENDIENTES: 'Pendientes',
  ACTIVAS: 'Activas',
  COMPLETADAS: 'Completadas',
};

function appRoleToRoleUI(Role: string | null | undefined): RoleUI {
  const v = String(Role ?? '').trim().toLowerCase();
  if (v === 'profesional' || v === 'professional' || v === 'pro' || v === '2') return 'PROFESIONAL';
  return 'CLIENTE';
}

function moneyUYU(n?: number | null) {
  if (n == null) return '—';
  try {
    return new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'UYU' }).format(n);
  } catch {
    return `$${n}`;
  }
}

function formatName(n?: string | null, a?: string | null) {
  return `${n ?? ''} ${a ?? ''}`.trim();
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const a = parts[0]?.[0] ?? '?';
  const b = parts[1]?.[0] ?? '';
  return (a + b).toUpperCase();
}

// Ajustá acá si tus estados reales cambian
function statusUI(estado?: string | null) {
  const e = String(estado ?? '').toUpperCase();

  // tonos
  // - pending: amarillo
  // - active: azul
  // - done/closed: verde
  if (e === 'PENDIENTE' || e === 'WAITING') {
    return { label: 'Pendiente', tone: 'warn' as const, icon: 'time-outline' as const };
  }
  if (e === 'ACTIVA' || e === 'ACTIVE' || e === 'EN_NEGOCIACION') {
    return { label: e === 'EN_NEGOCIACION' ? 'En negociación' : 'Activa', tone: 'primary' as const, icon: 'flash-outline' as const };
  }
  if (e === 'COMPLETADA' || e === 'DONE' || e === 'CERRADO' || e === 'FINALIZADO') {
    return { label: e === 'EN_NEGOCIACION' ? 'En negociación' : 'Completada', tone: 'success' as const, icon: 'checkmark-circle-outline' as const };
  }

  return { label: estado || 'Estado', tone: 'muted' as const, icon: 'information-circle-outline' as const };
}

export default function Bookings({ navigation, route }: Props) {
  const [roleUI, setRoleUI] = useState<RoleUI>('CLIENTE');
  const [proMailbox, setProMailbox] = useState<ProMailbox>('RECIBIDAS');

  const [activeTab, setActiveTab] = useState<TabKey>('PENDIENTES');
  const [items, setItems] = useState<ReservationListItem[]>([]);
  const [loading, setLoading] = useState(true);

  const resolveRole = useCallback(async (): Promise<RoleUI> => {
    const paramRole = route?.params?.role;
    const pr = String(paramRole ?? '').trim().toLowerCase();
    if (pr === 'professional' || pr === 'profesional' || pr === 'pro') return 'PROFESIONAL';
    if (pr === 'client' || pr === 'cliente') return 'CLIENTE';

    const storedRole = await AsyncStorage.getItem('@role');
    if (storedRole) return appRoleToRoleUI(storedRole);

    const token = await AsyncStorage.getItem('@token');
    if (token) {
      const decoded = decodeJwtPayload(token);
      const role: Role = mapRolFromId(decoded?.rolId);
      return appRoleToRoleUI(role);
    }

    return 'CLIENTE';
  }, [route?.params?.role]);

  const headerTitle = useMemo(() => {
    if (roleUI === 'CLIENTE') return 'Mis solicitudes';
    return 'Mis trabajos';
  }, [roleUI]);

  const headerSubtitle = useMemo(() => {
    if (roleUI === 'CLIENTE') return 'Solicitudes que hiciste';
    return proMailbox === 'RECIBIDAS' ? 'Solicitudes que te llegaron' : 'Solicitudes que hiciste';
  }, [roleUI, proMailbox]);

  const onChangeTab = (tab: TabKey) => setActiveTab(tab);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      const r = await resolveRole();
      setRoleUI(r);

      let list: ReservationListItem[] = [];

      if (r === 'CLIENTE') {
        const tab =
          activeTab === 'PENDIENTES' ? 'waiting' : activeTab === 'ACTIVAS' ? 'active' : 'done';
        list = await listMyReservationsMine(tab);
      } else {
        if (proMailbox === 'RECIBIDAS') {
          const tab =
            activeTab === 'PENDIENTES' ? 'pending' : activeTab === 'ACTIVAS' ? 'active' : 'done';
          list = await listMyReservationsPro(tab);
        } else {
          const tab =
            activeTab === 'PENDIENTES' ? 'waiting' : activeTab === 'ACTIVAS' ? 'active' : 'done';
          list = await listMyReservationsMine(tab);
        }
      }

      setItems(Array.isArray(list) ? list : []);
    } catch (e) {
      console.log('❌ Bookings fetch error', e);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [resolveRole, activeTab, proMailbox]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData]),
  );

  const renderItem = ({ item }: { item: ReservationListItem }) => {
    const isReceived = roleUI === 'PROFESIONAL' && proMailbox === 'RECIBIDAS';

    const otherName =
      isReceived
        ? formatName(item.clienteNombre, item.clienteApellido) || item.clienteId
        : formatName(item.profesionalNombre, item.profesionalApellido) || item.profesionalId;

    const otherPhoto = isReceived ? item.clienteFotoUrl : item.profesionalFotoUrl;

    const isMyAction =
      !!item.accionRequeridaPor &&
      item.accionRequeridaPor === (isReceived ? 'PROFESIONAL' : 'CLIENTE');

    const s = statusUI(item.estado);
    const price = (item as any).servicioPrecioBase ?? null;

    return (
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() =>
          navigation.navigate('ReservationDetail', {
            reservationId: item.id,
            roleUI,
            mailbox: proMailbox,
          })
        }
        style={styles.rowCard}
      >
        {/* Avatar */}
        <View style={styles.avatarWrap}>
          {otherPhoto ? (
            <Image source={{ uri: otherPhoto }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Text style={styles.avatarInitial}>{initials(otherName || 'U')}</Text>
            </View>
          )}
          {isMyAction ? <View style={styles.actionDot} /> : null}
        </View>

        {/* Content */}
        <View style={{ flex: 1 }}>
          <View style={styles.titleRow}>
            <Text style={styles.rowTitle} numberOfLines={1}>
              {item.servicioTitulo ?? `Servicio #${item.servicioId}`}
            </Text>

            <View
              style={[
                styles.statusChip,
                s.tone === 'warn'
                  ? styles.chipWarn
                  : s.tone === 'success'
                    ? styles.chipSuccess
                    : s.tone === 'primary'
                      ? styles.chipPrimary
                      : styles.chipMuted,
              ]}
            >
              <Ionicons
                name={s.icon}
                size={12}
                color={
                  s.tone === 'warn'
                    ? '#92400e'
                    : s.tone === 'success'
                      ? '#166534'
                      : s.tone === 'primary'
                        ? '#1d4ed8'
                        : COLORS.textMuted
                }
              />
              <Text
                style={[
                  styles.statusChipText,
                  s.tone === 'warn'
                    ? styles.chipTextWarn
                    : s.tone === 'success'
                      ? styles.chipTextSuccess
                      : s.tone === 'primary'
                        ? styles.chipTextPrimary
                        : styles.chipTextMuted,
                ]}
                numberOfLines={1}
              >
                {s.label}
              </Text>
            </View>
          </View>

          <Text style={styles.rowSub} numberOfLines={1}>
            {otherName} · {item.servicioCategoria ?? '—'}
          </Text>

          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Ionicons name="cash-outline" size={14} color={COLORS.textMuted} />
              <Text style={styles.metaText}>{moneyUYU(price)}</Text>
            </View>

            <View style={styles.metaItem}>
              <Ionicons name="chevron-forward" size={14} color={COLORS.textMuted} />
              <Text style={styles.metaText}>Ver detalle</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const EmptyState = () => (
    <View style={styles.empty}>
      <View style={styles.emptyIcon}>
        <Ionicons name="calendar-outline" size={18} color={COLORS.textMuted} />
      </View>
      <Text style={styles.emptyTitle}>
        {loading ? 'Cargando…' : 'No hay reservas en esta pestaña.'}
      </Text>
      <Text style={styles.emptyText}>
        {roleUI === 'CLIENTE'
          ? 'Probá buscar profesionales y crear una solicitud.'
          : 'Cuando te llegue una solicitud, va a aparecer acá.'}
      </Text>

      {roleUI === 'CLIENTE' && !loading ? (
        <TouchableOpacity
          activeOpacity={0.9}
          style={styles.emptyCta}
          onPress={() => navigation.navigate('Search')}
        >
          <Text style={styles.emptyCtaText}>Buscar profesionales</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );

  return (
    <Screen>
      <TopBar title={headerTitle} showBack onPressBack={() => navigation.goBack()} rightNode={null} />

      {/* Subheader simple */}
      <View style={styles.header}>
        <Text style={styles.headerSubtitle}>{headerSubtitle}</Text>
      </View>

      {/* Mailbox (solo profesional) */}
      {roleUI === 'PROFESIONAL' && (
        <View style={styles.mailboxRow}>
          {(['RECIBIDAS', 'HECHAS'] as ProMailbox[]).map((k) => {
            const active = k === proMailbox;
            return (
              <TouchableOpacity
                key={k}
                style={[styles.mailboxBtn, active ? styles.mailboxBtnActive : null]}
                onPress={() => setProMailbox(k)}
                activeOpacity={0.9}
              >
                <Text style={[styles.mailboxText, active ? styles.mailboxTextActive : null]}>
                  {k === 'RECIBIDAS' ? 'Recibidas' : 'Hechas'}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* Tabs */}
      <View style={styles.tabs}>
        {(Object.keys(TAB_LABELS) as TabKey[]).map((t) => {
          const active = t === activeTab;
          return (
            <TouchableOpacity
              key={t}
              style={styles.tabBtn}
              onPress={() => onChangeTab(t)}
              activeOpacity={0.9}
            >
              <Text style={[styles.tabText, active ? styles.tabTextActive : null]}>{TAB_LABELS[t]}</Text>
              <View style={[styles.tabUnderline, active ? styles.tabUnderlineOn : styles.tabUnderlineOff]} />
            </TouchableOpacity>
          );
        })}
      </View>

      <FlatList
        data={items}
        keyExtractor={(it) => String(it.id)}
        contentContainerStyle={{ padding: SPACING.lg, paddingTop: SPACING.md, paddingBottom: SPACING.xl }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchData} />}
        ListEmptyComponent={<EmptyState />}
        renderItem={renderItem}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  headerSubtitle: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: '700',
  },

  mailboxRow: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    gap: 8,
    paddingBottom: SPACING.sm,
  },
  mailboxBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: RADII.pill,
    backgroundColor: COLORS.graySoft,
    alignItems: 'center',
  },
  mailboxBtnActive: { backgroundColor: '#111827' },
  mailboxText: { fontSize: 12, fontWeight: '800', color: COLORS.text },
  mailboxTextActive: { color: '#fff' },

  tabs: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    gap: 18,
    paddingBottom: SPACING.sm,
    paddingTop: 2,
  },
  tabBtn: { paddingVertical: 6 },
  tabText: { fontSize: 12, fontWeight: '800', color: COLORS.textMuted },
  tabTextActive: { color: COLORS.text },
  tabUnderline: { marginTop: 6, height: 2, borderRadius: 2 },
  tabUnderlineOn: { backgroundColor: COLORS.primaryBrilliant ?? '#16a34a' },
  tabUnderlineOff: { backgroundColor: 'transparent' },

  rowCard: {
    flexDirection: 'row',
    gap: 12,
    padding: 12,
    borderRadius: 16,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 12,
  },

  avatarWrap: { width: 44, height: 44 },
  avatar: { width: 44, height: 44, borderRadius: 22 },
  avatarPlaceholder: {
    backgroundColor: COLORS.bgLightGrey,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: { fontSize: 12, fontWeight: '900', color: COLORS.textMuted },

  actionDot: {
    position: 'absolute',
    right: -2,
    top: -2,
    width: 10,
    height: 10,
    borderRadius: 999,
    backgroundColor: '#ef4444',
    borderWidth: 2,
    borderColor: '#fff',
  },

  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rowTitle: { fontSize: 13, fontWeight: '900', color: COLORS.text, flex: 1 },

  rowSub: { marginTop: 4, fontSize: 12, color: COLORS.textMuted, fontWeight: '700' },

  metaRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
    alignItems: 'center',
  },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { fontSize: 12, color: COLORS.textMuted, fontWeight: '700' },

  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  statusChipText: { fontSize: 11, fontWeight: '800' },

  chipWarn: { backgroundColor: '#fffbeb' },
  chipTextWarn: { color: '#92400e' },

  chipSuccess: { backgroundColor: '#ecfdf5' },
  chipTextSuccess: { color: '#166534' },

  chipPrimary: { backgroundColor: '#eff6ff' },
  chipTextPrimary: { color: '#1d4ed8' },

  chipMuted: { backgroundColor: '#f3f4f6' },
  chipTextMuted: { color: COLORS.textMuted },

  empty: {
    padding: SPACING.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  emptyIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: COLORS.bgLightGrey,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  emptyTitle: { fontSize: 13, fontWeight: '900', color: COLORS.text, marginBottom: 4 },
  emptyText: { fontSize: 12, color: COLORS.textMuted, fontWeight: '700', textAlign: 'center' },

  emptyCta: {
    marginTop: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: '#111827',
  },
  emptyCtaText: { color: '#fff', fontWeight: '900', fontSize: 12 },
});
