// src/screens/BecomePro.tsx
import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { Ionicons } from '@expo/vector-icons';

import { Screen } from '../components/Screen';
import { TopBar } from '../components/TopBar';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Alert } from '../components/Alert';
import { COLORS, SPACING, RADII, TYPO } from '../styles/theme';

const API_URL = (Constants.expoConfig?.extra?.API_URL as string)?.replace(/\/+$/, '') || '';

type Props = { navigation: any; route: any };

type Progress = {
  hasProProfile: boolean;
  hasService: boolean;
  hasLocation: boolean;
};

export default function BecomePro({ navigation, route }: Props) {
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState<Progress>({
    hasProProfile: false,
    hasService: false,
    hasLocation: false,
  });

  const [alertMsg, setAlertMsg] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [activating, setActivating] = useState(false);

  const serviceCreated = !!route?.params?.serviceCreated;

  const loadProgress = useCallback(async () => {
    try {
      setLoading(true);
      setAlertMsg(null);
      setOk(false);

      const token = await AsyncStorage.getItem('@token');
      if (!token) {
        setAlertMsg('No hay sesión activa.');
        setOk(false);
        return;
      }

      // Perfil profesional existe?
      const proProfileRes = await fetch(`${API_URL}/private/pro-onboarding/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const proData = proProfileRes.ok ? await proProfileRes.json() : null;
      const hasProProfile =
        !!String(proData?.especialidad || '').trim() && !!String(proData?.descripcion || '').trim();

      //  Tiene servicios?

      let hasService = false;
      try {
        const servicesRes = await fetch(`${API_URL}/private/pro-onboarding/services`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const list = servicesRes.ok ? await servicesRes.json() : [];
        hasService = Array.isArray(list) && list.length > 0;
      } catch {
        hasService = false;
      }

      // Tiene ubicación principal (o activo el sueguir)?
      let hasLocation = false;
      try {
        const follow = await AsyncStorage.getItem('@app_follow_live_enabled');
        if (follow === '1') {
          hasLocation = true;
        } else {
          const locRes = await fetch(`${API_URL}/private/locations`, {
            headers: { Authorization: `Bearer ${token}` },
          });

          if (locRes.ok) {
            const locs = await locRes.json();
            const arr = Array.isArray(locs) ? locs : (locs?.items ?? []);
            hasLocation = arr.some((l: any) => !!l?.principal);
          }
        }
      } catch {
        hasLocation = false;
      }

      setProgress({ hasProProfile, hasService, hasLocation });

      if (serviceCreated) {
        setOk(true);
        setAlertMsg('Servicio agregado. Estás a un paso de activarte como profesional.');
      }
    } finally {
      setLoading(false);
    }
  }, [serviceCreated]);

  useFocusEffect(
    useCallback(() => {
      loadProgress();
    }, [loadProgress]),
  );

  const canActivate = useMemo(
    () => progress.hasProProfile && progress.hasService && progress.hasLocation,
    [progress.hasProProfile, progress.hasService, progress.hasLocation],
  );

  const handleActivate = useCallback(async () => {
    try {
      setActivating(true);
      setAlertMsg(null);
      setOk(false);

      if (!canActivate) {
        setAlertMsg(
          'Completá el perfil, agregá un servicio y configurá una ubicación principal (o activá “Seguir mi ubicación”).',
        );
        setOk(false);
        return;
      }
      const token = await AsyncStorage.getItem('@token');

      const res = await fetch(`${API_URL}/private/become-pro/activate`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setOk(false);
        setAlertMsg(data?.message || 'No se pudo activar.');
        return;
      }

      setOk(true);
      setAlertMsg('Listo. Tu cuenta ya está activa como profesional.');

      // Volvé a Account y refrescá visualmente
      navigation.reset({
        index: 0,
        routes: [{ name: 'MainTabs', params: { screen: 'Cuenta' } }],
      });
    } catch (e) {
      setOk(false);
      setAlertMsg('No se pudo activar el modo profesional.');
    } finally {
      setActivating(false);
    }
  }, [canActivate, navigation]);

  const StepRow = ({
    title,
    subtitle,
    done,
    onPress,
  }: {
    title: string;
    subtitle: string;
    done: boolean;
    onPress: () => void;
  }) => (
    <TouchableOpacity activeOpacity={0.9} onPress={onPress}>
      <Card style={styles.stepCard} withShadow>
        <View style={styles.stepRow}>
          <View style={[styles.stepIcon, done ? styles.stepIconDone : styles.stepIconTodo]}>
            <Ionicons
              name={done ? 'checkmark' : 'ellipse-outline'}
              size={18}
              color={done ? COLORS.buttonPrimaryText : COLORS.text}
            />
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.stepTitle}>{title}</Text>
            <Text style={styles.stepSubtitle}>{subtitle}</Text>
          </View>

          <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
        </View>
      </Card>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <Screen>
        <TopBar title="Convertirme en profesional" showBack />
        <View style={styles.center}>
          <ActivityIndicator />
          <Text style={[TYPO.bodyMuted, { marginTop: 10 }]}>Cargando…</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <TopBar title="Convertirme en profesional" showBack />

      <View style={styles.container}>
        <Text style={TYPO.h2}>Activá tu perfil profesional</Text>
        <Text style={[TYPO.subtitle, { marginTop: 6 }]}>
          Para aparecer en búsquedas necesitás completar el perfil y publicar al menos un servicio.
        </Text>

        {alertMsg && (
          <Alert
            type={ok ? 'success' : 'error'}
            message={alertMsg}
            style={{ marginTop: SPACING.md }}
          />
        )}

        <View style={{ marginTop: SPACING.lg, gap: SPACING.md }}>
          <StepRow
            title="1) Perfil profesional"
            subtitle={progress.hasProProfile ? 'Completo' : 'Agregá especialidad y descripción'}
            done={progress.hasProProfile}
            onPress={() => navigation.navigate('EditProfile', { fromBecomePro: true })}
          />

          <StepRow
            title="2) Publicar primer servicio"
            subtitle={
              progress.hasService
                ? 'Ya tenés servicios'
                : 'Publicá algo concreto para que te contraten'
            }
            done={progress.hasService}
            onPress={() => navigation.navigate('MyServicesManager', { fromBecomePro: true })}
          />

          <StepRow
            title="3) Ubicación"
            subtitle={
              progress.hasLocation
                ? 'Configurada (tenés una principal)'
                : 'Agregá una ubicación y marcá una como principal'
            }
            done={progress.hasLocation}
            onPress={() => navigation.navigate('Locations', { fromBecomePro: true })}
          />
        </View>

        <View style={{ marginTop: SPACING.xl }}>
          <Button
            title={
              activating
                ? 'Activando…'
                : canActivate
                  ? 'Activar como profesional'
                  : 'Completá todos los pasos para activar'
            }
            variant={canActivate ? 'primary' : 'neutral'}
            size="lg"
            onPress={handleActivate}
            disabled={!canActivate || activating}
          />

          <TouchableOpacity
            onPress={loadProgress}
            activeOpacity={0.85}
            style={{ alignSelf: 'center', marginTop: SPACING.md }}
          >
            <Text style={[TYPO.caption, { color: COLORS.textMuted }]}>Actualizar progreso</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: SPACING.lg, paddingTop: SPACING.md },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: SPACING.lg },

  stepCard: {
    borderRadius: RADII.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    backgroundColor: COLORS.cardBg,
  },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },

  stepIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepIconDone: { backgroundColor: COLORS.buttonPrimaryBg },
  stepIconTodo: { backgroundColor: COLORS.bgLightGrey },

  stepTitle: { ...TYPO.h3 },
  stepSubtitle: { ...TYPO.caption, marginTop: 2 },
});
