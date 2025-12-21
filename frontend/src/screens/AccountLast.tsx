// src/screens/Account.tsx
import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';

import { getCurrentUser } from '../services/user.client';
import { ApiError } from '../utils/http';
import { useFocusEffect } from '@react-navigation/native';

type Props = { navigation: any };

type ProfileVM = {
  fullName: string;
  photoUrl: string | null;
  isProfessional: boolean;
};

type RowItem = {
  key: string;
  label: string;
  leftIcon: keyof typeof Ionicons.glyphMap;
  rightText?: string;
  onPress?: () => void;
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

export default function Account({ navigation }: Props) {
  const [profile, setProfile] = useState<ProfileVM | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [locations, setLocations] = useState<StoredLocation[]>([]);
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);
  const [loadingLocations, setLoadingLocations] = useState(true);
  const [savingLocation, setSavingLocation] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const data = await getCurrentUser();

        const profileVm: ProfileVM = {
          fullName: `${data.nombre ?? 'Usuario'} ${data.apellido ?? ''}`.trim(),
          photoUrl: data.foto_url ?? null,
          isProfessional: data.id_rol === 1, // ajustá si cambia el mapping
        };

        setProfile(profileVm);
      } catch (err) {
        console.error('Error cargando perfil en MyAccount:', err);
        if (err instanceof ApiError && err.status === 401) {
          await AsyncStorage.multiRemove(['@token', '@role', '@userId']);
          navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
        }
      } finally {
        setLoadingProfile(false);
      }
    };

    loadProfile();
  }, [navigation]);

  const handleLogout = async () => {
    await AsyncStorage.multiRemove(['@token', '@role', '@userId']);
    navigation.reset({ index: 0, routes: [{ name: 'Login' as never }] });
  };

  const rows: RowItem[] = [
    {
      key: 'settings',
      label: 'Configuración de la cuenta',
      leftIcon: 'settings-outline',
      onPress: () => navigation.navigate('AccountSettings' as never), // si no existe, cambiá a un placeholder
    },
    {
      key: 'edit',
      label: 'Editar perfil',
      leftIcon: 'create-outline',
      onPress: () => navigation.navigate('EditProfile' as never),
    },
    {
      key: 'add-service',
      label: 'Agregar servicio',
      leftIcon: 'add-outline',
      onPress: () => navigation.navigate('AddService' as never),
    },
    {
      key: 'language',
      label: 'Idioma',
      leftIcon: 'globe-outline',
      rightText: 'Español',
      onPress: () => {}, // abrir modal más adelante
    },
    {
      key: 'help',
      label: 'Obtén ayuda',
      leftIcon: 'help-circle-outline',
      onPress: () => {},
    },
    {
      key: 'privacy',
      label: 'Privacidad',
      leftIcon: require('../../assets/icons/privacidad.svg'),
      onPress: () => {},
    },
  ];

  if (loadingProfile) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={{ padding: 20 }}>
          <Text>Cargando…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!profile) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={{ padding: 20 }}>
          <Text>No se pudo cargar la cuenta.</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ========= Cargar ubicaciones guardadas =========
  const loadLocations = useCallback(async () => {
    try {
      setLoadingLocations(true);
      const stored = await AsyncStorage.getItem(LOCATIONS_KEY);
      const storedSelectedId = await AsyncStorage.getItem(SELECTED_LOCATION_ID_KEY);

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

  const persistLocations = async (locs: StoredLocation[], selectedId: string | null) => {
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
      let current = parsed.find((l) => l.isCurrent || l.id === 'current');

      // 2) Si no existe y ya hay MAX_LOCATIONS → no dejamos crear una nueva
      if (!current && parsed.length >= MAX_LOCATIONS) {
        Alert.alert('Límite alcanzado', `Solo podés guardar hasta ${MAX_LOCATIONS} ubicaciones.`);
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
        newList = newList.map((l) => (l.id === current!.id ? current! : l));
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
    const newList = locations.filter((l) => l.id !== id);
    let newSelected: string | null = selectedLocationId;

    if (selectedLocationId === id) {
      newSelected = newList[0]?.id ?? null;
    }

    await persistLocations(newList, newSelected);
  };

  // ========= Sección de ubicaciones =========
  const renderLocationsSection = () => {
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Locations</Text>

        {/* Usar ubicación actual */}
        <TouchableOpacity
          style={[styles.row, { justifyContent: 'space-between', alignItems: 'center' }]}
          activeOpacity={0.8}
          onPress={handleUseCurrentLocation}
          disabled={savingLocation}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="locate-outline" size={18} color="#111827" />
            <Text style={[styles.rowText, { marginLeft: 10 }]}>Usar ubicación actual</Text>
          </View>
          {savingLocation && <Text style={styles.rowSubText}>Actualizando…</Text>}
        </TouchableOpacity>

        {/* Agregar ubicación guardada (abre LocationPicker con mapa) */}
        <TouchableOpacity
          style={[styles.row, { justifyContent: 'space-between', alignItems: 'center' }]}
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
            <Text style={[styles.rowText, { marginLeft: 10 }]}>Agregar ubicación guardada</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color="#9ca3af" />
        </TouchableOpacity>

        {/* Lista de ubicaciones guardadas */}
        <View style={styles.locationsList}>
          {loadingLocations && <Text style={styles.helperText}>Cargando ubicaciones…</Text>}

          {!loadingLocations && locations.length === 0 && (
            <Text style={styles.helperText}>Aún no tenés ubicaciones guardadas.</Text>
          )}

          {locations.map((loc) => {
            const isSelected = loc.id === selectedLocationId;
            return (
              <View key={loc.id} style={styles.locationItemRow}>
                <TouchableOpacity
                  style={[styles.locationChip, isSelected && styles.locationChipSelected]}
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
                    style={[styles.locationChipText, isSelected && { color: '#1d4ed8' }]}
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
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header: título + campana */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Perfil</Text>

          <TouchableOpacity activeOpacity={0.8} style={styles.bellBtn} onPress={() => {}}>
            <Ionicons name="notifications-outline" size={20} color="#111827" />
            <View style={styles.bellDot} />
          </TouchableOpacity>
        </View>

        {/* Card perfil */}
        <View style={styles.profileCard}>
          {profile.photoUrl ? (
            <Image source={{ uri: profile.photoUrl }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Text style={styles.avatarInitial}>{profile.fullName?.[0]?.toUpperCase() || 'U'}</Text>
            </View>
          )}

          <Text style={styles.profileName}>{profile.fullName}</Text>

          {profile.isProfessional && <Text style={styles.profileSub}>Profesional</Text>}

          {/* Solo mostramos cuando exista realmente */}
          {/* <Text style={styles.profileMeta}>Miembro desde …</Text> */}
        </View>

        {/* Card promo */}
        {!profile.isProfessional && (
          <TouchableOpacity activeOpacity={0.9} style={styles.promoCard} onPress={() => {}}>
            <View style={styles.promoIcon}>
              <Ionicons name="briefcase-outline" size={20} color="#111827" />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.promoTitle}>Conviértete en profesional</Text>
              <Text style={styles.promoText}>
                Empieza a ofrecer tus servicios y genera ingresos adicionales, ¡es muy sencillo!
              </Text>
            </View>
          </TouchableOpacity>
        )}

        {/* Acciones principales */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.row} onPress={() => navigation.navigate('EditProfile')}>
            <Ionicons name="create-outline" size={18} color="#111827" />
            <Text style={styles.rowText}>Edit Profile</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.row} onPress={() => navigation.navigate('AddService')}>
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
            <Ionicons name="information-circle-outline" size={18} color="#111827" />
            <Text style={styles.rowText}>Information</Text>
          </TouchableOpacity>
        </View>

        {/* Lista */}
        <View style={styles.listCard}>
          {rows.map((item, idx) => (
            <View key={item.key}>
              <TouchableOpacity activeOpacity={0.8} style={styles.row} onPress={item.onPress}>
                <View style={styles.rowLeft}>
                  <Ionicons name={item.leftIcon} size={22} color="#111827" />
                </View>

                <Text style={styles.rowText}>{item.label}</Text>

                {item.rightText ? <Text style={styles.rowRightText}>{item.rightText}</Text> : null}

                <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
              </TouchableOpacity>

              {idx !== rows.length - 1 ? <View style={styles.divider} /> : null}
            </View>
          ))}
        </View>

        {/* Logout como item */}
        <View style={styles.logoutCard}>
          <TouchableOpacity activeOpacity={0.8} style={styles.row} onPress={handleLogout}>
            <View style={styles.rowLeft}>
              <Ionicons name="log-out-outline" size={22} color="#111827" />
            </View>
            <Text style={styles.rowText}>Cerrar sesión</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#ffffff' },

  content: {
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 30,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },

  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
  },

  bellBtn: {
    position: 'relative',
    padding: 8,
  },
  bellDot: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ef4444',
  },
  profileCard: {
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
  profileName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  profileSub: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  profileMeta: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 4,
  },
  promoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  promoIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  promoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  promoText: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
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
    justifyContent: 'space-between',
    paddingHorizontal: 8,
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
  rowLeft: {  
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowRightText: {
    fontSize: 12,
    color: '#9ca3af',
    marginLeft: 8,
  },
  divider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginVertical: 8,
  },
  listCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  logoutCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },

    elevation: 4,
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
  // avatar: {
  //   width: 88,
  //   height: 88,
  //   borderRadius: 44,
  //   marginBottom: 12,
  // },
  // avatarPlaceholder: {
  //   backgroundColor: '#e5e7eb',
  //   alignItems: 'center',
  //   justifyContent: 'center',
  // },
  // avatarInitial: {
  //   fontSize: 32,
  //   fontWeight: '700',
  //   color: '#4b5563',
  // },
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
  // section: {
  //   backgroundColor: '#fff',
  //   borderRadius: 24,
  //   paddingHorizontal: 16,
  //   paddingVertical: 12,
  //   marginBottom: 16,
  // },
  // sectionTitle: {
  //   fontSize: 14,
  //   fontWeight: '700',
  //   color: '#111827',
  //   marginBottom: 8,
  // },
  // row: {
  //   flexDirection: 'row',
  //   alignItems: 'center',
  //   paddingVertical: 10,
  // },
  // rowText: {
  //   fontSize: 14,
  //   color: '#111827',
  //   marginLeft: 10,
  //   flex: 1,
  // },
  // rowSubText: {
  //   fontSize: 12,
  //   color: '#9ca3af',
  // },
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
