// src/screens/MyAccount.tsx
import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as Location from 'expo-location';
import { Image } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

const API_URL =
  ((Constants.expoConfig?.extra?.API_URL as string) || '').replace(/\/+$/, '');

type Props = {
  navigation: any;
};

type AppProfileCompact = {
  roleId: number;
  name: string;
  photoUrl: string | null;
  location: string;
  rating: number;
  jobsCompleted: number;
};

type StoredLocation = {
  id: string;
  label: string;
  latitude: number;
  longitude: number;
  isCurrent?: boolean; // 👈 para marcar la "Ubicación actual"
};

const LOCATIONS_KEY = '@app_locations';
const SELECTED_LOCATION_ID_KEY = '@app_selected_location_id';
const MAX_LOCATIONS = 4;

export default function MyAccount({ navigation }: Props) {
  const [profile, setProfile] = useState<AppProfileCompact | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [locations, setLocations] = useState<StoredLocation[]>([]);
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(
    null,
  );
  const [loadingLocations, setLoadingLocations] = useState(true);
  const [savingLocation, setSavingLocation] = useState(false);

  // ========= Cargar perfil compacto para la app =========
  useEffect(() => {
    const loadProfile = async () => {
      try {
        setErrorMsg(null);
        setLoadingProfile(true);

        const token = await AsyncStorage.getItem('@token');
        if (!token) {
          setErrorMsg('No hay sesión activa. Volvé a iniciar sesión.');
          return;
        }

        const res = await fetch(`${API_URL}/private/app/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        const text = await res.text();
        let data: any = {};
        try {
          data = text ? JSON.parse(text) : {};
        } catch {
          data = { raw: text };
        }

        console.log('✅ /private/app/me data:', data);

        if (!res.ok) {
          setErrorMsg(
            data?.message || 'No se pudo cargar la información de la cuenta.',
          );
          return;
        }

        const compact: AppProfileCompact = {
          roleId: data.roleId ?? 2,
          name: data.name ?? 'Usuario',
          photoUrl: data.photoUrl ?? null,
          location: data.location ?? 'Montevideo, Uruguay',
          rating: data.rating ?? 0,
          jobsCompleted: data.jobsCompleted ?? 0,
        };

        console.log('✅ Perfil normalizado:', compact);
        setProfile(compact);
      } catch (err) {
        console.log('Error load MyAccount', err);
        setErrorMsg('Error de red al cargar la cuenta.');
      } finally {
        setLoadingProfile(false);
      }
    };

    loadProfile();
  }, []);

  // ========= Cargar ubicaciones guardadas =========
  const loadLocations = useCallback(async () => {
    try {
      setLoadingLocations(true);
      const stored = await AsyncStorage.getItem(LOCATIONS_KEY);
      const storedSelectedId = await AsyncStorage.getItem(
        SELECTED_LOCATION_ID_KEY,
      );

      const parsed: StoredLocation[] = stored ? JSON.parse(stored) : [];
      setLocations(parsed);

      // si no hay seleccionada, usamos la primera
      setSelectedLocationId(storedSelectedId || (parsed[0]?.id ?? null));
    } catch (err) {
      console.log('Error cargando ubicaciones', err);
    } finally {
      setLoadingLocations(false);
    }
  }, []);

  // recargar ubicaciones cada vez que volvés desde LocationPicker
  useFocusEffect(
    useCallback(() => {
      loadLocations();
    }, [loadLocations]),
  );

  const persistLocations = async (
    locs: StoredLocation[],
    selectedId: string | null,
  ) => {
    setLocations(locs);
    setSelectedLocationId(selectedId);

    await AsyncStorage.setItem(LOCATIONS_KEY, JSON.stringify(locs));
    if (selectedId) {
      await AsyncStorage.setItem(SELECTED_LOCATION_ID_KEY, selectedId);
    } else {
      await AsyncStorage.removeItem(SELECTED_LOCATION_ID_KEY);
    }
  };

  // ========= Usar ubicación actual (sin duplicar) =========
  const handleUseCurrentLocation = async () => {
    try {
      setSavingLocation(true);
      setErrorMsg(null);

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permiso requerido',
          'Necesitamos permiso de ubicación para usar tu ubicación actual.',
        );
        return;
      }

      const loc = await Location.getCurrentPositionAsync({});
      const lat = loc.coords.latitude;
      const lon = loc.coords.longitude;

      // Leemos de AsyncStorage para tener lo último
      const raw = await AsyncStorage.getItem(LOCATIONS_KEY);
      const parsed: StoredLocation[] = raw ? JSON.parse(raw) : locations;

      // 1) Buscar si YA existe una "Ubicación actual"
      let current = parsed.find(l => l.isCurrent || l.id === 'current');

      // 2) Si no existe y ya hay MAX_LOCATIONS → no dejamos crear una nueva
      if (!current && parsed.length >= MAX_LOCATIONS) {
        Alert.alert(
          'Límite alcanzado',
          `Solo podés guardar hasta ${MAX_LOCATIONS} ubicaciones.`,
        );
        return;
      }

      let newList = [...parsed];
      let selectedId: string | null = null;

      if (!current) {
        // 3) No existía → la creamos una vez
        current = {
          id: 'current',
          label: 'Ubicación actual',
          latitude: lat,
          longitude: lon,
          isCurrent: true,
        };
        newList.push(current);
        selectedId = current.id;
      } else {
        // 4) Ya existía → solo actualizamos coordenadas y la seleccionamos
        current = {
          ...current,
          latitude: lat,
          longitude: lon,
          isCurrent: true,
        };
        newList = newList.map(l => (l.id === current!.id ? current! : l));
        selectedId = current.id;
      }

      await persistLocations(newList, selectedId);
    } catch (err) {
      console.log('Error usando ubicación actual', err);
      Alert.alert('Error', 'No se pudo obtener la ubicación actual.');
    } finally {
      setSavingLocation(false);
    }
  };

  // ========= Seleccionar / eliminar ubicación =========
  const handleSelectLocation = async (id: string) => {
    setSelectedLocationId(id);
    await AsyncStorage.setItem(SELECTED_LOCATION_ID_KEY, id);
  };

  const handleDeleteLocation = async (id: string) => {
    const newList = locations.filter(l => l.id !== id);
    let newSelected: string | null = selectedLocationId;

    if (selectedLocationId === id) {
      newSelected = newList[0]?.id ?? null;
    }

    await persistLocations(newList, newSelected);
  };

  // ========= Logout =========
  const handleLogout = async () => {
    await AsyncStorage.removeItem('@token');
    await AsyncStorage.removeItem('@role');
    navigation.reset({
      index: 0,
      routes: [{ name: 'Login' as never }],
    });
  };

  // ========= Sección de ubicaciones =========
  const renderLocationsSection = () => {
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Locations</Text>

        {/* Usar ubicación actual */}
        <TouchableOpacity
          style={[
            styles.row,
            { justifyContent: 'space-between', alignItems: 'center' },
          ]}
          activeOpacity={0.8}
          onPress={handleUseCurrentLocation}
          disabled={savingLocation}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="locate-outline" size={18} color="#111827" />
            <Text style={[styles.rowText, { marginLeft: 10 }]}>
              Usar ubicación actual
            </Text>
          </View>
          {savingLocation && (
            <Text style={styles.rowSubText}>Actualizando…</Text>
          )}
        </TouchableOpacity>

        {/* Agregar ubicación guardada (abre LocationPicker con mapa) */}
        <TouchableOpacity
          style={[
            styles.row,
            { justifyContent: 'space-between', alignItems: 'center' },
          ]}
          activeOpacity={0.8}
          onPress={() => {
            if (locations.length >= MAX_LOCATIONS) {
              Alert.alert(
                'Límite alcanzado',
                `Solo podés guardar hasta ${MAX_LOCATIONS} ubicaciones.`,
              );
              return;
            }
            navigation.navigate('LocationPicker');
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="pin-outline" size={18} color="#111827" />
            <Text style={[styles.rowText, { marginLeft: 10 }]}>
              Agregar ubicación guardada
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color="#9ca3af" />
        </TouchableOpacity>

        {/* Lista de ubicaciones guardadas */}
        <View style={styles.locationsList}>
          {loadingLocations && (
            <Text style={styles.helperText}>Cargando ubicaciones…</Text>
          )}

          {!loadingLocations && locations.length === 0 && (
            <Text style={styles.helperText}>
              Aún no tenés ubicaciones guardadas.
            </Text>
          )}

          {locations.map(loc => {
            const isSelected = loc.id === selectedLocationId;
            return (
              <View key={loc.id} style={styles.locationItemRow}>
                <TouchableOpacity
                  style={[
                    styles.locationChip,
                    isSelected && styles.locationChipSelected,
                  ]}
                  onPress={() => handleSelectLocation(loc.id)}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name={isSelected ? 'radio-button-on' : 'radio-button-off'}
                    size={16}
                    color={isSelected ? '#2563eb' : '#6b7280'}
                    style={{ marginRight: 6 }}
                  />
                  <Text
                    style={[
                      styles.locationChipText,
                      isSelected && { color: '#1d4ed8' },
                    ]}
                    numberOfLines={1}
                  >
                    {loc.label}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.locationDeleteBtn}
                  onPress={() => handleDeleteLocation(loc.id)}
                >
                  <Ionicons name="trash-outline" size={16} color="#b91c1c" />
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  // ========= Renders principales =========
  if (loadingProfile) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={{ padding: 20 }}>
          <Text>Cargando tu cuenta…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!profile) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={{ padding: 20 }}>
          <Text>{errorMsg || 'No se pudo cargar la cuenta.'}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header tipo tarjeta */}
        <View style={styles.headerCard}>
          {profile.photoUrl ? (
            <Image source={{ uri: profile.photoUrl }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Text style={styles.avatarInitial}>
                {profile.name?.[0]?.toUpperCase() || 'U'}
              </Text>
            </View>
          )}

          <Text style={styles.name}>{profile.name}</Text>
          <Text style={styles.subtitle}>Professional</Text>
          <Text style={styles.subtitle}>Member since Feb 2025</Text>
        </View>

        {/* Acciones principales */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.row}
            onPress={() => navigation.navigate('EditProfile')}
          >
            <Ionicons name="create-outline" size={18} color="#111827" />
            <Text style={styles.rowText}>Edit Profile</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.row}
            onPress={() => navigation.navigate('AddService')}
          >
            <Ionicons name="add-circle-outline" size={18} color="#111827" />
            <Text style={styles.rowText}>Add Service</Text>
          </TouchableOpacity>
        </View>

        {/* Ubicaciones */}
        {renderLocationsSection()}

        {/* Otras opciones mockeadas */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.row}>
            <Ionicons name="notifications-outline" size={18} color="#111827" />
            <Text style={styles.rowText}>Notifications</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.row}>
            <Ionicons name="globe-outline" size={18} color="#111827" />
            <Text style={styles.rowText}>Language</Text>
            <Text style={styles.rowSubText}>Spanish</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.row}>
            <Ionicons name="call-outline" size={18} color="#111827" />
            <Text style={styles.rowText}>Have a problem? Contact us</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.row}>
            <Ionicons
              name="information-circle-outline"
              size={18}
              color="#111827"
            />
            <Text style={styles.rowText}>Information</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f9fafb' },
  content: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 40,
  },
  headerCard: {
    alignItems: 'center',
    paddingVertical: 24,
    borderRadius: 24,
    backgroundColor: '#fff',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    marginBottom: 12,
  },
  avatarPlaceholder: {
    backgroundColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 32,
    fontWeight: '700',
    color: '#4b5563',
  },
  name: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  subtitle: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  rowText: {
    fontSize: 14,
    color: '#111827',
    marginLeft: 10,
    flex: 1,
  },
  rowSubText: {
    fontSize: 12,
    color: '#9ca3af',
  },
  helperText: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 4,
  },
  locationsList: {
    marginTop: 8,
  },
  locationItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  locationChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#f3f4f6',
    flexShrink: 1,
  },
  locationChipSelected: {
    backgroundColor: '#dbeafe',
  },
  locationChipText: {
    fontSize: 12,
    color: '#374151',
  },
  locationDeleteBtn: {
    marginLeft: 8,
    padding: 4,
  },
  logoutBtn: {
    marginTop: 12,
    alignSelf: 'flex-start',
  },
  logoutText: {
    color: '#b91c1c',
    fontWeight: '600',
    fontSize: 14,
  },
});
