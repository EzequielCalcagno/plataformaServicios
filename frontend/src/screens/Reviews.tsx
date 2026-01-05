// src/screens/Reviews.tsx
import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { Screen } from '../components/Screen';
import { TopBar } from '../components/TopBar';
import { Card } from '../components/Card';
import { COLORS, SPACING, RADII } from '../styles/theme';

import {
  listProfessionalReviews,
  ProfessionalReviewItem,
  ReviewSort,
  ReviewRatingFilter,
} from '../services/reviews.client';

type Props = { navigation: any; route: any };

const SORTS: { key: ReviewSort; label: string; icon: any }[] = [
  { key: 'recent', label: 'Más recientes', icon: 'time-outline' },
  { key: 'best', label: 'Mejores', icon: 'thumbs-up-outline' },
  { key: 'worst', label: 'Peores', icon: 'thumbs-down-outline' },
];

const STAR_FILTERS: { key: ReviewRatingFilter; label: string }[] = [
  { key: 0, label: 'Todas' },
  { key: 5, label: '5' },
  { key: 4, label: '4' },
  { key: 3, label: '3' },
  { key: 2, label: '2' },
  { key: 1, label: '1' },
];

function fmtTimeAgo(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `Hace ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `Hace ${hrs} h`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `Hace ${days} d`;
  const months = Math.floor(days / 30);
  if (months < 12) return `Hace ${months} mes`;
  const years = Math.floor(months / 12);
  return `Hace ${years} a`;
}

function Stars({ value }: { value: number }) {
  return (
    <View style={styles.starsInline}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Ionicons key={n} name={n <= value ? 'star' : 'star-outline'} size={14} color="#F7B500" />
      ))}
    </View>
  );
}

export default function Reviews({ route }: Props) {
  const profesionalId = String(route?.params?.profesionalId ?? '');
  const professionalName = String(route?.params?.professionalName ?? 'Reviews');

  const [sort, setSort] = useState<ReviewSort>('recent');
  const [ratingFilter, setRatingFilter] = useState<ReviewRatingFilter>(0);

  const [items, setItems] = useState<ProfessionalReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // ✅ Offset y control anti-loop via refs (no dependen del render)
  const nextOffsetRef = useRef<number | null>(0);
  const hasMoreRef = useRef<boolean>(true);
  const isFetchingRef = useRef<boolean>(false);

  const limit = 10;

  const emptyText = useMemo(() => {
    if (ratingFilter === 0) return 'Todavía no hay reseñas.';
    return `No hay reseñas de ${ratingFilter} estrellas.`;
  }, [ratingFilter]);

  const fetchPage = useCallback(
    async (mode: 'initial' | 'refresh' | 'more') => {
      if (!profesionalId) return;

      // ✅ evita dobles requests (focus, endReached, refresh)
      if (isFetchingRef.current) return;
      isFetchingRef.current = true;

      try {
        setErrorMsg(null);

        if (mode === 'initial') {
          setLoading(true);
          nextOffsetRef.current = 0;
          hasMoreRef.current = true;
        }

        if (mode === 'refresh') {
          setRefreshing(true);
          nextOffsetRef.current = 0;
          hasMoreRef.current = true;
        }

        if (mode === 'more') {
          if (loadingMore) return;
          if (!hasMoreRef.current) return;
          if (nextOffsetRef.current == null) return;
          setLoadingMore(true);
        }

        const offsetToUse = mode === 'more' ? (nextOffsetRef.current ?? 0) : 0;

        const res = await listProfessionalReviews(profesionalId, {
          sort,
          rating: ratingFilter,
          limit,
          offset: offsetToUse,
        });

        const newResults = res?.results ?? [];
        const newNextOffset = res?.nextOffset ?? null;

        if (mode === 'more') {
          // ✅ evitar duplicar si el backend devolvió algo raro
          setItems((prev) => {
            const seen = new Set(prev.map((x) => x.id));
            const merged = [...prev];
            for (const r of newResults) {
              if (!seen.has(r.id)) merged.push(r);
            }
            return merged;
          });
        } else {
          setItems(newResults);
        }

        nextOffsetRef.current = newNextOffset;

        // ✅ si no hay nextOffset o no vinieron resultados, cortamos paginación
        hasMoreRef.current = newNextOffset != null && newResults.length > 0;
      } catch (e: any) {
        console.log('❌ Reviews fetch error', e);
        setErrorMsg('No se pudieron cargar las reseñas.');
        if (mode !== 'more') setItems([]);
        nextOffsetRef.current = null;
        hasMoreRef.current = false;
      } finally {
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
        isFetchingRef.current = false;
      }
    },
    [profesionalId, sort, ratingFilter, loadingMore],
  );

  // ✅ 1 sola carga por foco + cada vez que cambian filtros
  useFocusEffect(
    useCallback(() => {
      fetchPage('initial');
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [profesionalId, sort, ratingFilter]),
  );

  // cuando cambia sort o rating -> SOLO setState, la recarga la hace useFocusEffect de arriba
  const onChangeSort = (s: ReviewSort) => {
    if (s === sort) return;
    setSort(s);
  };

  const onChangeRating = (r: ReviewRatingFilter) => {
    if (r === ratingFilter) return;
    setRatingFilter(r);
  };

  const renderItem = ({ item }: { item: ProfessionalReviewItem }) => (
    <Card withShadow style={styles.reviewCard}>
      <View style={styles.reviewHeader}>
        {item.authorPhotoUrl ? (
          <Image source={{ uri: item.authorPhotoUrl }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <Ionicons name="person" size={16} color="#fff" />
          </View>
        )}

        <View style={{ flex: 1 }}>
          <Text style={styles.authorName}>{item.authorName || 'Usuario'}</Text>
          <View style={styles.metaRow}>
            <Stars value={item.rating} />
            <Text style={styles.timeAgo}>{fmtTimeAgo(item.createdAt)}</Text>
          </View>
        </View>

        <View style={styles.badge}>
          <Ionicons name="star" size={14} color="#F7B500" />
          <Text style={styles.badgeText}>{item.rating}</Text>
        </View>
      </View>

      {!!item.comment && <Text style={styles.comment}>{item.comment}</Text>}
      {!item.comment ? <Text style={styles.commentMuted}>Sin comentario.</Text> : null}
    </Card>
  );

  return (
    <Screen>
      <TopBar title={`Reviews · ${professionalName}`} showBack />

      <View style={styles.filtersWrap}>
        {/* Sort pills */}
        <View style={styles.pillsRow}>
          {SORTS.map((s) => {
            const active = s.key === sort;
            return (
              <TouchableOpacity
                key={s.key}
                onPress={() => onChangeSort(s.key)}
                activeOpacity={0.85}
                style={[styles.pill, active ? styles.pillActive : null]}
              >
                <Ionicons name={s.icon} size={14} color={active ? '#111' : COLORS.textMuted} />
                <Text style={[styles.pillText, active ? styles.pillTextActive : null]}>{s.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Rating filter chips */}
        <View style={styles.chipsRow}>
          {STAR_FILTERS.map((f) => {
            const active = f.key === ratingFilter;
            return (
              <TouchableOpacity
                key={f.key}
                onPress={() => onChangeRating(f.key)}
                activeOpacity={0.85}
                style={[styles.chip, active ? styles.chipActive : null]}
              >
                {f.key === 0 ? (
                  <Text style={[styles.chipText, active ? styles.chipTextActive : null]}>{f.label}</Text>
                ) : (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Ionicons name="star" size={14} color="#F7B500" />
                    <Text style={[styles.chipText, active ? styles.chipTextActive : null]}>{f.label}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator />
          <Text style={{ marginTop: 8, color: COLORS.textMuted }}>Cargando reseñas…</Text>
        </View>
      ) : errorMsg ? (
        <View style={styles.center}>
          <Text style={{ color: COLORS.danger }}>{errorMsg}</Text>
          <TouchableOpacity onPress={() => fetchPage('initial')} style={styles.retryBtn}>
            <Text style={styles.retryText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          contentContainerStyle={{ padding: SPACING.lg, paddingBottom: SPACING.xl }}
          data={items}
          keyExtractor={(it) => it.id}
          renderItem={renderItem}
          ListEmptyComponent={
            <View style={styles.centerEmpty}>
              <Text style={{ color: COLORS.textMuted }}>{emptyText}</Text>
            </View>
          }
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchPage('refresh')} />}
          onEndReachedThreshold={0.4}
          onEndReached={() => {
            // ✅ súper defensivo para evitar spam
            if (loading) return;
            if (refreshing) return;
            if (loadingMore) return;
            if (!hasMoreRef.current) return;
            if (items.length < limit) return; // si hay pocos, evita endReached en loop
            fetchPage('more');
          }}
          ListFooterComponent={
            loadingMore ? (
              <View style={{ paddingVertical: 16 }}>
                <ActivityIndicator />
              </View>
            ) : null
          }
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  filtersWrap: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: '#fff',
  },

  pillsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: '#fff',
  },
  pillActive: {
    backgroundColor: '#f3f4f6',
    borderColor: '#e5e7eb',
  },
  pillText: { fontSize: 12, fontWeight: '800', color: COLORS.textMuted },
  pillTextActive: { color: '#111' },

  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: '#fff',
  },
  chipActive: { backgroundColor: '#111', borderColor: '#111' },
  chipText: { fontSize: 12, fontWeight: '900', color: COLORS.text },
  chipTextActive: { color: '#fff' },

  reviewCard: { marginBottom: 10 },
  reviewHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },

  avatar: { width: 38, height: 38, borderRadius: 19 },
  avatarPlaceholder: {
    backgroundColor: '#9ca3af',
    alignItems: 'center',
    justifyContent: 'center',
  },

  authorName: { fontSize: 13, fontWeight: '900', color: COLORS.text },
  metaRow: { marginTop: 4, flexDirection: 'row', alignItems: 'center', gap: 10 },
  starsInline: { flexDirection: 'row', gap: 2 },
  timeAgo: { fontSize: 11, fontWeight: '700', color: COLORS.textMuted },

  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#fff7e6',
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  badgeText: { fontSize: 12, fontWeight: '900', color: '#111' },

  comment: { marginTop: 10, fontSize: 13, lineHeight: 18, color: COLORS.text },
  commentMuted: { marginTop: 10, fontSize: 13, color: COLORS.textMuted },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  centerEmpty: { paddingTop: 30, alignItems: 'center' },

  retryBtn: {
    marginTop: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: RADII.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  retryText: { fontWeight: '900', color: COLORS.text },
});
