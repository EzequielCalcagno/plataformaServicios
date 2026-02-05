// src/screens/Locations.tsx
import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Alert as RNAlert,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

import { Screen } from '../components/Screen';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { TopBar } from '../components/TopBar';
import { Alert } from '../components/Alert';

import { COLORS, SPACING, RADII, TYPO } from '../styles/theme';
import { getMyLocations, updateLocation, deleteLocation, LocationDto } from '../services/locations.client';

const MAX_LOCATIONS = 4;

// Storage
const FOLLOW_LIVE_KEY = '@app_follow_live_enabled';
const SELECTED_LOCATION_ID_KEY = '@app_selected_location_id';
const FOLLOW_LIVE_ID = 'follow_live';

export default function LocationsScreen() {
  const navigation = useNavigation<any>();

  const [locations, setLocations] = useState<LocationDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [submittingId, setSubmittingId] = useState<number | null>(null);

  const [alertMsg, setAlertMsg] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  const [followEnabled, setFollowEnabled] = useState(false);

  const loadLocations = useCallback(async () => {
    try {
      setAlertMsg(null);
      setOk(false);
      setLoading(true);

      const [data, follow] = await Promise.all([
        getMyLocations(),
        AsyncStorage.getItem(FOLLOW_LIVE_KEY),
      ]);

      setLocations(Array.isArray(data) ? data : []);
      setFollowEnabled(follow === '1');
    } catch (err: any) {
      console.log('❌ Error cargando ubicaciones:', err);
      setAlertMsg(err?.message || 'No se pudieron cargar tus ubicaciones. Intentá de nuevo.');
      setOk(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadLocations();
    }, [loadLocations]),
  );

  const principalId = useMemo(() => locations.find((l) => l.principal)?.id ?? null, [locations]);
  const canAdd = locations.length < MAX_LOCATIONS;

  const handleAddLocation = useCallback(() => {
    setAlertMsg(null);
    setOk(false);

    if (!canAdd) {
      setAlertMsg(`Límite alcanzado: solo podés guardar hasta ${MAX_LOCATIONS} ubicaciones.`);
      setOk(false);
      return;
    }
    navigation.navigate('LocationForm');
  }, [canAdd, navigation]);

  const handleEdit = useCallback(
    (loc: LocationDto) => navigation.navigate('LocationForm', { location: loc }),
    [navigation],
  );

  const handleSetPrincipal = useCallback(
    async (id: number) => {
      try {
        if (followEnabled) {
          setAlertMsg('Desactivá “Seguir mi ubicación” para poder elegir una principal.');
          setOk(false);
          return;
        }

        setSubmittingId(id);

        await AsyncStorage.setItem(FOLLOW_LIVE_KEY, '0');
        await updateLocation(id, { principal: true });

        setOk(true);
        setAlertMsg('Ubicación marcada como principal.');
        await loadLocations();
      } catch (err: any) {
        console.log('❌ Error setPrincipal:', err);
        setOk(false);
        setAlertMsg(err?.message || 'No se pudo marcar como principal.');
      } finally {
        setSubmittingId(null);
      }
    },
    [followEnabled, loadLocations],
  );

  const handleDelete = useCallback(
    (id: number) => {
      RNAlert.alert('Eliminar ubicación', '¿Seguro que querés eliminar esta ubicación?', [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              setSubmittingId(id);
              await deleteLocation(id);
              setLocations((prev) => prev.filter((l) => l.id !== id));
              setOk(true);
              setAlertMsg('Ubicación eliminada.');
            } catch (err: any) {
              console.log('❌ Error deleteLocation:', err);
              setOk(false);
              setAlertMsg(err?.message || 'No se pudo eliminar la ubicación.');
            } finally {
              setSubmittingId(null);
            }
          },
        },
      ]);
    },
    [],
  );

  const handleFollowLive = useCallback(() => {
    setAlertMsg(null);
    setOk(false);
    navigation.navigate('LocationForm', { followLive: true });
  }, [navigation]);

  const handleDisableFollow = useCallback(async () => {
    try {
      setSubmittingId(-1); // “modo submit global”

      await AsyncStorage.setItem(FOLLOW_LIVE_KEY, '0');
      const sel = await AsyncStorage.getItem(SELECTED_LOCATION_ID_KEY);
      if (sel === FOLLOW_LIVE_ID) await AsyncStorage.removeItem(SELECTED_LOCATION_ID_KEY);

      setOk(true);
      setAlertMsg('Seguimiento desactivado.');
      await loadLocations();
    } catch (e) {
      setOk(false);
      setAlertMsg('No se pudo desactivar el seguimiento.');
    } finally {
      setSubmittingId(null);
    }
  }, [loadLocations]);

  const FollowRow = () => (
    <Card style={styles.followCard} withShadow>
      <View style={styles.followRow}>
        <View style={styles.followLeft}>
          <View style={[styles.dot, followEnabled ? styles.dotOn : styles.dotOff]} />
          <View style={{ flex: 1 }}>
            <Text style={styles.followTitle}>Seguir mi ubicación</Text>
            <Text style={styles.followSubtitle}>
              {followEnabled
                ? 'Activo · se usa como principal en búsquedas'
                : 'Desactivado · se usa tu ubicación principal guardada'}
            </Text>
          </View>
        </View>

        <Button
          title={followEnabled ? 'Desactivar' : 'Activar'}
          variant={followEnabled ? 'neutral' : 'primary'}
          fullWidth={false}
          size="md"
          onPress={followEnabled ? handleDisableFollow : handleFollowLive}
          disabled={submittingId === -1}
          leftIcon={
            <Ionicons
              name={followEnabled ? 'pause-outline' : 'navigate-outline'}
              size={18}
              color={followEnabled ? COLORS.text : COLORS.buttonPrimaryText}
              style={{ marginRight: 6 }}
            />
          }
        />
      </View>
    </Card>
  );

  const renderItem = ({ item }: { item: LocationDto }) => {
    const isPrincipal = !!item.principal && !followEnabled;
    const busy = submittingId === item.id;

    return (
      <Card style={styles.locCard} withShadow>
        <View style={styles.locHeader}>
          <View style={styles.locIcon}>
            <Ionicons name="location-outline" size={18} color={COLORS.text} />
          </View>

          <View style={{ flex: 1 }}>
            <View style={styles.locTitleRow}>
              <Text style={styles.locName} numberOfLines={1}>
                {item.nombre_ubicacion || 'Ubicación'}
              </Text>
              {isPrincipal ? (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>Principal</Text>
                </View>
              ) : null}
            </View>

            <Text style={styles.locMeta} numberOfLines={1}>
              {item.ciudad || '—'}
            </Text>

            {!!item.direccion && (
              <Text style={styles.locAddress} numberOfLines={2}>
                {item.direccion}
              </Text>
            )}
          </View>
        </View>

        <View style={styles.actionsRow}>
          <Button
            title={isPrincipal ? 'Principal' : 'Marcar principal'}
            variant="outline"
            fullWidth={false}
            size="md"
            onPress={() => handleSetPrincipal(item.id)}
            disabled={busy || followEnabled || principalId === item.id}
            leftIcon={
              <Ionicons
                name="star-outline"
                size={18}
                color={COLORS.buttonOutlineText}
                style={{ marginRight: 6 }}
              />
            }
          />

          <Button
            title="Editar"
            variant="neutral"
            fullWidth={false}
            size="md"
            onPress={() => handleEdit(item)}
            disabled={busy}
            leftIcon={
              <Ionicons name="create-outline" size={18} color={COLORS.text} style={{ marginRight: 6 }} />
            }
          />

          <TouchableOpacity
            onPress={() => handleDelete(item.id)}
            disabled={busy}
            activeOpacity={0.85}
            style={[styles.iconDangerBtn, busy && { opacity: 0.6 }]}
          >
            <Ionicons name="trash-outline" size={18} color={COLORS.danger} />
          </TouchableOpacity>
        </View>
      </Card>
    );
  };

  return (
    <Screen>
      <TopBar
        title="Mis ubicaciones"
        showBack
        rightNode={
          <Button
            title="+ Agregar"
            variant="outline"
            fullWidth={false}
            onPress={handleAddLocation}
            disabled={!canAdd}
            size="md"
          />
        }
      />

      <View style={styles.container}>
        {alertMsg && (
          <Alert
            type={ok ? 'success' : 'error'}
            message={alertMsg}
            style={{ marginBottom: SPACING.md }}
          />
        )}

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator />
            <Text style={[TYPO.bodyMuted, { marginTop: 10 }]}>Cargando ubicaciones…</Text>
          </View>
        ) : (
          <>
            <FollowRow />

            {locations.length === 0 ? (
              <Card style={styles.emptyCard} withShadow>
                <Text style={TYPO.h3}>Todavía no tenés ubicaciones</Text>
                <Text style={[TYPO.subtitle, { marginTop: 6 }]}>
                  Guardá tus lugares frecuentes para buscar profesionales más rápido.
                </Text>
                <View style={{ marginTop: SPACING.md }}>
                  <Button title="Agregar ubicación" onPress={handleAddLocation} variant="primary" size="lg" />
                </View>
              </Card>
            ) : (
              <FlatList
                data={locations}
                keyExtractor={(it) => String(it.id)}
                renderItem={renderItem}
                contentContainerStyle={{ paddingBottom: SPACING.xl * 2 }}
                showsVerticalScrollIndicator={false}
              />
            )}
          </>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: SPACING.lg, paddingTop: SPACING.md },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: SPACING.lg },

  followCard: {
    marginBottom: SPACING.md,
    borderRadius: RADII.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    backgroundColor: COLORS.cardBg,
  },
  followRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  followLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },

  dot: { width: 10, height: 10, borderRadius: 999 },
  dotOn: { backgroundColor: COLORS.buttonPrimaryBg },
  dotOff: { backgroundColor: COLORS.border },

  followTitle: { ...TYPO.label, fontFamily: TYPO.label.fontFamily },
  followSubtitle: { ...TYPO.helper, marginTop: 2 },

  emptyCard: {
    marginTop: SPACING.sm,
    borderRadius: RADII.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    backgroundColor: COLORS.cardBg,
  },

  locCard: {
    marginBottom: SPACING.md,
    borderRadius: RADII.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    backgroundColor: COLORS.cardBg,
  },
  locHeader: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },

  locIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: COLORS.bgLightGrey,
    alignItems: 'center',
    justifyContent: 'center',
  },

  locTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  locName: { ...TYPO.h3, flex: 1 },
  locMeta: { ...TYPO.caption, marginTop: 2 },
  locAddress: { ...TYPO.body, marginTop: 6, color: COLORS.textMuted },

  badge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADII.pill,
    backgroundColor: COLORS.graySoft,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  badgeText: { ...TYPO.badge },

  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: SPACING.md,
  },

  iconDangerBtn: {
    width: 44,
    height: 44,
    borderRadius: RADII.pill,
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    backgroundColor: COLORS.cardBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
