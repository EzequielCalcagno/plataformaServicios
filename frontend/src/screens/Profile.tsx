// src/screens/Profile.tsx
import React, { useState, useCallback } from 'react';
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

import { getMyProfile, getProfessionalProfileById } from '../services/profile.client';
import { api } from '../utils/api';

// 🔹 Componentes
import { Screen } from '../components/Screen';
import { TopBar } from '../components/TopBar';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { SectionTitle } from '../components/SectionTitle';
import { COLORS, SPACING, RADII } from '../styles/theme';

type Props = {
  navigation: any;
  route: any;
};

type ProfessionalProfile = {
  id: string;
  photoUrl: string | null;
  name: string;
  specialty?: string | null;
  location?: string | null;
  rating?: number | null;
  jobsCompleted?: number | null;
  positiveFeedback?: number | null;
  about?: string | null;
  services?: { id: string; title: string; category: string }[];
  reviews?: {
    id: string;
    clientName: string;
    timeAgo: string;
    rating: number;
    comment: string;
    likes: number;
    replies: number;
  }[];
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

function normalizeProfessionalProfile(input: any): ProfessionalProfile {
  const id = String(input?.id ?? input?.userId ?? input?.usuario_id ?? '');
  const name =
    String(input?.name ?? input?.nombre_completo ?? input?.fullName ?? '').trim();

  const photoUrl =
    (input?.photoUrl ??
      input?.portadaUrl ??
      input?.portada_url ??
      input?.foto_url ??
      null) as string | null;

  return {
    id,
    photoUrl,
    name: name || 'Profesional',
    specialty: input?.specialty ?? input?.especialidad ?? null,
    location: input?.location ?? input?.ubicacion ?? null,
    rating: input?.rating ?? input?.rating_promedio ?? null,
    jobsCompleted: input?.jobsCompleted ?? input?.jobs_completed ?? null,
    positiveFeedback: input?.positiveFeedback ?? input?.positive_feedback ?? null,
    about: input?.about ?? input?.descripcion ?? null,
    services: Array.isArray(input?.services)
      ? input.services.map((s: any) => ({
          id: String(s?.id ?? s?.servicio_id ?? ''),
          title: String(s?.title ?? s?.titulo ?? ''),
          category: String(s?.category ?? s?.categoria ?? ''),
        }))
      : undefined,
    reviews: Array.isArray(input?.reviews)
      ? input.reviews.map((r: any) => ({
          id: String(r?.id ?? ''),
          clientName: String(r?.clientName ?? r?.cliente ?? ''),
          timeAgo: String(r?.timeAgo ?? r?.time_ago ?? ''),
          rating: Number(r?.rating ?? 0),
          comment: String(r?.comment ?? r?.comentario ?? ''),
          likes: Number(r?.likes ?? 0),
          replies: Number(r?.replies ?? 0),
        }))
      : undefined,
  };
}

function mapCompactToClientProfile(compact: any): ClientProfile {
  return {
    photoUrl: (compact?.photoUrl ?? null) as string | null,
    name: String(compact?.name ?? 'Usuario'),
    location: (compact?.location ?? null) as string | null,
    email: '',
    phone: '',
    pendingRequests: [],
  };
}

/* ===========================
   COMPONENT
=========================== */

export default function Profile({ route, navigation }: Props) {
  // 👇 si viene este param, estamos viendo OTRO profesional
  const profesionalIdFromRoute = route?.params?.profesionalId ?? null;
  const isViewingOtherProfessional = !!profesionalIdFromRoute;

  // Rol (solo relevante para MI perfil)
  const role = route?.params?.role ?? 'professional';
  const isProfessional = role === 'professional';

  const [showMenu, setShowMenu] = useState(false);

  const [professionalProfile, setProfessionalProfile] =
    useState<ProfessionalProfile | null>(null);

  const [clientProfile, setClientProfile] = useState<ClientProfile | null>(null);

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    try {
      setErrorMsg(null);
      setLoading(true);

      // 1) Perfil de OTRO profesional
      if (isViewingOtherProfessional) {
        const data = await getProfessionalProfileById(profesionalIdFromRoute);
        const normalized = normalizeProfessionalProfile(data);
        if (!normalized.id) throw new Error('Perfil profesional inválido (sin id)');
        setProfessionalProfile(normalized);
        setClientProfile(null);
        return;
      }

      // 2) Mi perfil
      if (isProfessional) {
        const data = await api.get<any>('/private/profile');
        const normalized = normalizeProfessionalProfile(data);
        if (!normalized.id) throw new Error('Tu perfil profesional llegó sin id');
        setProfessionalProfile(normalized);
        setClientProfile(null);
      } else {
        // 3) Cliente (compacto por ahora)
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

  if (loading) {
    return (
      <Screen>
        <View style={styles.center}>
          <Text>Cargando perfil…</Text>
        </View>
      </Screen>
    );
  }

  if (errorMsg) {
    return (
      <Screen>
        <View style={styles.center}>
          <Text>{errorMsg}</Text>
          {!isViewingOtherProfessional && (
            <Button title="Salir" onPress={handleLogout} />
          )}
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
              <Text style={{ fontSize: 20 }}>⚙️</Text>
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

      <ScrollView contentContainerStyle={styles.content}>
        {/* ================= PROFESIONAL ================= */}
        {professionalProfile && (
          <>
            <Card style={styles.profileCard} withShadow>
              {professionalProfile.photoUrl ? (
                <Image source={{ uri: professionalProfile.photoUrl }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder} />
              )}

              <Text style={styles.name}>{professionalProfile.name}</Text>

              {!!professionalProfile.specialty && (
                <Text style={styles.specialty}>{professionalProfile.specialty}</Text>
              )}

              {!!professionalProfile.location && (
                <Text style={styles.location}>{professionalProfile.location}</Text>
              )}

              <View style={styles.statsRow}>
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>{professionalProfile.rating ?? 0}</Text>
                  <Text style={styles.statLabel}>Rating</Text>
                </View>

                <View style={styles.statCard}>
                  <Text style={styles.statValue}>{professionalProfile.jobsCompleted ?? 0}</Text>
                  <Text style={styles.statLabel}>Jobs</Text>
                </View>

                {professionalProfile.positiveFeedback != null && (
                  <View style={styles.statCard}>
                    <Text style={styles.statValue}>{professionalProfile.positiveFeedback}%</Text>
                    <Text style={styles.statLabel}>Positive</Text>
                  </View>
                )}
              </View>

              {isViewingOtherProfessional && (
                <Button
                  title="Request Service"
                  style={{ marginTop: SPACING.md }}
                  onPress={() =>
                    navigation.navigate('CreateRequest', {
                      profesionalId: professionalProfile.id,
                    })
                  }
                />
              )}
            </Card>

            {!!professionalProfile.about && (
              <>
                <SectionTitle>About</SectionTitle>
                <Text style={styles.paragraph}>{professionalProfile.about}</Text>
              </>
            )}

            {!!professionalProfile.services?.length && (
              <>
                <SectionTitle>Services</SectionTitle>
                {professionalProfile.services.map((s) => (
                  <Card key={s.id} style={styles.serviceCard}>
                    <Text style={styles.serviceTitle}>{s.title}</Text>
                    <Text style={styles.serviceCategory}>{s.category}</Text>
                  </Card>
                ))}
              </>
            )}

            {!!professionalProfile.reviews?.length && (
              <>
                <SectionTitle>Reviews</SectionTitle>
                <FlatList
                  data={professionalProfile.reviews}
                  keyExtractor={(i) => i.id}
                  scrollEnabled={false}
                  renderItem={({ item }) => (
                    <Card style={styles.reviewCard}>
                      <Text style={styles.reviewName}>{item.clientName}</Text>
                      <Text style={styles.reviewText}>{item.comment}</Text>
                    </Card>
                  )}
                />
              </>
            )}
          </>
        )}

        {/* ================= CLIENTE (placeholder) ================= */}
        {!professionalProfile && clientProfile && (
          <Card style={styles.profileCard} withShadow>
            {clientProfile.photoUrl ? (
              <Image source={{ uri: clientProfile.photoUrl }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder} />
            )}

            <Text style={styles.name}>{clientProfile.name}</Text>
            {!!clientProfile.location && <Text style={styles.location}>{clientProfile.location}</Text>}

            <Text style={[styles.paragraph, { marginTop: SPACING.md }]}>
              Perfil de cliente (en construcción).
            </Text>
          </Card>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  content: { padding: SPACING.lg, paddingBottom: SPACING.xl },

  rightIconBtn: {
    padding: 6,
    borderRadius: RADII.sm,
  },

  menu: {
    position: 'absolute',
    right: 16,
    top: 56,
    backgroundColor: '#fff',
    borderRadius: RADII.md,
    padding: 8,
    zIndex: 20,
    elevation: 6,
  },
  menuItem: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    color: COLORS.text,
  },
  danger: { color: COLORS.danger },

  profileCard: { alignItems: 'center', marginBottom: SPACING.md },

  avatar: { width: 90, height: 90, borderRadius: 45, marginBottom: 8 },
  avatarPlaceholder: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: COLORS.border,
  },

  name: { fontSize: 20, fontWeight: '800', marginTop: 4, color: COLORS.text },
  specialty: { fontSize: 14, color: COLORS.textMuted },
  location: { fontSize: 13, color: COLORS.textMuted },

  statsRow: { flexDirection: 'row', marginTop: 16, width: '100%' },
  statCard: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  statLabel: { fontSize: 12, color: COLORS.textMuted },

  paragraph: { fontSize: 14, color: COLORS.text, marginBottom: 12 },

  serviceCard: { marginBottom: 8 },
  serviceTitle: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  serviceCategory: { fontSize: 12, color: COLORS.textMuted },

  reviewCard: { marginBottom: 8 },
  reviewName: { fontWeight: '700', color: COLORS.text },
  reviewText: { fontSize: 13, color: COLORS.text },
});
