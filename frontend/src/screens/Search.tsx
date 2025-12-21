// src/screens/Search.tsx
import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import {
  StyleSheet,
  View,
  TextInput,
  Text,
  FlatList,
  TouchableOpacity,
  Modal,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, Circle, Region } from 'react-native-maps';
import Slider from '@react-native-community/slider';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'react-native';
import Constants from 'expo-constants';
import { COLORS, SPACING, RADII } from '../styles/theme';

// ====== API ======
const API_URL =
  ((Constants.expoConfig?.extra as any)?.API_URL as string)?.replace(/\/+$/, '') ||
  '';

// ====== TIPOS ======
type Service = {
  id: string;
  title: string;
  category: string;
  latitude: number;
  longitude: number;
  distanceKm: number;

  profesionalId: string;
  profesionalNombre: string;
  profesionalApellido: string;
  photoUrl: string | null;
  ubicacionId?: number | null;
  ubicacionNombre?: string | null;
};

type StoredLocation = {
  id: string;
  label: string;
  latitude: number;
  longitude: number;
};

type GroupedPin = {
  key: string;
  profesionalId: string;
  profesionalNombre: string;
  profesionalApellido: string;
  photoUrl: string | null;
  latitude: number;
  longitude: number;
  distanceKm: number;
  ubicacionNombre?: string | null;
  services: Array<{
    id: string;
    title: string;
    category: string;
    distanceKm: number;
  }>;
};

// ====== CLAVES STORAGE ======
const LOCATIONS_KEY = '@app_locations';
const SELECTED_LOCATION_ID_KEY = '@app_selected_location_id';
const SEARCH_RADIUS_KEY = '@app_search_radius_km';

// ⚠️ si tu token se guarda con otra key, cambiá esto:
const TOKEN_KEY = '@token';

// ====== RUBROS ======
const POPULAR_RUBROS = [
  'Plomería',
  'Electricidad',
  'Pintura',
  'Carpintería',
  'Gas',
  'Limpieza',
];

// ====== ÍCONO POR CATEGORÍA ======
const getCategoryIcon = (category: string) => {
  const c = (category || '').toLowerCase();
  switch (c) {
    case 'plomería':
      return require('../../assets/icons/mapa/plumbing-pin.png');
    case 'electricidad':
      return require('../../assets/icons/mapa/electricity-pin.png');
    case 'pintura':
      return require('../../assets/icons/mapa/painting-pin.png');
    case 'carpintería':
      return require('../../assets/icons/mapa/carpentry-pin.png');
    case 'gas':
      return require('../../assets/icons/mapa/gas-pin.png');
    case 'limpieza':
      return require('../../assets/icons/mapa/cleaning-pin.png');
    default:
      return require('../../assets/icons/mapa/default-pin.png');
  }
};

// ====== DISTANCIA (Haversine) ======
const toRad = (value: number) => (value * Math.PI) / 180;

const haversineKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// ====== UI CONST ======
const BOTTOM_SHEET_MAX_HEIGHT = 360; // asegura que SIEMPRE se vea la lista
const PIN_CARD_MARGIN = 12;

