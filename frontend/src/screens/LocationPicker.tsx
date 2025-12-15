// src/screens/LocationPicker.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, Region } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Props = {
  navigation: any;
};

type StoredLocation = {
  id: string;
  label: string;
  latitude: number;
  longitude: number;
};

const LOCATIONS_KEY = '@app_locations';
const SELECTED_LOCATION_ID_KEY = '@app_selected_location_id';
const MAX_LOCATIONS = 4;

// Montevideo por defecto
const DEFAULT_REGION: Region = {
  latitude: -34.9011,
  longitude: -56.1645,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

export default function LocationPicker({ navigation }: Props) {
  const [region, setRegion] = useState<Region>(DEFAULT_REGION);
  const [addressText, setAddressText] = useState('');
  const [labelText, setLabelText] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        const stored = await AsyncStorage.getItem(LOCATIONS_KEY);
        const parsed: StoredLocation[] = stored ? JSON.parse(stored) : [];
        if (parsed.length >= MAX_LOCATIONS) {
  Alert.alert(
    'Límite alcanzado',
    `Solo podés guardar hasta ${MAX_LOCATIONS} ubicaciones.`,
  );
  navigation.goBack();
  return;
}

        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({});
          setRegion(prev => ({
            ...prev,
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
          }));
          await updateAddressFromCoords(
            loc.coords.latitude,
            loc.coords.longitude,
          );
        } else {
          await updateAddressFromCoords(
            DEFAULT_REGION.latitude,
            DEFAULT_REGION.longitude,
          );
        }
      } catch (err) {
        console.log('Error inicializando LocationPicker', err);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [navigation]);

  const updateAddressFromCoords = async (lat: number, lon: number) => {
    try {
      const res = await Location.reverseGeocodeAsync({
        latitude: lat,
        longitude: lon,
      });
      if (res && res.length > 0) {
        const r = res[0];
        const formatted = `${r.street ?? ''} ${r.name ?? ''}, ${
          r.city ?? r.subregion ?? ''
        }`.trim();
        setAddressText(formatted || '');
      }
    } catch (err) {
      console.log('Error reverseGeocode', err);
    }
  };

  const handleRegionChangeComplete = async (reg: Region) => {
    setRegion(reg);
    await updateAddressFromCoords(reg.latitude, reg.longitude);
  };

  const handleSearchAddress = async () => {
    try {
      if (!addressText.trim()) return;

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permiso requerido',
          'Necesitamos permiso de ubicación para buscar la dirección.',
        );
        return;
      }

      const results = await Location.geocodeAsync(addressText.trim());
      if (!results || results.length === 0) {
        Alert.alert(
          'No se encontró la dirección',
          'Probá escribirla de otra forma.',
        );
        return;
      }

      const first = results[0];
      const newRegion: Region = {
        latitude: first.latitude,
        longitude: first.longitude,
        latitudeDelta: region.latitudeDelta,
        longitudeDelta: region.longitudeDelta,
      };
      setRegion(newRegion);
    } catch (err) {
      console.log('Error en geocodeAsync', err);
      Alert.alert('Error', 'No se pudo buscar la dirección.');
    }
  };

  const handleSaveLocation = async () => {
    try {
      setSaving(true);

      const stored = await AsyncStorage.getItem(LOCATIONS_KEY);
      const parsed: StoredLocation[] = stored ? JSON.parse(stored) : [];
      if (parsed.length >= MAX_LOCATIONS) {
  Alert.alert(
    'Límite alcanzado',
    `Solo podés guardar hasta ${MAX_LOCATIONS} ubicaciones.`,
  );
  return;
}

      const label = labelText.trim() || addressText.trim() || 'Ubicación';

      const newLocation: StoredLocation = {
        id: `loc_${Date.now()}`,
        label,
        latitude: region.latitude,
        longitude: region.longitude,
      };

      const newList = [...parsed, newLocation];

      await AsyncStorage.setItem(LOCATIONS_KEY, JSON.stringify(newList));
      await AsyncStorage.setItem(SELECTED_LOCATION_ID_KEY, newLocation.id);

      navigation.goBack();
    } catch (err) {
      console.log('Error guardando ubicación en LocationPicker', err);
      Alert.alert('Error', 'No se pudo guardar la ubicación.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        // si ves que aún tapa un poco, podés subir este offset
        keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
      >
        {/* Top bar */}
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={22} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.topTitle}>Seleccionar ubicación</Text>
          <View style={{ width: 32 }} />
        </View>

        {/* Mapa */}
        <MapView
          style={styles.map}
          region={region}
          onRegionChangeComplete={handleRegionChangeComplete}
        >
          <Marker
            coordinate={{
              latitude: region.latitude,
              longitude: region.longitude,
            }}
          />
        </MapView>

        {/* Panel inferior (se mueve con el teclado) */}
        <View style={styles.bottomPanel}>
          <Text style={styles.label}>Buscar dirección</Text>
          <View style={styles.searchRow}>
            <TextInput
              style={styles.input}
              placeholder="Ej: 18 de Julio 1234, Montevideo"
              value={addressText}
              onChangeText={setAddressText}
              returnKeyType="search"
              onSubmitEditing={handleSearchAddress}
            />
            <TouchableOpacity
              style={styles.searchBtn}
              onPress={handleSearchAddress}
            >
              <Ionicons name="search" size={18} color="#ffffff" />
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Nombre (opcional)</Text>
<TextInput
  style={styles.input}
  placeholder="Ej: Casa, Trabajo, Cliente X…"
  value={labelText}
  onChangeText={setLabelText}
/>

          <TouchableOpacity
            style={[styles.saveBtn, saving && { opacity: 0.7 }]}
            onPress={handleSaveLocation}
            disabled={saving || loading}
          >
            <Text style={styles.saveText}>
              {saving ? 'Guardando…' : 'Guardar ubicación'}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f9fafb' },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#ffffff',
    borderBottomColor: '#e5e7eb',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: { padding: 4 },
  topTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  map: {
    flex: 1,
  },
  bottomPanel: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderTopColor: '#e5e7eb',
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  label: {
    fontSize: 13,
    color: '#4b5563',
    marginBottom: 4,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  input: {
  borderRadius: 12,
  borderWidth: 1,
  borderColor: '#d1d5db',
  backgroundColor: '#fff',
  paddingHorizontal: 12,
  paddingVertical: 10,   // 👈 más alto, antes seguro era ~6
  fontSize: 14,
  marginTop: 6,
},
  searchBtn: {
    marginLeft: 8,
    backgroundColor: '#2563eb',
    borderRadius: 999,
    padding: 10,
  },
  saveBtn: {
    marginTop: 10,
    backgroundColor: '#2563eb',
    paddingVertical: 10,
    borderRadius: 14,
    alignItems: 'center',
  },
  saveText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
});
