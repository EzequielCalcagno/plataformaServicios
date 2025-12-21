// src/screens/LocationForm.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, Switch } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import MapView, { Marker, MapPressEvent, Region } from 'react-native-maps';
import * as ExpoLocation from 'expo-location';

import { AppScreen } from '../components/Screen';
import { AppInput } from '../components/Input';
import { Button } from '../components/Button';
import { TopBar } from '../components/TopBar';
import { COLORS, SPACING, RADII } from '../styles/theme';
import { createLocation, updateLocation, LocationDto } from '../services/locations.client';

type RouteParams = {
  location?: LocationDto;
};

export default function LocationForm() {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const params = route.params as RouteParams | undefined;
  const editingLocation = params?.location;

  const isEditMode = !!editingLocation;

  // Usamos lat/lng que vienen del backend
  const initialLat = editingLocation?.lat ?? -34.9011; // fallback Mvd
  const initialLng = editingLocation?.lng ?? -56.1645;

  const [nombre, setNombre] = useState(editingLocation?.nombre_ubicacion ?? '');
  const [ciudad, setCiudad] = useState(editingLocation?.ciudad ?? '');
  const [direccion, setDireccion] = useState(editingLocation?.direccion ?? '');
  const [principal, setPrincipal] = useState(editingLocation?.principal ?? false);
  const [loading, setLoading] = useState(false);

  const [lat, setLat] = useState<number | null>(initialLat);
  const [lng, setLng] = useState<number | null>(initialLng);
  const [region, setRegion] = useState<Region>({
    latitude: initialLat,
    longitude: initialLng,
    latitudeDelta: 0.03,
    longitudeDelta: 0.03,
  });

  const handleMapPress = async (e: MapPressEvent) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    setLat(latitude);
    setLng(longitude);
    setRegion((prev) => ({
      ...prev,
      latitude,
      longitude,
    }));

    // Intentamos reverse geocode para rellenar ciudad/dirección
    try {
      const { status } = await ExpoLocation.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('Permiso de ubicación denegado para reverse geocode');
        return;
      }

      const results = await ExpoLocation.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      if (results && results.length > 0) {
        const r = results[0];
        const ciudadNueva = r.city || r.subregion || r.region || ciudad; // lo que venga

        const dirParts = [
          r.street || '',
          r.name && r.name !== r.street ? r.name : '',
          r.postalCode || '',
        ].filter(Boolean);

        const direccionNueva = dirParts.join(', ');

        if (!ciudad || ciudad !== ciudadNueva) {
          setCiudad(ciudadNueva || ciudad);
        }

        // Solo pisamos dirección si estaba vacía o es distinta
        if (!direccion || direccion !== direccionNueva) {
          if (direccionNueva) {
            setDireccion(direccionNueva);
          }
        }
      }
    } catch (err) {
      console.log('Error en reverseGeocodeAsync:', err);
      // No tiramos Alert acá para no molestar al user, solo log
    }
  };

  const handleSubmit = async () => {
    if (!ciudad.trim() || !direccion.trim()) {
      Alert.alert('Datos incompletos', 'La ciudad y la dirección son obligatorias.');
      return;
    }

    if (lat == null || lng == null) {
      Alert.alert(
        'Ubicación en el mapa',
        'Tenés que elegir un punto en el mapa tocando donde querés guardar la ubicación.',
      );
      return;
    }

    try {
      setLoading(true);

      const payload = {
        nombre_ubicacion: nombre.trim() || undefined,
        ciudad: ciudad.trim(),
        direccion: direccion.trim(),
        lat,
        lng,
        principal,
      };

      console.log('Payload a enviar:', payload);

      if (isEditMode && editingLocation) {
        await updateLocation(editingLocation.id, payload);
      } else {
        await createLocation(payload);
      }

      navigation.goBack(); // LocationsScreen recarga con useFocusEffect
    } catch (err: any) {
      console.log('❌ Error guardando ubicación:', err);
      Alert.alert('Error', err?.message || 'No se pudo guardar la ubicación.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppScreen>
      <TopBar
        title={isEditMode ? 'Editar ubicación' : 'Nueva ubicación'}
        showBack
        onPressBack={() => navigation.goBack()}
      />

      <View style={styles.container}>
        {/* MAPA PARA SELECCIONAR PUNTO */}
        <Text style={styles.label}>Elegí la ubicación en el mapa</Text>
        <View style={styles.mapContainer}>
          <MapView
            style={styles.map}
            initialRegion={region}
            region={region}
            onRegionChangeComplete={setRegion}
            onPress={handleMapPress}
          >
            {lat != null && lng != null && (
              <Marker coordinate={{ latitude: lat, longitude: lng }} />
            )}
          </MapView>
        </View>

        <Text style={styles.coordsText}>
          {lat != null && lng != null
            ? `Lat: ${lat.toFixed(5)} | Lng: ${lng.toFixed(5)}`
            : 'Tocá en el mapa para elegir un punto'}
        </Text>

        {/* CAMPOS DE TEXTO */}
        <Text style={styles.label}>Nombre de la ubicación</Text>
        <AppInput
          placeholder="Casa, Oficina..."
          value={nombre}
          onChangeText={setNombre}
          autoCapitalize="sentences"
        />

        <Text style={styles.label}>Ciudad</Text>
        <AppInput
          placeholder="Montevideo"
          value={ciudad}
          onChangeText={setCiudad}
          autoCapitalize="words"
        />

        <Text style={styles.label}>Dirección</Text>
        <AppInput
          placeholder="Ej: 18 de Julio 1234, apto 301"
          value={direccion}
          onChangeText={setDireccion}
          autoCapitalize="sentences"
          multiline
        />

        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Marcar como principal</Text>
          <Switch
            value={principal}
            onValueChange={setPrincipal}
            trackColor={{ false: '#d1d5db', true: COLORS.primary }}
            thumbColor="#fff"
          />
        </View>

        <Button
          title={loading ? 'Guardando...' : isEditMode ? 'Guardar cambios' : 'Guardar ubicación'}
          onPress={handleSubmit}
          disabled={loading}
          style={{ marginTop: SPACING.lg }}
        />
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
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 6,
    marginTop: SPACING.sm,
  },
  mapContainer: {
    height: 220,
    borderRadius: RADII.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 4,
  },
  map: {
    flex: 1,
  },
  coordsText: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginBottom: SPACING.sm,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: SPACING.lg,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: RADII.lg,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  switchLabel: {
    fontSize: 14,
    color: COLORS.text,
  },
});
