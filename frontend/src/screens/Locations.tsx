// src/screens/Locations.tsx
import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Alert, ActivityIndicator } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';

import { AppScreen } from '../components/AppScreen';
import { AppCard } from '../components/AppCard';
import { AppButton } from '../components/AppButton';
import { TopBar } from '../components/TopBar';
import { COLORS, SPACING, RADII } from '../styles/theme';

import {
  getMyLocations,
  updateLocation,
  deleteLocation,
  LocationDto,
} from '../services/locations.client';

export default function LocationsScreen() {
  const navigation = useNavigation<any>();

  const [locations, setLocations] = useState<LocationDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [submittingId, setSubmittingId] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadLocations = useCallback(async () => {
    try {
      setErrorMsg(null);
      setLoading(true);
      const data = await getMyLocations();
      setLocations(data);
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

  const handleEdit = (loc: LocationDto) => {
    navigation.navigate('LocationForm', { location: loc });
  };

  const handleAddLocation = () => {
    navigation.navigate('LocationForm');
  };

  const renderItem = ({ item }: { item: LocationDto }) => {
    const isPrincipal = item.principal;

    return (
      <AppCard style={styles.card} withShadow>
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{item.nombre_ubicacion || 'Sin nombre'}</Text>
            <Text style={styles.city}>{item.ciudad || 'Sin ciudad'}</Text>
          </View>

          {isPrincipal && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>Principal</Text>
            </View>
          )}
        </View>

        <Text style={styles.address}>{item.direccion || 'Sin dirección'}</Text>

        <View style={styles.actionsRow}>
          <AppButton
            title="Editar"
            variant="outline"
            fullWidth={false}
            style={styles.smallButton}
            onPress={() => handleEdit(item)}
          />

          <AppButton
            title={submittingId === item.id ? 'Eliminando...' : 'Eliminar'}
            variant="outline"
            fullWidth={false}
            style={[styles.smallButton, styles.deleteButton]}
            textStyle={{ color: COLORS.danger }}
            disabled={submittingId === item.id}
            onPress={() => handleDelete(item.id)}
          />
        </View>
      </AppCard>
    );
  };

  return (
    <AppScreen>
      <TopBar
        title="Mis ubicaciones"
        showBack
        onPressBack={() => navigation.goBack()}
        rightNode={
          <AppButton
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
            <AppButton
              title="Reintentar"
              onPress={loadLocations}
              style={{ marginTop: SPACING.sm }}
            />
          </View>
        ) : locations.length === 0 ? (
          <View style={styles.center}>
            <Text style={styles.emptyText}>Todavía no tenés ubicaciones guardadas.</Text>
            <AppButton
              title="Agregar ubicación"
              onPress={handleAddLocation}
              style={{ marginTop: SPACING.sm }}
            />
          </View>
        ) : (
          <FlatList
            data={locations}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={{ paddingBottom: SPACING.xl * 2 }}
            renderItem={renderItem}
          />
        )}
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 8,
    color: COLORS.text,
    fontSize: 14,
  },
  errorText: {
    color: COLORS.danger,
    fontSize: 14,
    textAlign: 'center',
  },
  emptyText: {
    color: COLORS.textMuted,
    fontSize: 14,
    textAlign: 'center',
  },
  card: {
    marginBottom: SPACING.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  city: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
  address: {
    fontSize: 13,
    color: COLORS.text,
    marginTop: 4,
    marginBottom: 8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: '#DCFCE7',
  },
  badgeText: {
    fontSize: 11,
    color: '#166534',
    fontWeight: '600',
  },
  actionsRow: {
    flexDirection: 'row',
    marginTop: 4,
    columnGap: 8,
  },
  smallButton: {
    flex: 1,
  },
  deleteButton: {
    borderColor: COLORS.danger,
  },
  addButton: {
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
});
