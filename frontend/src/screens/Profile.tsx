// src/screens/Profile.tsx
import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ScrollView,
  Image,
  TouchableOpacity,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { getMyProfile, getProfessionalProfileById } from '../services/profile.client';
import { api } from '../utils/api';

// Components
import { Screen } from '../components/Screen';
import { TopBar } from '../components/TopBar';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { SectionTitle } from '../components/SectionTitle';
import { COLORS, SPACING, RADII } from '../styles/theme';

type Props = { navigation: any; route: any };

type StarDist = {
  5: number; 4: number; 3: number; 2: number; 1: number;
};

type ReviewItem = {
  id: string;
  authorName: string;
  timeAgo: string;
  rating: number; // 1..5
  comment: string;
};

type ProfessionalProfile = {
  id: string;

  coverUrl?: string | null; // portada (opcional)
  photoUrl: string | null;

  name: string;
  specialty?: string | null;
  location?: string | null;

  ratingAvg: number;      // 0..5
  reviewsCount: number;   // total reseñas
  jobsCompleted: number;  // trabajos

  starDist: StarDist;     // porcentajes (0..100) o counts, pero acá lo tratamos como %
  latestReviews: ReviewItem[];

  about?: string | null;
  services?: { id: string; title: string; category: string }[];
};

type ClientProfile = {
  photoUrl: string | null;
  name: string;
  location: string | null;
  email: string;
  phone: string;
  pendingRequests: any[];
};

/* ===========================
   HELPERS
=========================== */

