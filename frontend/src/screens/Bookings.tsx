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

import { AppScreen } from '../components/AppScreen';
import { TopBar } from '../components/TopBar';
import { COLORS, SPACING, RADII } from '../styles/theme';

import {
  listMyReservationsMine,
  listMyReservationsPro,
  ReservationListItem,
} from '../services/reservations.client';

import { decodeJwtPayload } from '../utils/jwt';
import { mapRolFromId, AppRole } from '../utils/roles';

type Props = { navigation: any; route: any };

type RoleUI = 'CLIENTE' | 'PROFESIONAL';
type TabKey = 'PENDIENTES' | 'ACTIVAS' | 'COMPLETADAS';
type ProMailbox = 'RECIBIDAS' | 'HECHAS';

const TAB_LABELS: Record<TabKey, string> = {
  PENDIENTES: 'Pendientes',
  ACTIVAS: 'Activas',
  COMPLETADAS: 'Completadas',
};

function appRoleToRoleUI(appRole: string | null | undefined): RoleUI {
  const v = String(appRole ?? '').trim().toLowerCase();
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
    const byStorage = appRoleToRoleUI(storedRole);
    if (storedRole) return byStorage;

    const token = await AsyncStorage.getItem('@token');
    if (token) {
      const decoded = decodeJwtPayload(token);
      const appRole: AppRole = mapRolFromId(decoded?.rolId);
      return appRoleToRoleUI(appRole);
    }

    return 'CLIENTE';
  }, [route?.params?.role]);

  const onChangeTab = (tab: TabKey) => setActiveTab(tab);

  const headerTitle = useMemo(() => {
    if (roleUI === 'CLIENTE') return 'Mis solicitudes';
    return 'Mis trabajos';
  }, [roleUI]);

  const headerSubtitle = useMemo(() => {
    if (roleUI === 'CLIENTE') return 'Solicitudes que hiciste';
    return proMailbox === 'RECIBIDAS' ? 'Solicitudes que te llegaron' : 'Solicitudes que hiciste';
  }, [roleUI, proMailbox]);

  const formatName = (n?: string | null, a?: string | null) => `${n ?? ''} ${a ?? ''}`.trim();

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      const r = await resolveRole();
      setRoleUI(r);

      let list: ReservationListItem[] = [];

      if (r === 'CLIENTE') {
        const tab = activeTab === 'PENDIENTES' ? 'waiting' : activeTab === 'ACTIVAS' ? 'active' : 'done';
        list = await listMyReservationsMine(tab);
      } else {
        if (proMailbox === 'RECIBIDAS') {
          const tab = activeTab === 'PENDIENTES' ? 'pending' : activeTab === 'ACTIVAS' ? 'active' : 'done';
          list = await listMyReservationsPro(tab);
        } else {
          const tab = activeTab === 'PENDIENTES' ? 'waiting' : activeTab === 'ACTIVAS' ? 'active' : 'done';
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

    const otherName = isReceived
      ? formatName(item.clienteNombre, item.clienteApellido) || item.clienteId
      : formatName(item.profesionalNombre, item.profesionalApellido) || item.profesionalId;

    const otherPhoto = isReceived ? item.clienteFotoUrl : item.profesionalFotoUrl;

    const isMyAction =
      !!item.accionRequeridaPor &&
      item.accionRequeridaPor === (isReceived ? 'PROFESIONAL' : 'CLIENTE');

    // ✅ precio base del servicio (nuevo)
    const price = (item as any).servicioPrecioBase ?? null;

    return (
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() =>
          navigation.navigate('ReservationDetail', {
            reservationId: item.id,
            roleUI,
            mailbox: proMailbox,
          })
        }
        style={styles.rowCard}
      >
        {/* left: icon */}
        <View style={styles.leftIcon}>
          <Ionicons name="hammer-outline" size={18} color={COLORS.text} />
        </View>

        {/* middle */}
        <View style={{ flex: 1 }}>
          <View style={styles.titleRow}>
            <Text style={styles.rowTitle} numberOfLines={1}>
              {item.servicioTitulo ?? `Servicio #${item.servicioId}`}
            </Text>
            {isMyAction ? <View style={styles.badgeDot} /> : null}
          </View>

          <Text style={styles.rowSub} numberOfLines={1}>
            {item.servicioCategoria ?? '—'} · {item.estado}
          </Text>

          <Text style={styles.rowTiny} numberOfLines={1}>
            {otherName}
          </Text>
        </View>

        {/* right */}
        <View style={styles.rightCol}>
          {otherPhoto ? (
            <Image source={{ uri: otherPhoto }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Text style={styles.avatarInitial}>{(otherName?.[0] ?? '?').toUpperCase()}</Text>
            </View>
          )}

          <Text style={styles.price}>{moneyUYU(price)}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <AppScreen>
      <TopBar title="Bookings" rightNode={null} />

      {/* Header like ref */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>{headerTitle}</Text>
          <Text style={styles.headerSubtitle}>{headerSubtitle}</Text>
        </View>

        <TouchableOpacity activeOpacity={0.85} style={styles.filterBtn}>
          <Ionicons name="options-outline" size={18} color={COLORS.textMuted} />
        </TouchableOpacity>
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
                activeOpacity={0.85}
              >
                <Text style={[styles.mailboxText, active ? styles.mailboxTextActive : null]}>
                  {k === 'RECIBIDAS' ? 'Recibidas' : 'Hechas'}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* Tabs like ref (inline) */}
      <View style={styles.tabs}>
        {(Object.keys(TAB_LABELS) as TabKey[]).map((t) => {
          const active = t === activeTab;
          return (
            <TouchableOpacity
              key={t}
              style={styles.tabBtn}
              onPress={() => onChangeTab(t)}
              activeOpacity={0.85}
            >
              <Text style={[styles.tabText, active ? styles.tabTextActive : null]}>
                {TAB_LABELS[t]}
              </Text>
              {active ? <View style={styles.tabUnderline} /> : <View style={styles.tabUnderlineOff} />}
            </TouchableOpacity>
          );
        })}
      </View>

      <FlatList
        data={items}
        keyExtractor={(it) => String(it.id)}
        contentContainerStyle={{ padding: SPACING.lg, paddingTop: SPACING.md }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchData} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>
              {loading ? 'Cargando…' : 'No hay reservas en esta pestaña todavía.'}
            </Text>
          </View>
        }
        renderItem={renderItem}
      />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.text,
  },
  headerSubtitle: {
    marginTop: 2,
    fontSize: 12,
    color: COLORS.textMuted,
  },
  filterBtn: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f3f4f6',
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

  // ✅ tabs inline
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
  tabUnderline: {
    marginTop: 6,
    height: 2,
    borderRadius: 2,
    backgroundColor: '#16a34a',
  },
  tabUnderlineOff: {
    marginTop: 6,
    height: 2,
    borderRadius: 2,
    backgroundColor: 'transparent',
  },

  // ✅ row like ref
  rowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 16,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 12,
  },
  leftIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#eef2ff',
    alignItems: 'center',
    justifyContent: 'center',
  },

  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rowTitle: { fontSize: 13, fontWeight: '900', color: COLORS.text, flex: 1 },
  rowSub: { marginTop: 2, fontSize: 11, color: COLORS.textMuted, fontWeight: '800' },
  rowTiny: { marginTop: 2, fontSize: 11, color: COLORS.textMuted },

  rightCol: { alignItems: 'flex-end', gap: 6, width: 96 },
  avatar: { width: 28, height: 28, borderRadius: 14 },
  avatarPlaceholder: {
    backgroundColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: { fontSize: 12, fontWeight: '900', color: COLORS.text },

  price: { fontSize: 12, fontWeight: '900', color: COLORS.text },

  badgeDot: { width: 10, height: 10, borderRadius: 999, backgroundColor: '#ef4444' },

  empty: { padding: SPACING.lg, alignItems: 'center' },
  emptyText: { color: COLORS.textMuted },
});