export default function Search({ navigation }: any) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Service[]>([]);

  // Ubicaciones
  const [locations, setLocations] = useState<StoredLocation[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<StoredLocation | null>(null);

  // Radio
  const [radiusKm, setRadiusKm] = useState<number>(10);
  const [radiusDraft, setRadiusDraft] = useState<number>(10);

  // Modal cambio ubicación
  const [locationModalVisible, setLocationModalVisible] = useState(false);
  const [loadingLocations, setLoadingLocations] = useState(true);
  const [changingLocation, setChangingLocation] = useState(false);

  // Loading search
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Pin seleccionado
  const [selectedPin, setSelectedPin] = useState<GroupedPin | null>(null);

  const mapRef = useRef<MapView | null>(null);

  // ====== Helpers ======
  const openLocationModal = () => setLocationModalVisible(true);
  const closeLocationModal = () => setLocationModalVisible(false);

  const selectedLabel = useMemo(() => {
    return selectedLocation?.label || (loadingLocations ? 'Cargando…' : 'Sin ubicación');
  }, [selectedLocation, loadingLocations]);

  const fullName = (p: { profesionalNombre?: string; profesionalApellido?: string }) =>
    `${p.profesionalNombre || ''} ${p.profesionalApellido || ''}`.trim() || 'Profesional';

  // ====== Cargar ubicaciones + radio ======
  const loadLocations = useCallback(async () => {
    try {
      setLoadingLocations(true);

      const stored = await AsyncStorage.getItem(LOCATIONS_KEY);
      const storedSelectedId = await AsyncStorage.getItem(SELECTED_LOCATION_ID_KEY);
      const storedRadius = await AsyncStorage.getItem(SEARCH_RADIUS_KEY);

      const parsed: StoredLocation[] = stored ? JSON.parse(stored) : [];
      setLocations(parsed);

      let selected: StoredLocation | null = null;
      if (storedSelectedId) {
        selected = parsed.find(l => l.id === storedSelectedId) || parsed[0] || null;
      } else {
        selected = parsed[0] || null;
      }

      const fallback: StoredLocation = {
        id: 'default',
        label: 'Montevideo centro',
        latitude: -34.9011,
        longitude: -56.1645,
      };

      setSelectedLocation(selected || fallback);

      if (storedRadius) {
        const num = Number(storedRadius);
        if (!Number.isNaN(num) && num > 0) {
          setRadiusKm(num);
          setRadiusDraft(num);
        }
      }
    } catch (err) {
      console.log('Error cargando ubicaciones en Search', err);
      setSelectedLocation({
        id: 'default',
        label: 'Montevideo centro',
        latitude: -34.9011,
        longitude: -56.1645,
      });
    } finally {
      setLoadingLocations(false);
    }
  }, []);

  useEffect(() => {
    loadLocations();
  }, [loadLocations]);

  // ====== Recentrar mapa al cambiar ubicación ======
  useEffect(() => {
    if (selectedLocation && mapRef.current) {
      const region: Region = {
        latitude: selectedLocation.latitude,
        longitude: selectedLocation.longitude,
        latitudeDelta: 0.09,
        longitudeDelta: 0.09,
      };
      mapRef.current.animateToRegion(region, 650);
    }
    setSelectedPin(null);
  }, [selectedLocation?.id, selectedLocation?.latitude, selectedLocation?.longitude]);

  // ====== Seleccionar ubicación guardada ======
  const handleSelectStoredLocation = async (loc: StoredLocation) => {
    try {
      setChangingLocation(true);
      setSelectedLocation(loc);
      await AsyncStorage.setItem(SELECTED_LOCATION_ID_KEY, loc.id);
      closeLocationModal();
    } catch (err) {
      console.log('Error seleccionando ubicación en Search', err);
    } finally {
      setChangingLocation(false);
    }
  };

  // ====== Usar ubicación actual (TEMP) ======
  const handleUseCurrentLocationTemp = async () => {
    try {
      setChangingLocation(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso requerido', 'Necesitamos permiso para acceder a tu ubicación actual.');
        return;
      }

      const loc = await Location.getCurrentPositionAsync({});
      const temp: StoredLocation = {
        id: 'current_temp',
        label: 'Ubicación actual',
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      };

      setSelectedLocation(temp);
      closeLocationModal();
    } catch (err) {
      console.log('Error obteniendo ubicación actual en Search', err);
      Alert.alert('Error', 'No se pudo obtener la ubicación actual.');
    } finally {
      setChangingLocation(false);
    }
  };

  // ====== Buscar servicios ======
  const fetchServicios = useCallback(async () => {
    const lat = selectedLocation?.latitude;
    const lng = selectedLocation?.longitude;
    const q = query.trim();
    const radius = radiusKm;

    if (lat == null || lng == null) return;

    try {
      setSearchError(null);
      setLoadingSearch(true);

      const token = await AsyncStorage.getItem(TOKEN_KEY);
      if (!token) {
        setSearchError('No hay sesión activa.');
        setResults([]);
        return;
      }

      const params = new URLSearchParams();
      params.set('lat', String(lat));
      params.set('lng', String(lng));
      params.set('radiusKm', String(radius));
      if (q) params.set('q', q);

      const url = `${API_URL}/private/search/servicios?${params.toString()}`;
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const text = await res.text();
      let data: any = null;
      try {
        data = text ? JSON.parse(text) : null;
      } catch {
        data = { raw: text };
      }

      if (!res.ok) {
        console.log('❌ Search servicios error:', res.status, data);
        setSearchError(data?.error || data?.message || 'No se pudo buscar servicios.');
        setResults([]);
        return;
      }

      const list: any[] = Array.isArray(data)
        ? data
        : Array.isArray(data?.results)
        ? data.results
        : Array.isArray(data?.items)
        ? data.items
        : [];

      const normalized: Service[] = list
        .map((it: any) => {
          const latitude = Number(it.latitude ?? it.lat);
          const longitude = Number(it.longitude ?? it.lng);

          const idRaw = it.id ?? it.servicio_id ?? it.servicios_id;
          const id = String(idRaw ?? '');

          const title = String(it.title ?? it.titulo ?? '').trim();
          const category = String(it.category ?? it.categoria ?? '').trim();

          const profesionalId = String(it.profesional_id ?? it.profesionalId ?? '').trim();
          const profesionalNombre = String(
            it.profesional_nombre ?? it.profesionalNombre ?? '',
          ).trim();
          const profesionalApellido = String(
            it.profesional_apellido ?? it.profesionalApellido ?? '',
          ).trim();
          const photoUrl = (it.photo_url ?? it.photoUrl ?? null) as string | null;

          const ubicacionId = typeof it.ubicacion_id === 'number' ? it.ubicacion_id : null;
          const ubicacionNombre = typeof it.ubicacion_nombre === 'string' ? it.ubicacion_nombre : null;

          let dist =
            typeof it.distanceKm === 'number'
              ? it.distanceKm
              : typeof it.distance_km === 'number'
              ? it.distance_km
              : undefined;

          if (
            (dist == null || Number.isNaN(dist)) &&
            Number.isFinite(latitude) &&
            Number.isFinite(longitude)
          ) {
            dist = haversineKm(lat, lng, latitude, longitude);
          }

          return {
            id,
            title,
            category,
            latitude,
            longitude,
            distanceKm: Number(dist ?? 0),

            profesionalId,
            profesionalNombre,
            profesionalApellido,
            photoUrl,
            ubicacionId,
            ubicacionNombre,
          };
        })
        .filter(
          s =>
            s.id &&
            s.title &&
            s.category &&
            s.profesionalId &&
            Number.isFinite(s.latitude) &&
            Number.isFinite(s.longitude),
        )
        .sort((a, b) => a.distanceKm - b.distanceKm);

      setResults(normalized);
      setSelectedPin(null); // si cambió la búsqueda, cerramos el pin abierto
    } catch (err) {
      console.log('❌ Search servicios network error:', err);
      setSearchError('Error de red al buscar servicios.');
      setResults([]);
    } finally {
      setLoadingSearch(false);
    }
  }, [API_URL, selectedLocation?.latitude, selectedLocation?.longitude, query, radiusKm]);

  // Debounce
  useEffect(() => {
    if (!selectedLocation) return;
    const t = setTimeout(() => {
      fetchServicios();
    }, 250);
    return () => clearTimeout(t);
  }, [selectedLocation?.id, query, radiusKm, fetchServicios]);

  // ====== Agrupar pines por profesional + ubicación (misma dirección/coordenadas) ======
  const groupedPins = useMemo<GroupedPin[]>(() => {
    const map = new Map<string, GroupedPin>();

    results.forEach(s => {
      const key = `${s.profesionalId}-${s.latitude.toFixed(6)}-${s.longitude.toFixed(6)}`;

      if (!map.has(key)) {
        map.set(key, {
          key,
          profesionalId: s.profesionalId,
          profesionalNombre: s.profesionalNombre || 'Profesional',
          profesionalApellido: s.profesionalApellido || '',
          photoUrl: s.photoUrl ?? null,
          latitude: s.latitude,
          longitude: s.longitude,
          distanceKm: s.distanceKm,
          ubicacionNombre: s.ubicacionNombre ?? null,
          services: [],
        });
      }

      const group = map.get(key)!;
      group.services.push({
        id: s.id,
        title: s.title,
        category: s.category,
        distanceKm: s.distanceKm,
      });

      if (s.distanceKm < group.distanceKm) group.distanceKm = s.distanceKm;
    });

    return Array.from(map.values()).sort((a, b) => a.distanceKm - b.distanceKm);
  }, [results]);

  // ====== Slider ======
  const handleRadiusValueChange = (value: number) => setRadiusDraft(value);
  const handleRadiusComplete = async (value: number) => {
    setRadiusKm(value);
    setRadiusDraft(value);
    await AsyncStorage.setItem(SEARCH_RADIUS_KEY, String(value));
  };

  // ====== Handlers texto ======
  const handleSearchChange = (text: string) => setQuery(text);
  const handleRubrosChipPress = (rubro: string) => setQuery(rubro);

  // ====== Región inicial ======
  const initialRegion: Region = {
    latitude: selectedLocation?.latitude ?? -34.9011,
    longitude: selectedLocation?.longitude ?? -56.1645,
    latitudeDelta: 0.09,
    longitudeDelta: 0.09,
  };

  // ====== Seleccionar pin ======
  const focusPin = (pin: GroupedPin) => {
    setSelectedPin(pin);

    if (mapRef.current) {
      const region: Region = {
        latitude: pin.latitude,
        longitude: pin.longitude,
        latitudeDelta: 0.03,
        longitudeDelta: 0.03,
      };
      mapRef.current.animateToRegion(region, 450);
    }
  };

  const closePinCard = () => setSelectedPin(null);

  const goToProfile = (profesionalId: string) => {
    navigation.navigate('ProfessionalProfile', { profesionalId });
  };

  // ====== Render helpers ======
  const Avatar = ({ name, photoUrl }: { name: string; photoUrl: string | null }) => {
    if (photoUrl) return <Image source={{ uri: photoUrl }} style={styles.avatarImg} />;
    const initial = (name?.trim()?.[0] || 'P').toUpperCase();
    return (
      <View style={styles.avatarPlaceholder}>
        <Text style={styles.avatarInitial}>{initial}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right', 'bottom']}>
      <View style={styles.container}>
        {/* MAPA */}
        <MapView
          ref={mapRef}
          style={styles.map}
          initialRegion={initialRegion}
          onPress={() => closePinCard()}
        >
          {/* Radio */}
          {selectedLocation && (
            <>
              <Circle
                center={{
                  latitude: selectedLocation.latitude,
                  longitude: selectedLocation.longitude,
                }}
                radius={radiusDraft * 1000}
                strokeColor="rgba(56,189,248,0.70)"
                fillColor="rgba(56,189,248,0.18)"
              />

              {/* Pin ubicación seleccionada */}
              <Marker
                coordinate={{
                  latitude: selectedLocation.latitude,
                  longitude: selectedLocation.longitude,
                }}
                anchor={{ x: 0.5, y: 1 }}
                onPress={() => closePinCard()}
              >
                <Image
                  source={require('../../assets/icons/mapa/default-pin.png')}
                  style={{ width: 40, height: 40 }}
                  resizeMode="contain"
                />
              </Marker>
            </>
          )}

          {/* Pines agrupados */}
          {groupedPins.map(pin => (
            <Marker
              key={pin.key}
              coordinate={{ latitude: pin.latitude, longitude: pin.longitude }}
              anchor={{ x: 0.5, y: 1 }}
              onPress={() => focusPin(pin)}
              title={fullName(pin)}
              description={`${pin.services.length} servicios · ${pin.distanceKm.toFixed(1)} km`}
            >
              <Image
                source={getCategoryIcon(pin.services[0]?.category || '')}
                style={{ width: 56, height: 56 }}
                resizeMode="contain"
              />
              {/* badge con cantidad */}
              <View style={styles.pinBadge}>
                <Text style={styles.pinBadgeText}>{pin.services.length}</Text>
              </View>
            </Marker>
          ))}
        </MapView>

        {/* TARJETA SUPERIOR: UBICACIÓN + RADIO */}
        <View style={styles.topCardWrapper} pointerEvents="box-none">
          <View style={styles.topCard}>
            <View style={styles.topCardHeaderRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.topCardLabel}>Buscando servicios desde</Text>
                <Text style={styles.topCardLocation} numberOfLines={1}>
                  {selectedLabel}
                </Text>
                <Text style={styles.topCardRadiusLabel}>Radio: {Math.round(radiusDraft)} km</Text>
              </View>

              <TouchableOpacity style={styles.changeLocationButton} onPress={openLocationModal}>
                <Ionicons
                  name="swap-vertical-outline"
                  size={16}
                  color="#0369a1"
                  style={{ marginRight: 4 }}
                />
                <Text style={styles.changeLocationText}>Cambiar</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.sliderRow}>
              <Text style={styles.sliderLabel}>Radio de búsqueda</Text>
              <Text style={styles.sliderValue}>{Math.round(radiusDraft)} km</Text>
            </View>

            <Slider
              style={styles.slider}
              minimumValue={1}
              maximumValue={30}
              step={1}
              value={radiusDraft}
              onValueChange={handleRadiusValueChange}
              onSlidingComplete={handleRadiusComplete}
              minimumTrackTintColor="#0284c7"
              maximumTrackTintColor="#d1d5db"
              thumbTintColor="#0284c7"
            />
          </View>
        </View>

        {/* CARD PROFESIONAL (al tocar pin): botón + lista de servicios */}
        {selectedPin && (
          <View
            style={[
              styles.professionalCard,
              { bottom: BOTTOM_SHEET_MAX_HEIGHT + PIN_CARD_MARGIN },
            ]}
          >
            <TouchableOpacity style={styles.closeCardBtn} onPress={closePinCard}>
              <Ionicons name="close" size={18} color="#6b7280" />
            </TouchableOpacity>

            <View style={styles.professionalHeader}>
              <Avatar name={fullName(selectedPin)} photoUrl={selectedPin.photoUrl} />

              <View style={{ flex: 1 }}>
                <Text style={styles.professionalName} numberOfLines={1}>
                  {fullName(selectedPin)}
                </Text>
                <Text style={styles.professionalSubtitle} numberOfLines={1}>
                  {selectedPin.services.length} servicios · {selectedPin.distanceKm.toFixed(1)} km
                  {selectedPin.ubicacionNombre ? ` · ${selectedPin.ubicacionNombre}` : ''}
                </Text>
              </View>

              <TouchableOpacity style={styles.viewProfileBtn} onPress={() => goToProfile(selectedPin.profesionalId)}>
                <Text style={styles.viewProfileText}>Ver perfil</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.servicesList}>
              {selectedPin.services
                .slice()
                .sort((a, b) => a.distanceKm - b.distanceKm)
                .map(s => (
                  <View key={s.id} style={styles.serviceRow}>
                    <Text style={styles.serviceBullet}>•</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.serviceItem} numberOfLines={1}>
                        {s.title}
                      </Text>
                      <Text style={styles.serviceMeta} numberOfLines={1}>
                        {s.category}
                      </Text>
                    </View>
                  </View>
                ))}
            </View>
          </View>
        )}

        {/* PANEL INFERIOR (lista SIEMPRE visible) */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
          style={styles.bottomKeyboardWrapper}
        >
          <View style={styles.bottomPanel}>
            {/* buscador */}
            <View style={styles.searchRow}>
              <Ionicons name="search-outline" size={18} color="#6b7280" />
              <TextInput
                style={styles.searchInput}
                placeholder="Buscar por servicio (plomero, electricista...)"
                placeholderTextColor="#9ca3af"
                value={query}
                onChangeText={handleSearchChange}
                autoCapitalize="none"
                returnKeyType="search"
              />
              {loadingSearch ? (
                <ActivityIndicator size="small" color="#0284c7" />
              ) : query.length > 0 ? (
                <TouchableOpacity onPress={() => setQuery('')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <Ionicons name="close-circle" size={18} color="#9ca3af" />
                </TouchableOpacity>
              ) : (
                <View style={{ width: 18, height: 18 }} />
              )}
            </View>

            {/* chips */}
            <View style={styles.rubrosRow}>
              {POPULAR_RUBROS.map(rubro => (
                <TouchableOpacity
                  key={rubro}
                  style={styles.rubroChip}
                  onPress={() => handleRubrosChipPress(rubro)}
                  activeOpacity={0.85}
                >
                  <Text style={styles.rubroChipText}>{rubro}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* resultados */}
            {searchError ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>{searchError}</Text>
              </View>
            ) : groupedPins.length > 0 ? (
              <FlatList
                data={groupedPins}
                keyExtractor={item => item.key}
                style={styles.resultsList}
                contentContainerStyle={styles.resultsContent}
                keyboardShouldPersistTaps="handled"
                renderItem={({ item }) => {
                  const name = fullName(item);
                  return (
                    <TouchableOpacity
                      style={styles.resultCard}
                      activeOpacity={0.85}
                      onPress={() => focusPin(item)}
                    >
                      <Avatar name={name} photoUrl={item.photoUrl} />

                      <View style={{ flex: 1 }}>
                        <Text style={styles.resultTitle} numberOfLines={1}>
                          {name}
                        </Text>
                        <Text style={styles.resultCategory} numberOfLines={1}>
                          {item.services.length} servicios · {item.distanceKm.toFixed(1)} km
                          {item.ubicacionNombre ? ` · ${item.ubicacionNombre}` : ''}
                        </Text>

                        {/* mini lista (2 primeros) */}
                        <Text style={styles.resultMiniList} numberOfLines={1}>
                          {item.services
                            .slice(0, 2)
                            .map(s => s.title)
                            .join(' · ')}
                          {item.services.length > 2 ? ' · …' : ''}
                        </Text>
                      </View>

                      <TouchableOpacity
                        style={styles.smallProfileBtn}
                        onPress={() => goToProfile(item.profesionalId)}
                        activeOpacity={0.85}
                      >
                        <Text style={styles.smallProfileText}>Ver</Text>
                      </TouchableOpacity>
                    </TouchableOpacity>
                  );
                }}
              />
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>
                  {loadingSearch
                    ? 'Buscando…'
                    : `No encontramos servicios para “${query}” dentro de ${Math.round(radiusKm)} km.`}
                </Text>
              </View>
            )}
          </View>
        </KeyboardAvoidingView>

        {/* MODAL CAMBIAR UBICACIÓN */}
        <Modal
          visible={locationModalVisible}
          transparent
          animationType="slide"
          onRequestClose={closeLocationModal}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeaderRow}>
                <Text style={styles.modalTitle}>Seleccionar ubicación</Text>
                <TouchableOpacity onPress={closeLocationModal}>
                  <Ionicons name="close" size={22} color="#6b7280" />
                </TouchableOpacity>
              </View>

              <Text style={styles.modalSubtitle}>
                Elegí una ubicación guardada o usá tu ubicación actual.
              </Text>

              <TouchableOpacity
                style={styles.modalOptionRow}
                onPress={handleUseCurrentLocationTemp}
                disabled={changingLocation}
                activeOpacity={0.85}
              >
                <Ionicons
                  name="locate-outline"
                  size={18}
                  color="#111827"
                  style={{ marginRight: 8 }}
                />
                <Text style={styles.modalOptionText}>Usar ubicación actual</Text>
              </TouchableOpacity>

              <Text style={[styles.modalSubtitle, { marginTop: 10 }]}>Ubicaciones guardadas</Text>

              {loadingLocations && <Text style={styles.helperText}>Cargando ubicaciones…</Text>}

              {!loadingLocations && locations.length === 0 && (
                <Text style={styles.helperText}>
                  No tenés ubicaciones guardadas (podés agregarlas en Perfil).
                </Text>
              )}

              {!loadingLocations &&
                locations.map(loc => {
                  const isSelected =
                    selectedLocation &&
                    selectedLocation.id !== 'current_temp' &&
                    selectedLocation.id === loc.id;

                  return (
                    <Pressable
                      key={loc.id}
                      style={[
                        styles.modalLocationRow,
                        isSelected && styles.modalLocationRowSelected,
                      ]}
                      onPress={() => handleSelectStoredLocation(loc)}
                    >
                      <Ionicons
                        name={isSelected ? 'radio-button-on' : 'radio-button-off'}
                        size={18}
                        color={isSelected ? '#0284c7' : '#6b7280'}
                        style={{ marginRight: 8 }}
                      />
                      <Text numberOfLines={1} style={styles.modalLocationText}>
                        {loc.label}
                      </Text>
                    </Pressable>
                  );
                })}
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // ✅ arregla “arriba negro”
  screen: { flex: 1, backgroundColor: '#fff' },
  container: { flex: 1, backgroundColor: '#fff' },
  map: { flex: 1 },

  // ---- badge en pin ----
  pinBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: '#111827',
    borderRadius: 999,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinBadgeText: { color: '#fff', fontSize: 10, fontWeight: '800' },

  // ---- Tarjeta superior ----
  topCardWrapper: { position: 'absolute', top: 12, left: 12, right: 12 },
  topCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  topCardHeaderRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 6 },
  topCardLabel: { fontSize: 12, color: '#6b7280' },
  topCardLocation: { fontSize: 15, fontWeight: '800', color: '#111827' },
  topCardRadiusLabel: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  changeLocationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#bae6fd',
    backgroundColor: '#ecfeff',
    marginLeft: 8,
  },
  changeLocationText: { fontSize: 12, color: '#0369a1', fontWeight: '800' },
  sliderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  sliderLabel: { fontSize: 12, color: '#111827', fontWeight: '800' },
  sliderValue: { fontSize: 12, color: '#111827', fontWeight: '700' },
  slider: { marginTop: 2 },

  // ---- Card profesional (pin) ----
  professionalCard: {
    position: 'absolute',
    left: 12,
    right: 12,
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 14,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 10,
  },
  closeCardBtn: { position: 'absolute', top: 10, right: 10, padding: 6 },
  professionalHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingRight: 30 },
  professionalName: { fontSize: 14, fontWeight: '900', color: '#111827' },
  professionalSubtitle: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  viewProfileBtn: {
    backgroundColor: '#0284c7',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
  },
  viewProfileText: { color: '#fff', fontSize: 12, fontWeight: '900' },
  servicesList: { marginTop: 10 },
  serviceRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  serviceBullet: { fontSize: 14, fontWeight: '900', color: '#111827', marginTop: 1 },
  serviceItem: { fontSize: 13, color: '#111827', fontWeight: '700' },
  serviceMeta: { fontSize: 12, color: '#6b7280', fontWeight: '600', marginTop: 2 },

  // ---- Avatar (reutilizable) ----
  avatarImg: { width: 44, height: 44, borderRadius: 22 },
  avatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: { fontSize: 18, fontWeight: '900', color: '#374151' },

  // ---- Bottom sheet ----
  bottomKeyboardWrapper: { position: 'absolute', left: 0, right: 0, bottom: 0 },
  bottomPanel: {
    height: BOTTOM_SHEET_MAX_HEIGHT,
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.14,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: -6 },
    elevation: 12,
  },

  // ✅ arregla “no se ve lo que escribo”
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#f9fafb',
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#111827', // <- fijo para que se vea SIEMPRE
    paddingVertical: 0,
  },

  rubrosRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  rubroChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#f3f4f6',
  },
  rubroChipText: { fontSize: 12, color: COLORS?.text ?? '#111827', fontWeight: '700' },

  resultsList: { flex: 1 },
  resultsContent: { paddingBottom: 4 },
  resultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    borderBottomColor: '#e5e7eb',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  resultTitle: { fontSize: 14, fontWeight: '900', color: '#111827' },
  resultCategory: { fontSize: 12, color: '#6b7280', marginTop: 2, fontWeight: '700' },
  resultMiniList: { fontSize: 12, color: '#9ca3af', marginTop: 4, fontWeight: '600' },

  smallProfileBtn: {
    backgroundColor: '#0284c7',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  smallProfileText: { color: '#fff', fontSize: 12, fontWeight: '900' },

  emptyState: { marginTop: 8 },
  emptyText: { fontSize: 13, color: '#6b7280', fontWeight: '700' },

  // ---- Modal ----
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.30)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
    maxHeight: '70%',
  },
  modalHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  modalTitle: { fontSize: 16, fontWeight: '900', color: '#111827' },
  modalSubtitle: { fontSize: 13, color: '#6b7280', marginTop: 2, fontWeight: '600' },
  modalOptionRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, marginTop: 10 },
  modalOptionText: { fontSize: 14, color: '#111827', fontWeight: '700' },
  helperText: { fontSize: 12, color: '#9ca3af', marginTop: 4, fontWeight: '600' },
  modalLocationRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  modalLocationRowSelected: { backgroundColor: '#ecfeff', borderRadius: 10, paddingHorizontal: 8 },
  modalLocationText: { fontSize: 14, color: '#111827', flexShrink: 1, fontWeight: '700' },
});