function clamp01(n: number) {
  if (Number.isNaN(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

function safeNum(v: any, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function fmtAvg(v: number) {
  // 4.8
  const n = Math.round(v * 10) / 10;
  return Number.isFinite(n) ? n.toFixed(1) : '0.0';
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const a = parts[0]?.[0] ?? '?';
  const b = parts[1]?.[0] ?? '';
  return (a + b).toUpperCase();
}

function normalizeStarDist(input: any): StarDist {
  const d = input?.starDist ?? input?.distribution ?? input?.distribucion ?? input?.dist ?? null;

  // Si viene como objeto con keys "5","4"...:
  if (d && typeof d === 'object') {
    const five = safeNum(d[5] ?? d['5'] ?? 0);
    const four = safeNum(d[4] ?? d['4'] ?? 0);
    const three = safeNum(d[3] ?? d['3'] ?? 0);
    const two = safeNum(d[2] ?? d['2'] ?? 0);
    const one = safeNum(d[1] ?? d['1'] ?? 0);
    return { 5: five, 4: four, 3: three, 2: two, 1: one };
  }

  // Default sin datos
  return { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
}

/**
 * Esperado desde backend (ideal):
 * {
 *  id, name, photoUrl, coverUrl, specialty, location, about,
 *  stats: { ratingAvg, reviewsCount, jobsCompleted, starDist },
 *  latestReviews: [{id, authorName, timeAgo, rating, comment}],
 *  services: [...]
 * }
 */
function normalizeProfessionalProfile(input: any): ProfessionalProfile {
  const id = String(input?.id ?? input?.userId ?? input?.usuario_id ?? input?.profesionalId ?? '');

  const name = String(input?.name ?? input?.nombre ?? input?.nombre_completo ?? input?.fullName ?? '').trim();

  const photoUrl =
    (input?.photoUrl ??
      input?.fotoUrl ??
      input?.foto_url ??
      input?.avatarUrl ??
      null) as string | null;

  const coverUrl =
    (input?.coverUrl ??
      input?.portadaUrl ??
      input?.portada_url ??
      input?.cover_url ??
      null) as string | null;

  const specialty = input?.specialty ?? input?.especialidad ?? input?.oficio ?? null;
  const location = input?.location ?? input?.ubicacion ?? input?.ciudad ?? null;
  const about = input?.about ?? input?.descripcion ?? input?.sobre_mi ?? null;

  const stats = input?.stats ?? input?.calificaciones ?? input?.ratings ?? null;

  const ratingAvg = safeNum(stats?.ratingAvg ?? input?.ratingAvg ?? input?.rating_promedio ?? input?.rating ?? 0, 0);
  const reviewsCount = safeNum(stats?.reviewsCount ?? input?.reviewsCount ?? input?.totalReviews ?? input?.total_resenas ?? 0, 0);
  const jobsCompleted = safeNum(stats?.jobsCompleted ?? input?.jobsCompleted ?? input?.trabajos ?? input?.jobs_completed ?? 0, 0);

  const starDist = normalizeStarDist(stats ?? input);

  const latestReviewsRaw =
    input?.latestReviews ??
    input?.reviews ??
    input?.ultimasResenas ??
    input?.ultimas_reviews ??
    [];

  const latestReviews: ReviewItem[] = Array.isArray(latestReviewsRaw)
    ? latestReviewsRaw.map((r: any, idx: number) => ({
        id: String(r?.id ?? `${id}-r-${idx}`),
        authorName: String(r?.authorName ?? r?.clientName ?? r?.clienteNombre ?? r?.cliente ?? 'Usuario'),
        timeAgo: String(r?.timeAgo ?? r?.hace ?? r?.time_ago ?? ''),
        rating: Math.max(1, Math.min(5, safeNum(r?.rating ?? r?.puntaje ?? 0, 0))),
        comment: String(r?.comment ?? r?.comentario ?? ''),
      }))
    : [];

  const servicesRaw = input?.services ?? input?.servicios ?? [];
  const services = Array.isArray(servicesRaw)
    ? servicesRaw.map((s: any) => ({
        id: String(s?.id ?? s?.servicio_id ?? ''),
        title: String(s?.title ?? s?.titulo ?? ''),
        category: String(s?.category ?? s?.categoria ?? ''),
      }))
    : undefined;

  return {
    id,
    coverUrl,
    photoUrl,
    name: name || 'Profesional',
    specialty,
    location,
    ratingAvg,
    reviewsCount,
    jobsCompleted,
    starDist,
    latestReviews,
    about,
    services,
  };
}

function mapCompactToClientProfile(compact: any): ClientProfile {
  return {
    photoUrl: (compact?.photoUrl ?? compact?.foto_url ?? null) as string | null,
    name: String(compact?.name ?? compact?.nombre ?? 'Usuario'),
    location: (compact?.location ?? compact?.ubicacion ?? null) as string | null,
    email: '',
    phone: '',
    pendingRequests: [],
  };
}

function StarsInline({ value, size = 14 }: { value: number; size?: number }) {
  const v = Math.max(0, Math.min(5, Math.round(value)));
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Ionicons
          key={n}
          name={n <= v ? 'star' : 'star-outline'}
          size={size}
          color={n <= v ? '#F7B500' : '#CBD5E1'}
          style={{ marginRight: 2 }}
        />
      ))}
    </View>
  );
}

function Bar({ pct }: { pct: number }) {
  const w = `${Math.round(clamp01(pct / 100) * 100)}%`;
  return (
    <View style={styles.barTrack}>
      <View style={[styles.barFill, { width: w }]} />
    </View>
  );
}

/* ===========================
   COMPONENT
=========================== */

export default function Profile({ route, navigation }: Props) {
  const profesionalIdFromRoute = route?.params?.profesionalId ?? null;
  const isViewingOtherProfessional = !!profesionalIdFromRoute;

  const role = route?.params?.role ?? 'professional';
  const isProfessional = role === 'professional';

  const [showMenu, setShowMenu] = useState(false);

  const [professionalProfile, setProfessionalProfile] = useState<ProfessionalProfile | null>(null);
  const [clientProfile, setClientProfile] = useState<ClientProfile | null>(null);

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    try {
      setErrorMsg(null);
      setLoading(true);

      // 1) Perfil de OTRO profesional
      if (isViewingOtherProfessional) {
        // ✅ Ideal: que este endpoint ya te devuelva stats + reviews
        const data = await getProfessionalProfileById(profesionalIdFromRoute);
        const normalized = normalizeProfessionalProfile(data);
        if (!normalized.id) throw new Error('Perfil profesional inválido (sin id)');
        setProfessionalProfile(normalized);
        setClientProfile(null);
        return;
      }

      // 2) Mi perfil pro
      if (isProfessional) {
        // ✅ ya venís usando /private/profile
        const data = await api.get<any>('/private/profile');
        const normalized = normalizeProfessionalProfile(data);
        if (!normalized.id) throw new Error('Tu perfil profesional llegó sin id');
        setProfessionalProfile(normalized);
        setClientProfile(null);
      } else {
        // 3) Cliente (compacto)
        const compact = await getMyProfile();
        setClientProfile(mapCompactToClientProfile(compact));
        setProfessionalProfile(null);
      }
    } catch (e) {
      console.log('❌ Error fetchProfile', e);
      setErrorMsg('Error al cargar el perfil.');
    } finally {
      setLoading(false);
    }
  }, [isViewingOtherProfessional, profesionalIdFromRoute, isProfessional]);

  useFocusEffect(
    useCallback(() => {
      fetchProfile();
    }, [fetchProfile]),
  );

  const handleLogout = async () => {
    await AsyncStorage.multiRemove(['@token', '@user', '@role', '@userId']);
    navigation.replace('Login');
  };

  // % por estrella (si el backend manda counts en vez de %)
  const starPct: StarDist = useMemo(() => {
    if (!professionalProfile) return { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };

    const d = professionalProfile.starDist;
    const total = d[5] + d[4] + d[3] + d[2] + d[1];

    // Si parece que ya viene en % (suma ~100)
    const sum = total;
    if (sum > 95 && sum < 105) return d;

    // Si viene en counts => convertimos a %
    if (total <= 0) return { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };

    return {
      5: Math.round((d[5] / total) * 100),
      4: Math.round((d[4] / total) * 100),
      3: Math.round((d[3] / total) * 100),
      2: Math.round((d[2] / total) * 100),
      1: Math.round((d[1] / total) * 100),
    };
  }, [professionalProfile]);

  if (loading) {
    return (
      <Screen>
        <View style={styles.center}>
          <Text style={{ color: COLORS.textMuted }}>Cargando perfil…</Text>
        </View>
      </Screen>
    );
  }

  if (errorMsg) {
    return (
      <Screen>
        <View style={styles.center}>
          <Text style={{ color: COLORS.text }}>{errorMsg}</Text>
          {!isViewingOtherProfessional && <Button title="Salir" onPress={handleLogout} />}
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <TopBar
        title="Perfil"
        rightNode={
          !isViewingOtherProfessional ? (
            <TouchableOpacity
              onPress={() => setShowMenu((p) => !p)}
              style={styles.rightIconBtn}
              activeOpacity={0.8}
            >
              <Ionicons name="settings-outline" size={20} color={COLORS.text} />
            </TouchableOpacity>
          ) : null
        }
      />

      {showMenu && !isViewingOtherProfessional && (
        <View style={styles.menu}>
          <Text
            style={styles.menuItem}
            onPress={() => {
              setShowMenu(false);
              navigation.navigate('EditProfile');
            }}
          >
            Editar perfil
          </Text>

          <Text
            style={[styles.menuItem, styles.danger]}
            onPress={async () => {
              setShowMenu(false);
              await handleLogout();
            }}
          >
            Cerrar sesión
          </Text>
        </View>
      )}

      {/* ====== PROFESIONAL ====== */}
      {professionalProfile ? (
        <ScrollView contentContainerStyle={styles.content}>
          {/* Portada (opcional) */}
          {!!professionalProfile.coverUrl && (
            <View style={styles.coverWrap}>
              <Image source={{ uri: professionalProfile.coverUrl }} style={styles.coverImg} />
            </View>
          )}

          {/* Card principal estilo captura */}
          <Card withShadow style={styles.mainCard}>
            <View style={styles.avatarWrap}>
              {professionalProfile.photoUrl ? (
                <Image source={{ uri: professionalProfile.photoUrl }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarInitial}>{initials(professionalProfile.name)}</Text>
                </View>
              )}
            </View>

            <Text style={styles.name}>{professionalProfile.name}</Text>

            {!!professionalProfile.specialty && (
              <Text style={styles.specialty}>{professionalProfile.specialty}</Text>
            )}

            {!!professionalProfile.location && (
              <Text style={styles.location}>{professionalProfile.location}</Text>
            )}

            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{fmtAvg(professionalProfile.ratingAvg)}</Text>
                <Text style={styles.statLabel}>RATING</Text>
              </View>

              <View style={styles.statDivider} />

              <View style={styles.statBox}>
                <Text style={styles.statValue}>{professionalProfile.jobsCompleted}</Text>
                <Text style={styles.statLabel}>TRABAJOS</Text>
              </View>
            </View>

            {isViewingOtherProfessional && (
              <Button
                title="Solicitar servicio"
                style={{ marginTop: SPACING.md }}
                onPress={() =>
                  navigation.navigate('CreateRequest', { profesionalId: professionalProfile.id })
                }
              />
            )}
          </Card>

          {/* Sobre mí */}
          {!!professionalProfile.about && (
            <>
              <SectionTitle>Sobre mí</SectionTitle>
              <Card style={styles.aboutCard}>
                <Text style={styles.paragraph}>{professionalProfile.about}</Text>
              </Card>
            </>
          )}

          {/* Servicios */}
          {!!professionalProfile.services?.length && (
            <>
              <View style={styles.sectionRow}>
                <SectionTitle>Servicios ofrecidos</SectionTitle>
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() =>
                    navigation.navigate('ProfessionalServices', { profesionalId: professionalProfile.id })
                  }
                >
                  <Text style={styles.linkText}>ver todos</Text>
                </TouchableOpacity>
              </View>

              {professionalProfile.services.slice(0, 3).map((s) => (
                <Card key={s.id} style={styles.serviceCard}>
                  <Text style={styles.serviceTitle}>{s.title}</Text>
                  <Text style={styles.serviceCategory}>{s.category}</Text>
                </Card>
              ))}
            </>
          )}

          {/* Ratings summary + bars */}
          <SectionTitle>Calificaciones</SectionTitle>
          <Card style={styles.ratingCard} withShadow>
            <View style={styles.ratingTop}>
              <View style={{ alignItems: 'flex-start' }}>
                <Text style={styles.ratingAvgBig}>{fmtAvg(professionalProfile.ratingAvg)}</Text>
                <Text style={styles.ratingCount}>
                  ({professionalProfile.reviewsCount} reseñas)
                </Text>
              </View>

              <View style={{ flex: 1, paddingLeft: 16 }}>
                {[5, 4, 3, 2, 1].map((n) => (
                  <View key={n} style={styles.distRow}>
                    <Text style={styles.distStar}>{n}</Text>
                    <Ionicons name="star" size={12} color="#F7B500" style={{ marginRight: 8 }} />
                    <Bar pct={(starPct as any)[n]} />
                    <Text style={styles.distPct}>{(starPct as any)[n]}%</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Últimas reseñas */}
            {!!professionalProfile.latestReviews?.length ? (
              <View style={{ marginTop: 10 }}>
                {professionalProfile.latestReviews.slice(0, 3).map((r) => (
                  <View key={r.id} style={styles.reviewItem}>
                    <View style={styles.reviewHeader}>
                      <View style={styles.reviewAvatar}>
                        <Text style={styles.reviewAvatarText}>{initials(r.authorName)}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.reviewName}>{r.authorName}</Text>
                        <Text style={styles.reviewTime}>{r.timeAgo}</Text>
                      </View>
                      <StarsInline value={r.rating} />
                    </View>

                    {!!r.comment && <Text style={styles.reviewComment}>{r.comment}</Text>}
                  </View>
                ))}

                <Button
                  title={`Ver las ${professionalProfile.reviewsCount} reseñas`}
                  style={{ marginTop: 8 }}
                  onPress={() =>
                    navigation.navigate('Reviews', { profesionalId: professionalProfile.id })
                  }
                />
              </View>
            ) : (
              <Text style={[styles.help, { marginTop: 10 }]}>
                Todavía no hay reseñas para mostrar.
              </Text>
            )}
          </Card>
        </ScrollView>
      ) : (
        // ====== CLIENTE (placeholder) ======
        <ScrollView contentContainerStyle={styles.content}>
          {clientProfile && (
            <Card style={styles.mainCard} withShadow>
              <View style={styles.avatarWrap}>
                {clientProfile.photoUrl ? (
                  <Image source={{ uri: clientProfile.photoUrl }} style={styles.avatar} />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Text style={styles.avatarInitial}>{initials(clientProfile.name)}</Text>
                  </View>
                )}
              </View>

              <Text style={styles.name}>{clientProfile.name}</Text>
              {!!clientProfile.location && <Text style={styles.location}>{clientProfile.location}</Text>}

              <Text style={[styles.help, { marginTop: SPACING.md }]}>
                Perfil de cliente (en construcción).
              </Text>
            </Card>
          )}
        </ScrollView>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  content: { padding: SPACING.lg, paddingBottom: SPACING.xl },

  rightIconBtn: { padding: 6, borderRadius: RADII.sm },

  menu: {
    position: 'absolute',
    right: 16,
    top: 56,
    backgroundColor: COLORS.cardBg,
    borderRadius: RADII.md,
    padding: 8,
    zIndex: 20,
    elevation: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  menuItem: { paddingVertical: 8, paddingHorizontal: 12, color: COLORS.text, fontWeight: '700' },
  danger: { color: COLORS.danger },

  coverWrap: {
    height: 150,
    borderRadius: RADII.lg,
    overflow: 'hidden',
    marginBottom: SPACING.md,
  },
  coverImg: { width: '100%', height: '100%' },

  mainCard: {
    alignItems: 'center',
    marginBottom: SPACING.md,
    paddingTop: 18,
    paddingBottom: 16,
  },

  avatarWrap: { marginTop: -44, marginBottom: 8 },
  avatar: { width: 88, height: 88, borderRadius: 44, borderWidth: 3, borderColor: COLORS.cardBg },
  avatarPlaceholder: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: COLORS.cardBg,
  },
  avatarInitial: { fontSize: 22, fontWeight: '900', color: COLORS.textMuted },

  name: { fontSize: 18, fontWeight: '900', marginTop: 4, color: COLORS.text },
  specialty: { fontSize: 13, color: COLORS.textMuted, marginTop: 2, fontWeight: '700' },
  location: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },

  statsRow: {
    flexDirection: 'row',
    marginTop: 14,
    width: '100%',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 12,
    justifyContent: 'space-between',
  },
  statBox: { flex: 1, alignItems: 'center' },
  statDivider: { width: 1, backgroundColor: COLORS.border },
  statValue: { fontSize: 16, fontWeight: '900', color: COLORS.text },
  statLabel: { fontSize: 11, color: COLORS.textMuted, marginTop: 4, fontWeight: '900' },

  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  linkText: { color: COLORS.primaryBrilliant, fontWeight: '800', fontSize: 12 },

  aboutCard: { marginTop: 6, marginBottom: SPACING.md },
  paragraph: { fontSize: 13, color: COLORS.text, lineHeight: 18 },

  serviceCard: { marginBottom: 8 },
  serviceTitle: { fontSize: 14, fontWeight: '800', color: COLORS.text },
  serviceCategory: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },

  // Ratings block
  ratingCard: { marginTop: 6, marginBottom: SPACING.md },
  ratingTop: { flexDirection: 'row', alignItems: 'flex-start' },
  ratingAvgBig: { fontSize: 28, fontWeight: '900', color: COLORS.text, lineHeight: 32 },
  ratingCount: { marginTop: 4, fontSize: 12, color: COLORS.textMuted, fontWeight: '700' },

  distRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  distStar: { width: 12, textAlign: 'right', marginRight: 6, color: COLORS.textMuted, fontWeight: '800' },
  distPct: { width: 40, textAlign: 'right', marginLeft: 8, color: COLORS.textMuted, fontWeight: '800', fontSize: 11 },

  barTrack: {
    flex: 1,
    height: 6,
    borderRadius: 999,
    backgroundColor: '#E8EDF2',
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: COLORS.primaryBrilliant,
  },

  reviewItem: { paddingTop: 12, marginTop: 10, borderTopWidth: 1, borderTopColor: COLORS.border },
  reviewHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  reviewAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.bgDivider,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewAvatarText: { fontWeight: '900', color: COLORS.textMuted, fontSize: 12 },

  reviewName: { fontWeight: '900', color: COLORS.text, fontSize: 13 },
  reviewTime: { marginTop: 2, color: COLORS.textMuted, fontSize: 11, fontWeight: '700' },
  reviewComment: { marginTop: 8, color: COLORS.text, fontSize: 13, lineHeight: 18 },

  help: { fontSize: 12, color: COLORS.textMuted, fontWeight: '700' },
});
