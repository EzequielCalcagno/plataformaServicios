// src/screens/Profile.tsx
import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ScrollView, Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';

import { getMyProfile } from '../services/profile.client';

// 🔹 Componentes genéricos
import { AppScreen } from '../components/AppScreen';
import { TopBar } from '../components/TopBar';
import { AppCard } from '../components/AppCard';
import { AppButton } from '../components/AppButton';
import { SectionTitle } from '../components/SectionTitle';
import { COLORS, SPACING, RADII } from '../styles/theme';

type Props = {
  navigation: any;
  route: any;
};

type ProfessionalProfile = {
  photoUrl: string;
  name: string;
  specialty: string;
  location: string;
  rating: number;
  jobsCompleted: number;
  positiveFeedback: number;
  about: string;
  photos: { id: string; url: string }[];
  ratingSummary: {
    totalReviews: number;
    distribution: { stars: number; percent: number }[];
  };
  reviews: {
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
  photoUrl: string;
  name: string;
  location: string;
  email: string;
  phone: string;
  pendingRequests: {
    id: string;
    serviceType: string;
    professionalName: string;
    status: string;
    createdAt: string;
  }[];
  completedWorks: {
    id: string;
    title: string;
    description: string;
    professionalName: string;
    date: string;
  }[];
};

export default function Profile({ route, navigation }: Props) {
  // role puede venir undefined si entras directo desde la tab
  const role = route?.params?.role ?? 'professional'; // 'professional' | 'client'
  const isProfessional = role === 'professional';

  const [showMenu, setShowMenu] = useState(false);
  const [professionalProfile, setProfessionalProfile] = useState<ProfessionalProfile | null>(null);
  const [clientProfile, setClientProfile] = useState<ClientProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // 🔄 Carga el perfil según el rol
  const fetchProfile = useCallback(async () => {
    try {
      setErrorMsg(null);
      setLoading(true);

      const data = await getMyProfile();

      if (isProfessional) {
        setProfessionalProfile(data as unknown as ProfessionalProfile);
        setClientProfile(null);
      } else {
        setClientProfile(data as unknown as ClientProfile);
        setProfessionalProfile(null);
      }
    } catch (e) {
      console.log('Error fetchProfile', e);
      setErrorMsg('Error de red al cargar el perfil.');
    } finally {
      setLoading(false);
    }
  }, [isProfessional]);

  // Refresca el perfil cada vez que se enfoca la pantalla
  useFocusEffect(
    useCallback(() => {
      fetchProfile();
    }, [fetchProfile]),
  );

  const handlePressSettings = () => {
    setShowMenu((prev) => !prev);
  };

  const handleEditProfile = () => {
    setShowMenu(false);
    navigation.navigate('EditProfile');
  };

  const handleAddService = () => {
    setShowMenu(false);
    navigation.navigate('AddService');
  };

  const handleLogout = async () => {
    setShowMenu(false);
    await AsyncStorage.multiRemove(['@token', '@user', '@role', '@userId']);
    navigation.replace('Login');
  };

  // ======== ESTADOS DE CARGA / ERROR ========

  if (loading) {
    return (
      <AppScreen>
        <View style={styles.centerContainer}>
          <Text style={styles.paragraph}>Cargando perfil...</Text>
        </View>
      </AppScreen>
    );
  }

  if (errorMsg) {
    return (
      <AppScreen>
        <View style={styles.centerContainer}>
          <Text style={[styles.paragraph, { marginBottom: SPACING.md }]}>{errorMsg}</Text>
          <AppButton title="Volver al login" onPress={handleLogout} />
        </View>
      </AppScreen>
    );
  }

  if (isProfessional && !professionalProfile) {
    return (
      <AppScreen>
        <View style={styles.centerContainer}>
          <Text style={styles.paragraph}>No se pudo cargar el perfil profesional.</Text>
        </View>
      </AppScreen>
    );
  }

  if (!isProfessional && !clientProfile) {
    return (
      <AppScreen>
        <View style={styles.centerContainer}>
          <Text style={styles.paragraph}>No se pudo cargar el perfil del cliente.</Text>
        </View>
      </AppScreen>
    );
  }

  // ======== RENDER PRINCIPAL ========

  return (
    <AppScreen>
      {/* HEADER SIMPLE con tuerca */}
      <TopBar
        title="Profile"
        rightIcon={<Text style={{ fontSize: 20 }}>⚙️</Text>}
        onPressRight={handlePressSettings}
      />

      {/* Menú flotante */}
      {showMenu && (
        <View style={styles.menu}>
          <View style={styles.menuItem}>
            <Text style={styles.menuItemText} onPress={handleEditProfile}>
              Edit Profile
            </Text>
          </View>

          {isProfessional && (
            <View style={styles.menuItem}>
              <Text style={styles.menuItemText} onPress={handleAddService}>
                Add Service
              </Text>
            </View>
          )}

          <View style={[styles.menuItem, { borderTopWidth: 1, borderTopColor: '#eee' }]}>
            <Text style={[styles.menuItemText, { color: COLORS.danger }]} onPress={handleLogout}>
              Log Out
            </Text>
          </View>
        </View>
      )}

      <ScrollView contentContainerStyle={styles.content}>
        {isProfessional && professionalProfile ? (
          <>
            {/* CARD PRINCIPAL PROFESIONAL */}
            <AppCard style={styles.profileCard} withShadow>
              <Image source={{ uri: professionalProfile.photoUrl }} style={styles.avatar} />
              <Text style={styles.name}>{professionalProfile.name}</Text>
              <Text style={styles.specialty}>{professionalProfile.specialty}</Text>
              <Text style={styles.location}>{professionalProfile.location}</Text>

              <View style={styles.statsRow}>
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>{professionalProfile.rating}</Text>
                  <Text style={styles.statLabel}>Rating</Text>
                </View>

                {/* Jobs clickeable → vamos a la tab Bookings */}
                <View style={styles.statCardTouchable}>
                  <Text style={styles.statValue} onPress={() => navigation.navigate('Bookings')}>
                    {professionalProfile.jobsCompleted}
                  </Text>
                  <Text style={styles.statLabel} onPress={() => navigation.navigate('Bookings')}>
                    Jobs
                  </Text>
                </View>

                <View style={styles.statCard}>
                  <Text style={styles.statValue}>{professionalProfile.positiveFeedback}%</Text>
                  <Text style={styles.statLabel}>Positive</Text>
                </View>
              </View>

              <View style={styles.actionsRow}>
                <AppButton
                  title="WhatsApp"
                  variant="outline"
                  fullWidth={false}
                  style={[styles.actionButton, styles.whatsappBtn]}
                  textStyle={styles.whatsappText}
                  onPress={() => {}}
                />
                <AppButton
                  title="Request Service"
                  variant="primary"
                  fullWidth={false}
                  style={styles.actionButton}
                  onPress={() => {}}
                />
              </View>
            </AppCard>

            {/* ABOUT */}
            <SectionTitle>About</SectionTitle>
            <Text style={styles.paragraph}>{professionalProfile.about}</Text>

            {/* PHOTOS */}
            <SectionTitle>Photos</SectionTitle>
            {/* <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {professionalProfile.photos.map((p) => (
                <Image key={p.id} source={{ uri: p.url }} style={styles.photo} />
              ))}
            </ScrollView> */}

            {/* REVIEWS */}
            <SectionTitle>Reviews</SectionTitle>

            <AppCard style={styles.reviewSummary}>
              {/* <View style={{ alignItems: 'center', marginRight: SPACING.md }}>
                <Text style={styles.summaryRating}>{professionalProfile.rating}</Text>
                <Text style={styles.summaryStars}>★★★★☆</Text>
                <Text style={styles.summaryCount}>
                  {professionalProfile.ratingSummary.totalReviews} reviews
                </Text>
              </View> */}

              <View style={{ flex: 1 }}>
                {/* {professionalProfile.ratingSummary.distribution.map((item) => (
                  <View key={item.stars} style={styles.distrRow}>
                    <Text style={styles.distrLabel}>{item.stars}</Text>
                    <View style={styles.distrBarBg}>
                      <View
                        style={[
                          styles.distrBarFill,
                          { flex: item.percent, maxWidth: `${item.percent}%` },
                        ]}
                      />
                    </View>
                    <Text style={styles.distrPercent}>{item.percent}%</Text>
                  </View>
                ))} */}
              </View>
            </AppCard>

            <FlatList
              data={professionalProfile.reviews}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              renderItem={({ item }) => (
                <AppCard style={styles.reviewCard}>
                  <View style={styles.reviewHeader}>
                    <View style={styles.reviewAvatarPlaceholder} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.reviewName}>{item.clientName}</Text>
                      <Text style={styles.reviewTime}>{item.timeAgo}</Text>
                    </View>
                    <Text style={styles.reviewStarsText}>
                      {'★'.repeat(item.rating)} {'☆'.repeat(5 - item.rating)}
                    </Text>
                  </View>
                  <Text style={styles.paragraph}>{item.comment}</Text>

                  <View style={styles.reviewFooter}>
                    <Text style={styles.reviewMeta}>👍 {item.likes}</Text>
                    <Text style={styles.reviewMeta}>💬 {item.replies}</Text>
                  </View>
                </AppCard>
              )}
            />
          </>
        ) : (
          clientProfile && (
            <>
              {/* CARD PRINCIPAL CLIENTE */}
              <AppCard style={styles.profileCard} withShadow>
                <Image source={{ uri: clientProfile.photoUrl }} style={styles.avatar} />
                <Text style={styles.name}>{clientProfile.name}</Text>
                <Text style={styles.location}>{clientProfile.location}</Text>

                <View style={[styles.statsRow, { marginTop: SPACING.md }]}>
                  <View style={styles.statCard}>
                    <Text style={styles.statValue}>{clientProfile.pendingRequests.length}</Text>
                    <Text style={styles.statLabel}>Pending</Text>
                  </View>
                </View>
              </AppCard>

              {/* DATOS DE CONTACTO */}
              <SectionTitle>Contact</SectionTitle>
              <AppCard style={styles.card}>
                <Text style={styles.paragraph}>Email: {clientProfile.email}</Text>
                <Text style={styles.paragraph}>Phone: {clientProfile.phone}</Text>
              </AppCard>

              {/* SOLICITUDES PENDIENTES */}
              <SectionTitle>Pending Requests</SectionTitle>
              {clientProfile.pendingRequests.length === 0 ? (
                <Text style={styles.paragraph}>You have no pending service requests.</Text>
              ) : (
                clientProfile.pendingRequests.map((req) => (
                  <AppCard key={req.id} style={styles.card}>
                    <Text style={styles.cardTitle}>{req.serviceType}</Text>
                    <Text style={styles.cardSubtitle}>Professional: {req.professionalName}</Text>
                    <Text style={styles.paragraph}>Status: {req.status}</Text>
                    <Text style={styles.reviewTime}>{req.createdAt}</Text>
                  </AppCard>
                ))
              )}
            </>
          )
        )}
      </ScrollView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    padding: SPACING.lg,
    justifyContent: 'center',
  },
  menu: {
    position: 'absolute',
    top: 54,
    right: SPACING.lg,
    backgroundColor: COLORS.cardBg,
    borderRadius: RADII.md,
    paddingVertical: 4,
    minWidth: 160,
    ...{
      shadowColor: '#000',
      shadowOpacity: 0.08,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 4 },
      elevation: 6,
    },
    zIndex: 40,
  },
  menuItem: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
  },
  menuItemText: { fontSize: 14, color: COLORS.text },
  content: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xl * 2,
  },
  profileCard: {
    alignItems: 'center',
    marginTop: SPACING.lg,
    marginBottom: SPACING.md,
  },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: 42,
    marginBottom: SPACING.sm,
  },
  name: { fontSize: 20, fontWeight: '700', marginTop: 4, color: COLORS.text },
  specialty: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  location: {
    fontSize: 13,
    color: '#9ca3af',
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    marginTop: SPACING.md,
    justifyContent: 'space-between',
    width: '100%',
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.graySoft,
    marginHorizontal: 4,
    borderRadius: RADII.md,
    paddingVertical: 10,
    alignItems: 'center',
  },
  statCardTouchable: {
    flex: 1,
    backgroundColor: COLORS.graySoft,
    marginHorizontal: 4,
    borderRadius: RADII.md,
    paddingVertical: 10,
    alignItems: 'center',
  },
  statValue: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  statLabel: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  actionsRow: {
    flexDirection: 'row',
    marginTop: SPACING.md,
    width: '100%',
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  whatsappBtn: {
    borderColor: COLORS.success,
  },
  whatsappText: {
    color: COLORS.success,
  },
  paragraph: {
    fontSize: 14,
    color: '#4b5563',
    marginBottom: 4,
  },
  photo: {
    width: 180,
    height: 120,
    borderRadius: RADII.lg,
    marginRight: 10,
    marginTop: 6,
  },
  reviewSummary: {
    flexDirection: 'row',
    marginTop: 8,
    marginBottom: 8,
  },
  summaryRating: { fontSize: 24, fontWeight: '700', color: COLORS.text },
  summaryStars: { fontSize: 16, color: COLORS.warning, marginTop: 2 },
  summaryCount: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  distrRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 2,
  },
  distrLabel: { width: 16, fontSize: 12, color: '#4b5563' },
  distrBarBg: {
    flex: 1,
    height: 6,
    borderRadius: RADII.pill,
    backgroundColor: COLORS.border,
    marginHorizontal: 6,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  distrBarFill: {
    height: 6,
    borderRadius: RADII.pill,
    backgroundColor: COLORS.warning,
  },
  distrPercent: {
    width: 32,
    fontSize: 11,
    color: COLORS.textMuted,
    textAlign: 'right',
  },
  reviewCard: {
    marginTop: 8,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  reviewAvatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.border,
    marginRight: 8,
  },
  reviewName: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  reviewTime: { fontSize: 11, color: '#9ca3af' },
  reviewStarsText: { fontSize: 13, color: COLORS.warning },
  reviewFooter: {
    flexDirection: 'row',
    marginTop: 6,
    columnGap: 16,
  },
  reviewMeta: { fontSize: 12, color: COLORS.textMuted },
  card: {
    marginTop: 8,
  },
  cardTitle: { fontSize: 14, fontWeight: '600', marginBottom: 2 },
  cardSubtitle: { fontSize: 12, color: COLORS.textMuted, marginBottom: 4 },
});
