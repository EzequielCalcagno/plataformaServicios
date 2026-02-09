// src/screens/Profile.tsx
import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';

import { getMyProfile, getProfessionalProfileById } from '../services/profile.client';
import { api } from '../utils/api';

// Components
import { Screen } from '../components/Screen';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { SectionTitle } from '../components/SectionTitle';
import { Divider } from '../components/Divider';
import { TopBar } from '../components/TopBar';
import { Alert } from '../components/Alert';

import { COLORS, SPACING, RADII, TYPO, SHADOWS } from '../styles/theme';

type Props = { navigation: any; route: any };

type StarDist = { 5: number; 4: number; 3: number; 2: number; 1: number };

type ReviewItem = {
  id: string;
  authorName: string;
  timeAgo: string;
  rating: number;
  comment: string;
};

type ProfessionalProfile = {
  id: string;
  photoUrl: string | null;

  name: string;
  specialty?: string | null;
  location?: string | null;

  ratingAvg: number;
  reviewsCount: number;
  jobsCompleted: number;

  starDist: StarDist;
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
   URL NORMALIZATION
=========================== */

const API_URL =
  ((Constants.expoConfig?.extra as any)?.API_URL as string)?.replace(/\/+$/, '') || '';

function normalizePhotoUrl(photoUrl: string | null): string | null {
  if (!photoUrl) return null;
  const raw = String(photoUrl).trim();
  if (!raw) return null;

  if (raw.startsWith('http://') || raw.startsWith('https://')) return raw;

  const path = raw.startsWith('/') ? raw : `/${raw}`;
  if (!API_URL) return null;
  return `${API_URL}${path}`;
}

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

  if (d && typeof d === 'object') {
    const five = safeNum(d[5] ?? d['5'] ?? 0);
    const four = safeNum(d[4] ?? d['4'] ?? 0);
    const three = safeNum(d[3] ?? d['3'] ?? 0);
    const two = safeNum(d[2] ?? d['2'] ?? 0);
    const one = safeNum(d[1] ?? d['1'] ?? 0);
    return { 5: five, 4: four, 3: three, 2: two, 1: one };
  }

  return { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
}

function normalizeProfessionalProfile(input: any): ProfessionalProfile {
  const id = String(input?.id ?? input?.userId ?? input?.usuario_id ?? input?.profesionalId ?? '');

  const name = String(
    input?.name ?? input?.nombre ?? input?.nombre_completo ?? input?.fullName ?? '',
  ).trim();

  const photoUrl = (input?.photoUrl ??
    input?.fotoUrl ??
    input?.foto_url ??
    input?.avatarUrl ??
    null) as string | null;

  const coverUrl = (input?.coverUrl ??
    input?.portadaUrl ??
    input?.portada_url ??
    input?.cover_url ??
    null) as string | null;

  const specialty = input?.specialty ?? input?.especialidad ?? input?.oficio ?? null;
  const location = input?.location ?? input?.ubicacion ?? input?.ciudad ?? null;
  const about = input?.about ?? input?.descripcion ?? input?.sobre_mi ?? null;

  const stats = input?.stats ?? input?.calificaciones ?? input?.ratings ?? null;

  const ratingAvg = safeNum(
    stats?.ratingAvg ?? input?.ratingAvg ?? input?.rating_promedio ?? input?.rating ?? 0,
    0,
  );
  const reviewsCount = safeNum(
    stats?.reviewsCount ?? input?.reviewsCount ?? input?.totalReviews ?? input?.total_resenas ?? 0,
    0,
  );
  const jobsCompleted = safeNum(
    stats?.jobsCompleted ?? input?.jobsCompleted ?? input?.trabajos ?? input?.jobs_completed ?? 0,
    0,
  );

  const starDist = normalizeStarDist(stats ?? input);

  const latestReviewsRaw =
    input?.latestReviews ?? input?.reviews ?? input?.ultimasResenas ?? input?.ultimas_reviews ?? [];

  const latestReviews: ReviewItem[] = Array.isArray(latestReviewsRaw)
    ? latestReviewsRaw.map((r: any, idx: number) => ({
        id: String(r?.id ?? `${id}-r-${idx}`),
        authorName: String(
          r?.authorName ?? r?.clientName ?? r?.clienteNombre ?? r?.cliente ?? 'Usuario',
        ),
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
      <View style={[styles.barFill, { width: w as any }]} />
    </View>
  );
}

function Pill({ icon, text }: { icon: keyof typeof Ionicons.glyphMap; text: string }) {
  return (
    <View style={styles.pill}>
      <Ionicons name={icon} size={14} color={COLORS.text} style={{ marginRight: 6 }} />
      <Text style={styles.pillText}>{text}</Text>
    </View>
  );
}

/* ===========================
   SCREEN
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
  const [alertMsg, setAlertMsg] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  // Avatar states
  const [avatarError, setAvatarError] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);

  const fetchProfile = useCallback(async () => {
    try {
      setAlertMsg(null);
      setOk(false);
      setLoading(true);

      if (isViewingOtherProfessional) {
        const data = await getProfessionalProfileById(profesionalIdFromRoute);
        const normalized = normalizeProfessionalProfile(data);
        if (!normalized.id) throw new Error('Perfil profesional inválido (sin id)');
        setProfessionalProfile(normalized);
        setAvatarError(false);
        return;
      }

      // Mi perfil profesional
      const data = await api.get<any>('/private/profile');
      const normalized = normalizeProfessionalProfile(data);
      if (!normalized.id) throw new Error('Tu perfil profesional llegó sin id');
      setProfessionalProfile(normalized);
      setAvatarError(false);
    } catch (e: any) {
      console.log('❌ Error fetchProfile', e);
      setOk(false);
      setAlertMsg('Error al cargar el perfil.');
    } finally {
      setLoading(false);
    }
  }, [isViewingOtherProfessional, profesionalIdFromRoute]);

  useFocusEffect(
    useCallback(() => {
      fetchProfile();
    }, [fetchProfile]),
  );

  const handleLogout = async () => {
    await AsyncStorage.multiRemove(['@token', '@user', '@role', '@userId']);
    navigation.replace('Login');
  };

  // % por estrella
  const starPct: StarDist = useMemo(() => {
    if (!professionalProfile) return { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };

    const d = professionalProfile.starDist;
    const total = d[5] + d[4] + d[3] + d[2] + d[1];

    if (total > 95 && total < 105) return d; // parece venir en %

    if (total <= 0) return { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };

    return {
      5: Math.round((d[5] / total) * 100),
      4: Math.round((d[4] / total) * 100),
      3: Math.round((d[3] / total) * 100),
      2: Math.round((d[2] / total) * 100),
      1: Math.round((d[1] / total) * 100),
    };
  }, [professionalProfile]);

  const avatarUri = useMemo(
    () => normalizePhotoUrl((professionalProfile?.photoUrl ?? null) as any),
    [professionalProfile?.photoUrl],
  );

  if (loading) {
    return (
      <Screen>
        <View style={styles.center}>
          <ActivityIndicator />
          <Text style={[TYPO.bodyMuted, { marginTop: 10 }]}>Cargando perfil…</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <TopBar
        title={isViewingOtherProfessional ? 'Perfil' : 'Mi perfil'}
        showBack={isViewingOtherProfessional}
        rightNode={
          !isViewingOtherProfessional ? (
            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.iconBtn}
              onPress={() => setShowMenu((p) => !p)}
            >
              <Ionicons name="settings-outline" size={18} color={COLORS.text} />
            </TouchableOpacity>
          ) : null
        }
      />

      {/* Menu */}
      {showMenu && !isViewingOtherProfessional && (
        <View style={styles.menu}>
          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.menuRow}
            onPress={() => {
              setShowMenu(false);
              navigation.navigate('EditProfile');
            }}
          >
            <Ionicons
              name="create-outline"
              size={16}
              color={COLORS.text}
              style={{ marginRight: 8 }}
            />
            <Text style={styles.menuItem}>Editar perfil</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.menuRow}
            onPress={async () => {
              setShowMenu(false);
              await handleLogout();
            }}
          >
            <Ionicons
              name="log-out-outline"
              size={16}
              color={COLORS.danger}
              style={{ marginRight: 8 }}
            />
            <Text style={[styles.menuItem, { color: COLORS.danger }]}>Cerrar sesión</Text>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {alertMsg ? (
          <Alert
            type={ok ? 'success' : 'error'}
            message={alertMsg}
            style={{ marginBottom: SPACING.md }}
          />
        ) : null}

        {/* ====== PROFESIONAL ====== */}
        {professionalProfile ? (
          <>
            {/* INFO CARD (foto dentro) */}
            <Card style={styles.profileCard} withShadow>
              <View style={styles.profileHeader}>
                <View style={styles.avatarInCardWrap}>
                  {avatarUri && !avatarError ? (
                    <View>
                      <Image
                        source={{ uri: avatarUri }}
                        style={styles.avatarInCard}
                        onLoadStart={() => setAvatarLoading(true)}
                        onLoadEnd={() => setAvatarLoading(false)}
                        onError={() => {
                          setAvatarLoading(false);
                          setAvatarError(true);
                        }}
                      />
                      {avatarLoading && (
                        <View style={styles.avatarLoadingOverlayInCard}>
                          <ActivityIndicator size="small" color={COLORS.primaryBrilliant} />
                        </View>
                      )}
                    </View>
                  ) : (
                    <View style={[styles.avatarInCard, styles.avatarPlaceholder]}>
                      <Text style={styles.avatarInitial}>
                        {initials(professionalProfile.name || 'Profesional')}
                      </Text>
                    </View>
                  )}
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.name} numberOfLines={1}>
                    {professionalProfile.name}
                  </Text>

                  {!!professionalProfile.specialty && (
                    <Text style={styles.meta} numberOfLines={1}>
                      {professionalProfile.specialty}
                    </Text>
                  )}

                  {!!professionalProfile.location && (
                    <View style={styles.metaRow}>
                      <Ionicons name="location-outline" size={14} color={COLORS.textMuted} />
                      <Text
                        style={[styles.meta, { marginTop: 0, marginLeft: 6 }]}
                        numberOfLines={1}
                      >
                        {professionalProfile.location}
                      </Text>
                    </View>
                  )}
                </View>
              </View>

              <View style={styles.pillsRow}>
                <Pill icon="star" text={`${fmtAvg(professionalProfile.ratingAvg)} rating`} />
                <Pill
                  icon="chatbubble-ellipses-outline"
                  text={`${professionalProfile.reviewsCount} reseñas`}
                />
                <Pill
                  icon="checkmark-done-outline"
                  text={`${professionalProfile.jobsCompleted} trabajos`}
                />
              </View>

              {isViewingOtherProfessional && (
                <Button
                  title="Solicitar servicio"
                  onPress={() =>
                    navigation.navigate('CreateRequest', { profesionalId: professionalProfile.id })
                  }
                  style={{ marginTop: SPACING.md }}
                />
              )}
            </Card>

            {/* ABOUT */}
            {!!professionalProfile.about && (
              <>
                <SectionTitle>Sobre mí</SectionTitle>
                <Card style={styles.sectionCard} withShadow>
                  <Text style={styles.paragraph}>{professionalProfile.about}</Text>
                </Card>
              </>
            )}

            {/* SERVICES */}
            <View style={styles.sectionHeaderRow}>
              <SectionTitle>Servicios</SectionTitle>

              {!!professionalProfile.services?.length && (
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => {
                    // OJO: si no existe esta screen, sacalo.
                    navigation.navigate('ProfessionalServices', {
                      profesionalId: professionalProfile.id,
                    });
                  }}
                >
                  <Text style={styles.linkText}>Ver todos</Text>
                </TouchableOpacity>
              )}
            </View>

            {!!professionalProfile.services?.length ? (
              <View style={{ gap: SPACING.sm }}>
                {professionalProfile.services.slice(0, 4).map((s) => (
                  <Card key={s.id} style={styles.serviceCard} withShadow>
                    <View style={styles.serviceRow}>
                      <View style={styles.serviceIcon}>
                        <Ionicons name="briefcase-outline" size={18} color={COLORS.text} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.serviceTitle} numberOfLines={1}>
                          {s.title}
                        </Text>
                        <Text style={styles.serviceCategory} numberOfLines={1}>
                          {s.category}
                        </Text>
                      </View>
                      <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
                    </View>
                  </Card>
                ))}
              </View>
            ) : (
              <Card style={styles.sectionCard} withShadow>
                <Text style={styles.helper}>Este profesional todavía no cargó servicios.</Text>
              </Card>
            )}

            {/* RATINGS */}
            <SectionTitle>Calificaciones</SectionTitle>
            <Card style={styles.ratingCard} withShadow>
              <View style={styles.ratingTop}>
                <View style={styles.ratingLeft}>
                  <Text style={styles.ratingAvg}>{fmtAvg(professionalProfile.ratingAvg)}</Text>
                  <StarsInline value={professionalProfile.ratingAvg} size={16} />
                  <Text style={styles.ratingCount}>{professionalProfile.reviewsCount} reseñas</Text>
                </View>

                <View style={styles.ratingRight}>
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

              {/* REVIEWS */}
              {!!professionalProfile.latestReviews?.length ? (
                <View style={{ marginTop: SPACING.sm }}>
                  {professionalProfile.latestReviews.slice(0, 3).map((r) => (
                    <View key={r.id} style={styles.reviewItem}>
                      <View style={styles.reviewHeader}>
                        <View style={styles.reviewAvatar}>
                          <Text style={styles.reviewAvatarText}>{initials(r.authorName)}</Text>
                        </View>

                        <View style={{ flex: 1 }}>
                          <Text style={styles.reviewName} numberOfLines={1}>
                            {r.authorName}
                          </Text>
                          <Text style={styles.reviewTime}>{r.timeAgo}</Text>
                        </View>

                        <StarsInline value={r.rating} />
                      </View>

                      {!!r.comment && (
                        <Text style={styles.reviewComment} numberOfLines={4}>
                          {r.comment}
                        </Text>
                      )}
                    </View>
                  ))}

                  <Button
                    title={`Ver reseñas`}
                    variant="outline"
                    style={{ marginTop: SPACING.md }}
                    onPress={() =>
                      navigation.navigate('Reviews', { profesionalId: professionalProfile.id })
                    }
                  />
                </View>
              ) : (
                <Text style={[styles.helper, { marginTop: SPACING.sm }]}>
                  Todavía no hay reseñas para mostrar.
                </Text>
              )}
            </Card>

            {/* Solo mi perfil */}
            {!isViewingOtherProfessional && (
              <>
                <Divider />
                <TouchableOpacity
                  activeOpacity={0.85}
                  style={styles.logoutRow}
                  onPress={handleLogout}
                >
                  <Ionicons name="log-out-outline" size={18} color={COLORS.text} />
                  <Text style={styles.logoutText}>Cerrar sesión</Text>
                </TouchableOpacity>
              </>
            )}
          </>
        ) : (
          // ====== CLIENTE ======
          <>
            {clientProfile ? (
              <Card style={styles.profileCard} withShadow>
                {avatarUri && !avatarError ? (
                  <View>
                    <Image
                      source={{ uri: avatarUri }}
                      style={styles.avatarClient}
                      onLoadStart={() => setAvatarLoading(true)}
                      onLoadEnd={() => setAvatarLoading(false)}
                      onError={() => {
                        setAvatarLoading(false);
                        setAvatarError(true);
                      }}
                    />
                    {avatarLoading && (
                      <View style={styles.avatarLoadingOverlayClient}>
                        <ActivityIndicator size="small" color={COLORS.primaryBrilliant} />
                      </View>
                    )}
                  </View>
                ) : (
                  <View style={[styles.avatarClient, styles.avatarPlaceholder]}>
                    <Text style={styles.avatarInitial}>{initials(clientProfile.name)}</Text>
                  </View>
                )}

                <Text style={styles.name}>{clientProfile.name}</Text>
                {!!clientProfile.location && (
                  <Text style={styles.meta}>{clientProfile.location}</Text>
                )}

                <Text style={[styles.helper, { marginTop: SPACING.md }]}>
                  Perfil de cliente (en construcción).
                </Text>

                <Divider />

                <TouchableOpacity
                  activeOpacity={0.85}
                  style={styles.logoutRow}
                  onPress={handleLogout}
                >
                  <Ionicons name="log-out-outline" size={18} color={COLORS.text} />
                  <Text style={styles.logoutText}>Cerrar sesión</Text>
                </TouchableOpacity>
              </Card>
            ) : null}
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: SPACING.lg },

  content: {
    paddingHorizontal: 18,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xl * 2,
  },

  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: RADII.pill,
    backgroundColor: COLORS.bgLightGrey,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  /* Menu */
  menu: {
    position: 'absolute',
    right: 18,
    top: 56,
    backgroundColor: COLORS.cardBg,
    borderRadius: RADII.md,
    padding: 8,
    zIndex: 50,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.soft,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  menuItem: { ...TYPO.label, fontFamily: TYPO.label.fontFamily },

  /* Hero */
  hero: { marginBottom: SPACING.lg },
  cover: {
    height: 160,
    borderRadius: RADII.lg,
    overflow: 'hidden',
    backgroundColor: COLORS.bgLightGrey,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  coverImg: { width: '100%', height: '100%' },
  coverFallback: { flex: 1 },

  avatarWrap: {
    position: 'absolute',
    left: SPACING.lg,
    bottom: -28,
    borderRadius: 999,
    backgroundColor: COLORS.bgScreen,
    padding: 4,
  },

  avatar: {
    width: 76,
    height: 76,
    borderRadius: 38,
  },
  avatarClient: {
    width: 88,
    height: 88,
    borderRadius: 44,
    marginBottom: 12,
  },
  avatarPlaceholder: {
    backgroundColor: COLORS.bgLightGrey,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    ...TYPO.h3,
    color: COLORS.textMuted,
  },
  avatarLoadingOverlay: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.55)',
  },
  avatarLoadingOverlayClient: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.55)',
  },

  /* Profile card */
  profileCard: {
    padding: SPACING.lg,
    borderRadius: RADII.lg,
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    backgroundColor: COLORS.cardBg,
    marginTop: SPACING.md,
    marginBottom: SPACING.lg,
  },

  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  avatarInCardWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
    backgroundColor: COLORS.bgLightGrey,
  },

  avatarInCard: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },

  avatarLoadingOverlayInCard: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.55)',
  },

  name: { ...TYPO.h2 },
  meta: { ...TYPO.subtitle, marginTop: 4 },

  metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },

  pillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: SPACING.md,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: RADII.pill,
    backgroundColor: COLORS.graySoft,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  pillText: { ...TYPO.caption, fontFamily: TYPO.caption.fontFamily, color: COLORS.text },

  sectionCard: {
    borderRadius: RADII.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    backgroundColor: COLORS.cardBg,
    marginTop: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  paragraph: { ...TYPO.body },
  helper: { ...TYPO.helper, fontFamily: TYPO.helper.fontFamily },

  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  linkText: { ...TYPO.link, textDecorationLine: 'none', color: COLORS.primaryBrilliant },

  /* Services */
  serviceCard: {
    borderRadius: RADII.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    backgroundColor: COLORS.cardBg,
  },
  serviceRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  serviceIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: COLORS.bgLightGrey,
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceTitle: { ...TYPO.label, fontFamily: TYPO.label.fontFamily },
  serviceCategory: { ...TYPO.caption, marginTop: 2 },

  /* Rating */
  ratingCard: {
    borderRadius: RADII.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    backgroundColor: COLORS.cardBg,
    marginTop: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  ratingTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 14 },
  ratingLeft: { width: 110 },
  ratingRight: { flex: 1 },

  ratingAvg: { ...TYPO.display, fontSize: 30, lineHeight: 34 },
  ratingCount: { ...TYPO.caption, marginTop: 6 },

  distRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  distStar: {
    width: 12,
    textAlign: 'right',
    marginRight: 6,
    ...TYPO.caption,
    fontFamily: TYPO.caption.fontFamily,
  },
  distPct: {
    width: 38,
    textAlign: 'right',
    marginLeft: 8,
    ...TYPO.caption,
    fontFamily: TYPO.caption.fontFamily,
  },

  barTrack: {
    flex: 1,
    height: 7,
    borderRadius: RADII.pill,
    backgroundColor: COLORS.bgLightGrey,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: RADII.pill,
    backgroundColor: COLORS.primaryBrilliant,
  },

  /* Reviews */
  reviewItem: {
    paddingTop: SPACING.md,
    marginTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  reviewHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },

  reviewAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.bgLightGrey,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewAvatarText: {
    ...TYPO.caption,
    fontFamily: TYPO.caption.fontFamily,
    color: COLORS.textMuted,
  },

  reviewName: { ...TYPO.label, fontFamily: TYPO.label.fontFamily },
  reviewTime: { ...TYPO.caption, marginTop: 2 },
  reviewComment: { ...TYPO.body, marginTop: 8 },

  /* Logout */
  logoutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  logoutText: { ...TYPO.body, fontFamily: TYPO.body.fontFamily, color: COLORS.text },
});
