// src/screens/Profile.tsx
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ScrollView,
  Image,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { RootStackParamList } from '../../App';

type Props = NativeStackScreenProps<RootStackParamList, 'Profile'>;

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
  const { role } = route.params; // 'professional' | 'client'
  const isProfessional = role === 'professional';

  const [showMenu, setShowMenu] = useState(false);
  const [professionalProfile, setProfessionalProfile] =
    useState<ProfessionalProfile | null>(null);
  const [clientProfile, setClientProfile] = useState<ClientProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // 🔹 función reutilizable para cargar el perfil
  const loadProfile = useCallback(async () => {
    try {
      setErrorMsg(null);
      setLoading(true);

      const token = await AsyncStorage.getItem('@token');
      if (!token) {
        setErrorMsg('No hay sesión activa. Volvé a iniciar sesión.');
        return;
      }

      const res = await fetch(`${API_URL}/v1/profiles/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) {
        const txt = await res.text();
        console.log('Error al cargar perfil', res.status, txt);
        setErrorMsg(`Error al cargar perfil (${res.status})`);
        return;
      }

      const data = await res.json();

      if (isProfessional) {
        setProfessionalProfile(data as ProfessionalProfile);
        setClientProfile(null);
      } else {
        setClientProfile(data as ClientProfile);
        setProfessionalProfile(null);
      }
    } catch (e) {
      console.log('Error loadProfile', e);
      setErrorMsg('Error de red al cargar el perfil.');
    } finally {
      setLoading(false);
    }
  }, [isProfessional]);

  // 🔁 Se dispara cada vez que la pantalla Profile gana foco
  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [loadProfile])
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
    await AsyncStorage.multiRemove(['@token', '@user', '@role']);
    navigation.replace('Login');
  };

  // Estados de carga / error
  if (loading) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={{ padding: 20 }}>
          <Text>Cargando perfil...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (errorMsg) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={{ padding: 20 }}>
          <Text style={{ marginBottom: 12 }}>{errorMsg}</Text>
          <TouchableOpacity
            onPress={handleLogout}
            style={{
              backgroundColor: '#2563eb',
              paddingVertical: 10,
              paddingHorizontal: 16,
              borderRadius: 12,
            }}
          >
            <Text style={{ color: '#fff', textAlign: 'center' }}>
              Volver al login
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (isProfessional && !professionalProfile) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={{ padding: 20 }}>
          <Text>No se pudo cargar el perfil profesional.</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!isProfessional && !clientProfile) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={{ padding: 20 }}>
          <Text>No se pudo cargar el perfil del cliente.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      {/* HEADER SIMPLE con tuerca */}
      <View style={styles.topBar}>
        <View style={{ width: 24 }} />
        <Text style={styles.topBarTitle}>Profile</Text>
        <TouchableOpacity onPress={handlePressSettings} style={styles.settingsButton}>
          <Text style={{ fontSize: 20 }}>⚙️</Text>
        </TouchableOpacity>

        {showMenu && (
          <View style={styles.menu}>
            <TouchableOpacity onPress={handleEditProfile} style={styles.menuItem}>
              <Text style={styles.menuItemText}>Edit Profile</Text>
            </TouchableOpacity>

            {isProfessional && (
              <TouchableOpacity onPress={handleAddService} style={styles.menuItem}>
                <Text style={styles.menuItemText}>Add Service</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              onPress={handleLogout}
              style={[styles.menuItem, { borderTopWidth: 1, borderTopColor: '#eee' }]}
            >
              <Text style={[styles.menuItemText, { color: '#d11' }]}>Log Out</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {isProfessional && professionalProfile ? (
          <>
            {/* CARD PRINCIPAL PROFESIONAL */}
            <View style={styles.profileCard}>
              <Image
                source={{ uri: professionalProfile.photoUrl }}
                style={styles.avatar}
              />
              <Text style={styles.name}>{professionalProfile.name}</Text>
              <Text style={styles.specialty}>{professionalProfile.specialty}</Text>
              <Text style={styles.location}>{professionalProfile.location}</Text>

              <View style={styles.statsRow}>
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>{professionalProfile.rating}</Text>
                  <Text style={styles.statLabel}>Rating</Text>
                </View>

                {/* Jobs clickeable */}
                <TouchableOpacity
                  style={styles.statCard}
                  activeOpacity={0.7}
                  onPress={() => navigation.navigate('Jobs')}
                >
                  <Text style={styles.statValue}>
                    {professionalProfile.jobsCompleted}
                  </Text>
                  <Text style={styles.statLabel}>Jobs</Text>
                </TouchableOpacity>

                <View style={styles.statCard}>
                  <Text style={styles.statValue}>
                    {professionalProfile.positiveFeedback}%
                  </Text>
                  <Text style={styles.statLabel}>Positive</Text>
                </View>
              </View>

              <View style={styles.actionsRow}>
                <TouchableOpacity style={[styles.actionButton, styles.whatsappBtn]}>
                  <Text style={styles.actionText}>WhatsApp</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionButton, styles.primaryBtn]}>
                  <Text style={[styles.actionText, { color: '#fff' }]}>
                    Request Service
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* ABOUT */}
            <Text style={styles.sectionTitle}>About</Text>
            <Text style={styles.paragraph}>{professionalProfile.about}</Text>

            {/* PHOTOS */}
            <Text style={styles.sectionTitle}>Photos</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {professionalProfile.photos.map((p) => (
                <Image key={p.id} source={{ uri: p.url }} style={styles.photo} />
              ))}
            </ScrollView>

            {/* REVIEWS */}
            <Text style={styles.sectionTitle}>Reviews</Text>

            <View style={styles.reviewSummary}>
              <View style={{ alignItems: 'center', marginRight: 16 }}>
                <Text style={styles.summaryRating}>
                  {professionalProfile.rating}
                </Text>
                <Text style={styles.summaryStars}>★★★★☆</Text>
                <Text style={styles.summaryCount}>
                  {professionalProfile.ratingSummary.totalReviews} reviews
                </Text>
              </View>

              <View style={{ flex: 1 }}>
                {professionalProfile.ratingSummary.distribution.map((item) => (
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
                ))}
              </View>
            </View>

            <FlatList
              data={professionalProfile.reviews}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              renderItem={({ item }) => (
                <View style={styles.reviewCard}>
                  <View style={styles.reviewHeader}>
                    <View style={styles.reviewAvatarPlaceholder} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.reviewName}>{item.clientName}</Text>
                      <Text style={styles.reviewTime}>{item.timeAgo}</Text>
                    </View>
                    <Text style={styles.reviewStars}>
                      {'★'.repeat(item.rating)}{' '}
                      {'☆'.repeat(5 - item.rating)}
                    </Text>
                  </View>
                  <Text style={styles.paragraph}>{item.comment}</Text>

                  <View style={styles.reviewFooter}>
                    <Text style={styles.reviewMeta}>👍 {item.likes}</Text>
                    <Text style={styles.reviewMeta}>💬 {item.replies}</Text>
                  </View>
                </View>
              )}
            />
          </>
        ) : (
          clientProfile && (
            <>
              {/* CARD PRINCIPAL CLIENTE */}
              <View style={styles.profileCard}>
                <Image
                  source={{ uri: clientProfile.photoUrl }}
                  style={styles.avatar}
                />
                <Text style={styles.name}>{clientProfile.name}</Text>
                <Text style={styles.location}>{clientProfile.location}</Text>

                <View style={[styles.statsRow, { marginTop: 16 }]}>
                  <View style={styles.statCard}>
                    <Text style={styles.statValue}>
                      {clientProfile.pendingRequests.length}
                    </Text>
                    <Text style={styles.statLabel}>Pending</Text>
                  </View>
                </View>
              </View>

              {/* DATOS DE CONTACTO */}
              <Text style={styles.sectionTitle}>Contact</Text>
              <View style={styles.card}>
                <Text style={styles.paragraph}>Email: {clientProfile.email}</Text>
                <Text style={styles.paragraph}>Phone: {clientProfile.phone}</Text>
              </View>

              {/* SOLICITUDES PENDIENTES */}
              <Text style={styles.sectionTitle}>Pending Requests</Text>
              {clientProfile.pendingRequests.length === 0 ? (
                <Text style={styles.paragraph}>
                  You have no pending service requests.
                </Text>
              ) : (
                clientProfile.pendingRequests.map((req) => (
                  <View key={req.id} style={styles.card}>
                    <Text style={styles.cardTitle}>{req.serviceType}</Text>
                    <Text style={styles.cardSubtitle}>
                      Professional: {req.professionalName}
                    </Text>
                    <Text style={styles.paragraph}>Status: {req.status}</Text>
                    <Text style={styles.reviewTime}>{req.createdAt}</Text>
                  </View>
                ))
              )}
            </>
          )
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f5f7fb' },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e5e7eb',
    zIndex: 20, // para que el menú quede arriba
  },
  topBarTitle: { fontSize: 16, fontWeight: '600' },
  settingsButton: { padding: 4 },
  menu: {
    position: 'absolute',
    top: 42,
    right: 16,
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingVertical: 4,
    minWidth: 160,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 20,
    zIndex: 40,
  },
  menuItem: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  menuItemText: { fontSize: 14, color: '#111827' },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  profileCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 12,
  },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: 42,
    marginBottom: 8,
  },
  name: { fontSize: 20, fontWeight: '700', marginTop: 4 },
  specialty: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  location: {
    fontSize: 13,
    color: '#9ca3af',
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    marginTop: 16,
    justifyContent: 'space-between',
    width: '100%',
  },
  statCard: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    marginHorizontal: 4,
    borderRadius: 14,
    paddingVertical: 10,
    alignItems: 'center',
  },
  statValue: { fontSize: 16, fontWeight: '700', color: '#111827' },
  statLabel: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  actionsRow: {
    flexDirection: 'row',
    marginTop: 16,
    width: '100%',
  },
  actionButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 4,
    borderWidth: 1,
  },
  whatsappBtn: {
    borderColor: '#22c55e',
    backgroundColor: '#ecfdf3',
  },
  primaryBtn: {
    borderColor: '#2563eb',
    backgroundColor: '#2563eb',
  },
  actionText: { fontSize: 14, fontWeight: '600', color: '#16a34a' },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 18,
    marginBottom: 6,
    color: '#111827',
  },
  paragraph: {
    fontSize: 14,
    color: '#4b5563',
    marginBottom: 4,
  },
  photo: {
    width: 180,
    height: 120,
    borderRadius: 16,
    marginRight: 10,
    marginTop: 6,
  },
  reviewSummary: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    marginTop: 8,
    marginBottom: 8,
  },
  summaryRating: { fontSize: 24, fontWeight: '700', color: '#111827' },
  summaryStars: { fontSize: 16, color: '#fbbf24', marginTop: 2 },
  summaryCount: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  distrRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 2,
  },
  distrLabel: { width: 16, fontSize: 12, color: '#4b5563' },
  distrBarBg: {
    flex: 1,
    height: 6,
    borderRadius: 999,
    backgroundColor: '#e5e7eb',
    marginHorizontal: 6,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  distrBarFill: {
    height: 6,
    borderRadius: 999,
    backgroundColor: '#fbbf24',
  },
  distrPercent: { width: 32, fontSize: 11, color: '#6b7280', textAlign: 'right' },
  reviewCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 12,
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
    backgroundColor: '#e5e7eb',
    marginRight: 8,
  },
  reviewName: { fontSize: 14, fontWeight: '600', color: '#111827' },
  reviewTime: { fontSize: 11, color: '#9ca3af' },
  reviewStars: { fontSize: 13, color: '#fbbf24' },
  reviewFooter: {
    flexDirection: 'row',
    marginTop: 6,
    columnGap: 16,
  },
  reviewMeta: { fontSize: 12, color: '#6b7280' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 12,
    marginTop: 8,
  },
  cardTitle: { fontSize: 14, fontWeight: '600', marginBottom: 2 },
  cardSubtitle: { fontSize: 12, color: '#6b7280', marginBottom: 4 },
});
