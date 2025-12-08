// src/screens/Home.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { getCurrentUser, UserResponse } from '../services/user.client';
import { ApiError } from '../utils/http';
import { mapRolFromId } from '../utils/roles';

// 🔹 Componentes genéricos
import { MainMenu } from '../navigation/MainMenu';
import { AppScreen } from '../components/AppScreen';
import { AppCard } from '../components/AppCard';
import { AppButton } from '../components/AppButton';
import { SectionTitle } from '../components/SectionTitle';
import { COLORS, SPACING, RADII } from '../styles/theme';

export default function Home() {
  const navigation = useNavigation<any>();
  const [profile, setProfile] = useState<UserResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const isProfessional = mapRolFromId(profile?.id_rol) === 'professional';
  const firstName = profile?.nombre ? profile.nombre.split(' ')[0] : 'User';

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const data = await getCurrentUser();

        setProfile(data);
      } catch (err) {
        console.error('Error cargando perfil en Home:', err);

        // Si el error es 401, redirigir al login
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

  // ===== ESTADOS ESPECIALES =====

  if (loading) {
    return (
      <AppScreen>
        <View style={styles.center}>
          <ActivityIndicator />
          <Text style={styles.loadingText}>Cargando...</Text>
        </View>
      </AppScreen>
    );
  }

  if (!profile) {
    return (
      <AppScreen>
        <View style={styles.center}>
          <Text style={styles.errorText}>No se pudo cargar tu información.</Text>
          <AppButton
            title="Volver a iniciar sesión"
            onPress={() => navigation.reset({ index: 0, routes: [{ name: 'Login' }] })}
            style={{ marginTop: SPACING.sm }}
          />
        </View>
      </AppScreen>
    );
  }

  // ===== RENDER PRINCIPAL =====

  return (
    <AppScreen>
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        {/* HERO */}
        <AppCard style={styles.heroCard} withShadow>
          <Text style={styles.heroTitle}>
            Hi {firstName} 👋{'\n'}what needs fixing today?
          </Text>
          <Text style={styles.heroSubtitle}>Book with the professional today!</Text>

          <AppButton
            title={isProfessional ? 'Ver solicitudes' : 'Ver profesionales disponibles'}
            onPress={() => {
              if (isProfessional) {
                navigation.navigate('Bookings');
              } else {
                navigation.navigate('Search');
              }
            }}
            style={styles.heroButton}
          />
        </AppCard>

        {/* MENÚ PRINCIPAL */}
        <SectionTitle>{isProfessional ? 'Tu panel' : '¿Qué querés hacer hoy?'}</SectionTitle>

        <MainMenu role={isProfessional ? 'professional' : 'client'} />

        {/* RESUMEN PROFESIONAL */}
        {isProfessional && (
          <>
            <SectionTitle>Resumen rápido</SectionTitle>
            <View style={styles.summaryRow}>
              <AppCard style={styles.summaryCard}>
                <Text style={styles.summaryNumber}>{profile.jobsCompleted ?? 0}</Text>
                <Text style={styles.summaryLabel}>Trabajos completados</Text>
              </AppCard>
              <AppCard style={styles.summaryCard}>
                <Text style={styles.summaryNumber}>{profile.rating?.toFixed(1) ?? '0.0'}</Text>
                <Text style={styles.summaryLabel}>Rating</Text>
              </AppCard>
            </View>
          </>
        )}
      </ScrollView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.xl * 2,
  },
  heroCard: {
    borderRadius: RADII.lg,
    marginBottom: SPACING.xl,
    backgroundColor: '#111827', // mantenemos el hero dark
  },
  heroTitle: {
    color: 'white',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
  },
  heroSubtitle: {
    color: '#E5E7EB',
    fontSize: 13,
    marginBottom: 16,
  },
  heroButton: {
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
    marginTop: SPACING.sm,
  },
  menuCard: {
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: RADII.lg,
  },
  menuLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 32,
    marginTop: SPACING.sm,
  },
  summaryCard: {
    flex: 1,
    borderRadius: RADII.lg,
    paddingVertical: 16,
    paddingHorizontal: 12,
  },
  summaryNumber: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
    color: COLORS.text,
  },
  summaryLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.bg,
    paddingHorizontal: SPACING.lg,
  },
  loadingText: {
    marginTop: 8,
    fontSize: 16,
    color: COLORS.text,
  },
  errorText: {
    fontSize: 14,
    color: COLORS.danger,
    marginBottom: 12,
    textAlign: 'center',
  },
});
