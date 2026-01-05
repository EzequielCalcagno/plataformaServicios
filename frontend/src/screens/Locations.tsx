// src/screens/Locations.tsx
import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Alert, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { Screen } from '../components/Screen';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { TopBar } from '../components/TopBar';
import { COLORS, SPACING } from '../styles/theme';

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
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [followEnabled, setFollowEnabled] = useState(false);

  const loadLocations = useCallback(async () => {
    try {
      setErrorMsg(null);
      setLoading(true);

      const [data, follow] = await Promise.all([
        getMyLocations(),
        AsyncStorage.getItem(FOLLOW_LIVE_KEY),
      ]);

      setLocations(data);
      setFollowEnabled(follow === '1');
    } catch (err: any) {
      console.log('❌ Error cargando ubicaciones:', err);
      setErrorMsg(err?.message || 'No se pudieron cargar tus ubicaciones. Intentá de nuevo.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadLocations();
    }, [loadLocations]),
  );

  const handleSetPrincipal = async (id: number) => {
    try {
      setSubmittingId(id);

      // Si el usuario marca una ubicación principal, desactivamos "Seguir"
      await AsyncStorage.setItem(FOLLOW_LIVE_KEY, '0');

      await updateLocation(id, { principal: true });
      await loadLocations();
    } catch (err: any) {
      console.log('❌ Error setPrincipal:', err);
      Alert.alert('Error', err?.message || 'No se pudo marcar como principal.');
    } finally {
      setSubmittingId(null);
    }
  };

  const handleDelete = (id: number) => {
    Alert.alert('Eliminar ubicación', '¿Seguro que querés eliminar esta ubicación?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          try {
            setSubmittingId(id);
            await deleteLocation(id);
            setLocations((prev) => prev.filter((l) => l.id !== id));
          } catch (err: any) {
            console.log('❌ Error deleteLocation:', err);
            Alert.alert('Error', err?.message || 'No se pudo eliminar la ubicación.');
          } finally {
            setSubmittingId(null);
          }
        },
      },
    ]);
  };

  const handleEdit = (loc: LocationDto) => navigation.navigate('LocationForm', { location: loc });

  const handleAddLocation = () => {
    if (locations.length >= MAX_LOCATIONS) {
      Alert.alert('Límite alcanzado', `Solo podés guardar hasta ${MAX_LOCATIONS} ubicaciones.`);
      return;
    }
    navigation.navigate('LocationForm');
  };

  const handleFollowLive = async () => {
    // Abrimos el formulario en modo seguimiento
    navigation.navigate('LocationForm', { followLive: true });
  };

  const handleDisableFollow = async () => {
    await AsyncStorage.setItem(FOLLOW_LIVE_KEY, '0');
    // opcional: si estaba seleccionado "follow_live", lo limpiamos para que Search use principal
    const sel = await AsyncStorage.getItem(SELECTED_LOCATION_ID_KEY);
    if (sel === FOLLOW_LIVE_ID) await AsyncStorage.removeItem(SELECTED_LOCATION_ID_KEY);
    await loadLocations();
  };

  const FollowRow = () => (
    <Card style={styles.followCard} withShadow>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View style={styles.greenDot} />
          <View>
            <Text style={styles.followTitle}>Seguir mi ubicación</Text>
            <Text style={styles.followSubtitle}>
              {followEnabled ? 'Activo · se usa como principal en búsqueda' : 'Desactivado'}
            </Text>
          </View>
        </View>

        {followEnabled ? (
          <TouchableOpacity onPress={handleDisableFollow} style={styles.followOffBtn}>
            <Text style={styles.followOffText}>Desactivar</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={handleFollowLive} style={styles.followOnBtn}>
            <Text style={styles.followOnText}>Activar</Text>
          </TouchableOpacity>
        )}
      </View>
    </Card>
  );

  const renderItem = ({ item }: { item: LocationDto }) => {
    const isPrincipal = item.principal;

    return (
      <Card style={styles.card} withShadow>
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{item.nombre_ubicacion || 'Sin nombre'}</Text>
            <Text style={styles.city}>{item.ciudad || 'Sin ciudad'}</Text>
          </View>

          {isPrincipal && !followEnabled && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>Principal</Text>
            </View>
          )}
        </View>

        <Text style={styles.address}>{item.direccion || 'Sin dirección'}</Text>

        <View style={styles.actionsRow}>
          <Button
            title="Principal"
            variant="outline"
            fullWidth={false}
            style={styles.smallButton}
            onPress={() => handleSetPrincipal(item.id)}
            disabled={submittingId === item.id}
          />

          <Button
            title="Editar"
            variant="outline"
            fullWidth={false}
            style={styles.smallButton}
            onPress={() => handleEdit(item)}
            disabled={submittingId === item.id}
          />

          <Button
            title={submittingId === item.id ? 'Eliminando...' : 'Eliminar'}
            variant="outline"
            fullWidth={false}
            style={[styles.smallButton, styles.deleteButton]}
            textStyle={{ color: COLORS.danger }}
            disabled={submittingId === item.id}
            onPress={() => handleDelete(item.id)}
          />
        </View>
      </Card>
    );
  };

  return (
    <Screen>
      <TopBar
        title="Mis ubicaciones"
        showBack
        onPressBack={() => navigation.goBack()}
        rightNode={
          <Button
            title="+ Agregar"
            variant="outline"
            fullWidth={false}
            onPress={handleAddLocation}
            style={styles.addButton}
          />
        }
      />

      <View style={styles.container}>
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator />
            <Text style={styles.loadingText}>Cargando ubicaciones...</Text>
          </View>
        ) : errorMsg ? (
          <View style={styles.center}>
            <Text style={styles.errorText}>{errorMsg}</Text>
            <Button title="Reintentar" onPress={loadLocations} style={{ marginTop: SPACING.sm }} />
          </View>
        ) : (
          <>
            <FollowRow />

            {locations.length === 0 ? (
              <View style={styles.center}>
                <Text style={styles.emptyText}>Todavía no tenés ubicaciones guardadas.</Text>
                <Button title="Agregar ubicación" onPress={handleAddLocation} style={{ marginTop: SPACING.sm }} />
              </View>
            ) : (
              <FlatList
                data={locations}
                keyExtractor={(item) => String(item.id)}
                contentContainerStyle={{ paddingBottom: SPACING.xl * 2 }}
                renderItem={renderItem}
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
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { marginTop: 8, color: COLORS.text, fontSize: 14 },
  errorText: { color: COLORS.danger, fontSize: 14, textAlign: 'center' },
  emptyText: { color: COLORS.textMuted, fontSize: 14, textAlign: 'center' },

  followCard: { marginBottom: SPACING.md, padding: SPACING.md },
  greenDot: { width: 10, height: 10, borderRadius: 999, backgroundColor: '#22c55e' },
  followTitle: { fontSize: 14, fontWeight: '800', color: COLORS.text },
  followSubtitle: { marginTop: 2, fontSize: 12, fontWeight: '700', color: COLORS.textMuted },

  followOnBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#22c55e',
  },
  followOnText: { color: '#fff', fontWeight: '900', fontSize: 12 },

  followOffBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#e5e7eb',
  },
  followOffText: { color: '#111827', fontWeight: '900', fontSize: 12 },

  card: { marginBottom: SPACING.md },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  name: { fontSize: 16, fontWeight: '600', color: COLORS.text },
  city: { fontSize: 13, color: COLORS.textMuted },
  address: { fontSize: 13, color: COLORS.text, marginTop: 4, marginBottom: 8 },

  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999, backgroundColor: '#DCFCE7' },
  badgeText: { fontSize: 11, color: '#166534', fontWeight: '600' },

  actionsRow: { flexDirection: 'row', marginTop: 4, flexWrap: 'wrap', gap: 8 },
  smallButton: { flex: 1, minWidth: 90 },
  deleteButton: { borderColor: COLORS.danger },
  addButton: { paddingHorizontal: 10, paddingVertical: 4 },
});
