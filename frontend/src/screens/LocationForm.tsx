// src/screens/LocationForm.tsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Keyboard,
  Alert,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import MapView, { Marker, Circle, Region } from 'react-native-maps';
import * as ExpoLocation from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { Screen } from '../components/Screen';
import { TopBar } from '../components/TopBar';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { COLORS, SPACING, RADII } from '../styles/theme';

import {
  createLocation,
  updateLocation,
  LocationDto,
  CreateLocationPayload,
  UpdateLocationPayload,
  getMyLocations,
} from '../services/locations.client';

import Constants from 'expo-constants';

type RouteParams = { location?: LocationDto; followLive?: boolean };

type PlacePrediction = {
  place_id: string;
  description: string;
  structured_formatting?: {
    main_text?: string;
    secondary_text?: string;
  };
};

const GOOGLE_KEY =
  (Constants.expoConfig?.extra?.EXPO_PUBLIC_GOOGLE_PLACES_KEY as string) ||
  (process.env.EXPO_PUBLIC_GOOGLE_PLACES_KEY as string) ||
  '';

// Storage
const FOLLOW_LIVE_KEY = '@app_follow_live_enabled';
const SELECTED_LOCATION_ID_KEY = '@app_selected_location_id';
const FOLLOW_LIVE_ID = 'follow_live';

function pickCityFromSecondary(secondary?: string) {
  if (!secondary) return null;
  const first = secondary.split(',')[0]?.trim();
  return first || secondary;
}

async function reverseGeocodeToText(lat: number, lng: number) {
  try {
    const res = await ExpoLocation.reverseGeocodeAsync({ latitude: lat, longitude: lng });
    if (!res || res.length === 0) return { address: '', city: '' };

    const r = res[0];
    const street = [r.street, r.name].filter(Boolean).join(' ').trim();
    const city = (r.city ?? r.subregion ?? r.region ?? '').trim();
    const formatted = [street, city].filter(Boolean).join(', ').trim();

    return { address: formatted, city };
  } catch {
    return { address: '', city: '' };
  }
}

export default function LocationForm() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const params = (route.params ?? {}) as RouteParams;

  const editing = !!params.location;
  const followLive = params.followLive === true;

  // campos
  const [nombreUbicacion, setNombreUbicacion] = useState(params.location?.nombre_ubicacion ?? '');
  const [direccion, setDireccion] = useState(params.location?.direccion ?? '');
  const [ciudad, setCiudad] = useState(params.location?.ciudad ?? '');
  const [lat, setLat] = useState<number | null>(params.location?.lat ?? null);
  const [lng, setLng] = useState<number | null>(params.location?.lng ?? null);
  const [principal, setPrincipal] = useState<boolean>(!!params.location?.principal);

  // autocomplete
  const [query, setQuery] = useState(direccion);
  const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
  const [loadingPred, setLoadingPred] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const [saving, setSaving] = useState(false);

  const canUseGoogle = useMemo(() => !!GOOGLE_KEY, []);

  // MAP
  const mapRef = useRef<MapView | null>(null);
  const [region, setRegion] = useState<Region>({
    latitude: lat ?? -34.9011,
    longitude: lng ?? -56.1645,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });

  useEffect(() => {
    if (lat != null && lng != null) {
      setRegion((r) => ({ ...r, latitude: lat, longitude: lng }));
    }
  }, [lat, lng]);

  // ===== Radar animation (simple por interval) =====
  const [radarPhase, setRadarPhase] = useState(0); // 0..1
  useEffect(() => {
    if (!followLive) return;
    const t = setInterval(() => {
      setRadarPhase((p) => {
        const next = p + 0.05;
        return next >= 1 ? 0 : next;
      });
    }, 60);
    return () => clearInterval(t);
  }, [followLive]);

  const radarRadius = 80 + radarPhase * 220; // metros
  const radarOpacity = Math.max(0.05, (1 - radarPhase) * 0.25);

  // ===== Seguimiento realtime =====
  const [watching, setWatching] = useState(false);
  useEffect(() => {
    if (!followLive) return;

    let sub: ExpoLocation.LocationSubscription | null = null;
    let cancelled = false;

    const start = async () => {
      const { status } = await ExpoLocation.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso requerido', 'Necesitamos permiso para seguir tu ubicación.');
        return;
      }

      setWatching(true);

      sub = await ExpoLocation.watchPositionAsync(
        {
          accuracy: ExpoLocation.Accuracy.High,
          distanceInterval: 10,
          timeInterval: 1000,
        },
        async (loc) => {
          if (cancelled) return;

          const la = loc.coords.latitude;
          const lo = loc.coords.longitude;

          setLat(la);
          setLng(lo);

          if (!direccion.trim()) {
            const { address, city } = await reverseGeocodeToText(la, lo);
            if (address) {
              setDireccion(address);
              setQuery(address);
            }
            if (city && !ciudad.trim()) setCiudad(city);
          }

          // centrar mapa
          mapRef.current?.animateToRegion(
            {
              latitude: la,
              longitude: lo,
              latitudeDelta: region.latitudeDelta,
              longitudeDelta: region.longitudeDelta,
            },
            350,
          );
        },
      );
    };

    start().catch((e) => console.log('❌ watchPositionAsync error', e));

    return () => {
      cancelled = true;
      sub?.remove();
      setWatching(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [followLive]);

  // Google autocomplete
  const fetchPredictions = useCallback(
    async (text: string) => {
      if (!canUseGoogle) return;
      if (!text || text.trim().length < 3) {
        setPredictions([]);
        return;
      }

      try {
        setLoadingPred(true);

        const url =
          'https://maps.googleapis.com/maps/api/place/autocomplete/json' +
          `?input=${encodeURIComponent(text)}` +
          `&key=${encodeURIComponent(GOOGLE_KEY)}` +
          `&language=es` +
          `&components=country:uy`;

        const res = await fetch(url);
        const json = await res.json();

        if (json.status !== 'OK' && json.status !== 'ZERO_RESULTS') {
          console.log('Places autocomplete error:', json.status, json.error_message);
          setPredictions([]);
          return;
        }

        setPredictions((json.predictions ?? []) as PlacePrediction[]);
      } catch (e) {
        console.log('❌ fetchPredictions', e);
        setPredictions([]);
      } finally {
        setLoadingPred(false);
      }
    },
    [canUseGoogle],
  );

  const fetchPlaceDetails = useCallback(
    async (placeId: string) => {
      if (!canUseGoogle) return;

      try {
        setLoadingDetails(true);

        const url =
          'https://maps.googleapis.com/maps/api/place/details/json' +
          `?place_id=${encodeURIComponent(placeId)}` +
          `&key=${encodeURIComponent(GOOGLE_KEY)}` +
          `&language=es` +
          `&fields=formatted_address,geometry,address_component,name`;

        const res = await fetch(url);
        const json = await res.json();

        if (json.status !== 'OK') {
          console.log('Place details error:', json.status, json.error_message);
          return;
        }

        const result = json.result;
        const formatted = result?.formatted_address ?? '';
        const location = result?.geometry?.location;

        const foundCity =
          (result?.address_components ?? []).find((c: any) => (c.types ?? []).includes('locality'))
            ?.long_name ??
          (result?.address_components ?? []).find((c: any) =>
            (c.types ?? []).includes('administrative_area_level_1'),
          )?.long_name ??
          null;

        setDireccion(formatted);
        setQuery(formatted);
        setCiudad(foundCity ?? ciudad ?? '');

        const newLat = typeof location?.lat === 'number' ? location.lat : null;
        const newLng = typeof location?.lng === 'number' ? location.lng : null;
        setLat(newLat);
        setLng(newLng);

        setPredictions([]);
        Keyboard.dismiss();
      } catch (e) {
        console.log('❌ fetchPlaceDetails', e);
      } finally {
        setLoadingDetails(false);
      }
    },
    [canUseGoogle, ciudad],
  );

  useEffect(() => {
    if (!canUseGoogle) return;
    if (followLive) return;

    const t = setTimeout(() => fetchPredictions(query), 300);
    return () => clearTimeout(t);
  }, [query, fetchPredictions, canUseGoogle, followLive]);

  const onPressMap = useCallback(
    async (latitude: number, longitude: number) => {
      if (followLive) return; // en seguimiento no permitimos mover
      setLat(latitude);
      setLng(longitude);
      setRegion((r) => ({ ...r, latitude, longitude }));

      const { address, city } = await reverseGeocodeToText(latitude, longitude);
      if (address) {
        setDireccion(address);
        setQuery(address);
      }
      if (city) setCiudad(city);

      setPredictions([]);
      Keyboard.dismiss();
    },
    [followLive],
  );

  const onSave = async () => {
    try {
      setSaving(true);

      // ✅ Activar modo seguimiento (persistente)
      if (followLive) {
        await AsyncStorage.setItem(FOLLOW_LIVE_KEY, '1');
        await AsyncStorage.setItem(SELECTED_LOCATION_ID_KEY, FOLLOW_LIVE_ID);
        Alert.alert('🟢 Siguiendo', 'Listo, ahora la búsqueda usará tu ubicación en tiempo real.');
        navigation.goBack();
        return;
      }

      if (!direccion?.trim()) {
        Alert.alert('Falta dirección', 'Ingresá una dirección o elegí una sugerencia.');
        return;
      }

      const basePayload: CreateLocationPayload = {
        nombre_ubicacion: nombreUbicacion?.trim() ? nombreUbicacion.trim() : undefined,
        ciudad: ciudad?.trim() ? ciudad.trim() : undefined,
        direccion: direccion?.trim() ? direccion.trim() : undefined,
        lat: typeof lat === 'number' ? lat : undefined,
        lng: typeof lng === 'number' ? lng : undefined,
        principal,
      };

      // Si es la primera ubicación, marcala como principal automáticamente
      if (!editing) {
        try {
          const existing = await getMyLocations(); // importalo
          const list = Array.isArray(existing) ? existing : [];
          if (list.length === 0) {
            basePayload.principal = true;
          }
        } catch {
          // si falla, no bloquees
        }
      }

      if (editing && params.location) {
        const patch: UpdateLocationPayload = basePayload;
        await updateLocation(params.location.id, patch);
      } else {
        await createLocation(basePayload);
      }

      navigation.goBack();
    } catch (e: any) {
      console.log('❌ Error guardando ubicación', e);
      Alert.alert('Error', e?.message ?? 'No se pudo guardar la ubicación.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen>
      <TopBar
        title={
          followLive ? 'Seguir mi ubicación' : editing ? 'Editar ubicación' : 'Nueva ubicación'
        }
        showBack
        onPressBack={() => navigation.goBack()}
      />

      {!canUseGoogle ? (
        <View style={{ padding: SPACING.lg }}>
          <Text style={{ color: COLORS.danger, fontWeight: '700' }}>
            Falta configurar EXPO_PUBLIC_GOOGLE_PLACES_KEY
          </Text>
          <Text style={{ marginTop: 6, color: COLORS.textMuted }}>
            Agregala en tu .env para habilitar sugerencias de direcciones.
          </Text>
        </View>
      ) : null}

      <View style={styles.container}>
        <Card withShadow style={styles.card}>
          {followLive ? (
            <View style={styles.followBanner}>
              <View style={styles.followDot} />
              <Text style={styles.followText}>{watching ? 'Siguiendo…' : 'Activando…'}</Text>
            </View>
          ) : (
            <>
              <Text style={styles.label}>Nombre (opcional)</Text>
              <TextInput
                value={nombreUbicacion}
                onChangeText={setNombreUbicacion}
                placeholder="Ej: Casa / Trabajo"
                style={styles.input}
                placeholderTextColor={COLORS.textMuted}
              />
            </>
          )}

          <Text style={[styles.label, { marginTop: 12 }]}>Dirección</Text>

          <View style={styles.searchRow}>
            <Ionicons name="search" size={18} color={COLORS.textMuted} />
            <TextInput
              value={query}
              onChangeText={(t) => {
                if (followLive) return;
                setQuery(t);
                setDireccion(t);
                setLat(null);
                setLng(null);
              }}
              placeholder="Escribí una dirección (ej: Soca 1232)"
              style={styles.searchInput}
              placeholderTextColor={COLORS.textMuted}
              autoCorrect={false}
              autoCapitalize="none"
              editable={!followLive}
            />
            {loadingPred || loadingDetails ? <ActivityIndicator /> : null}
          </View>

          {!followLive && predictions.length > 0 ? (
            <View style={styles.suggestions}>
              <FlatList
                keyboardShouldPersistTaps="handled"
                data={predictions}
                keyExtractor={(it) => it.place_id}
                renderItem={({ item }) => {
                  const main = item.structured_formatting?.main_text ?? item.description;
                  const secondary = item.structured_formatting?.secondary_text ?? '';
                  return (
                    <TouchableOpacity
                      style={styles.suggestionRow}
                      activeOpacity={0.85}
                      onPress={() => {
                        const guessedCity = pickCityFromSecondary(secondary);
                        if (guessedCity) setCiudad(guessedCity);
                        fetchPlaceDetails(item.place_id);
                      }}
                    >
                      <Ionicons name="location-outline" size={18} color={COLORS.textMuted} />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.suggestionMain} numberOfLines={1}>
                          {main}
                        </Text>
                        {!!secondary && (
                          <Text style={styles.suggestionSecondary} numberOfLines={1}>
                            {secondary}
                          </Text>
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                }}
              />
            </View>
          ) : null}

          <Text style={[styles.label, { marginTop: 12 }]}>
            {followLive
              ? 'Tu ubicación en tiempo real'
              : 'Elegí en el mapa (tocá para mover el pin)'}
          </Text>

          <MapView
            style={styles.map}
            region={region}
            onPress={(e) => {
              const { latitude, longitude } = e.nativeEvent.coordinate;
              onPressMap(latitude, longitude);
            }}
          >
            {lat != null && lng != null && (
              <>
                {/* Radar (solo en seguir) */}
                {followLive && (
                  <Circle
                    center={{ latitude: lat, longitude: lng }}
                    radius={radarRadius}
                    strokeColor={`rgba(34,197,94,${Math.min(0.75, radarOpacity + 0.25)})`}
                    fillColor={`rgba(34,197,94,${radarOpacity})`}
                  />
                )}

                <Marker coordinate={{ latitude: lat, longitude: lng }}>
                  <View style={styles.markerBubble}>
                    <View style={styles.markerDot} />
                  </View>
                </Marker>
              </>
            )}
          </MapView>

          <Text style={[styles.label, { marginTop: 12 }]}>Ciudad (opcional)</Text>
          <TextInput
            value={ciudad}
            onChangeText={(t) => !followLive && setCiudad(t)}
            placeholder="Ej: Montevideo"
            style={styles.input}
            placeholderTextColor={COLORS.textMuted}
            editable={!followLive}
          />

          {!followLive && (
            <View style={styles.rowBetween}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setPrincipal((p) => !p)}
                style={styles.checkboxRow}
              >
                <View style={[styles.checkbox, principal ? styles.checkboxOn : null]}>
                  {principal ? <Ionicons name="checkmark" size={16} color="#fff" /> : null}
                </View>
                <Text style={styles.checkboxText}>Marcar como principal</Text>
              </TouchableOpacity>

              <View style={styles.coordsPill}>
                <Text style={styles.coordsText}>
                  {lat != null && lng != null ? '📍 con coordenadas' : '📍 sin coordenadas'}
                </Text>
              </View>
            </View>
          )}

          <Button
            title={
              saving
                ? 'Guardando…'
                : followLive
                  ? 'Activar seguimiento'
                  : editing
                    ? 'Guardar cambios'
                    : 'Guardar ubicación'
            }
            onPress={onSave}
            disabled={saving}
            style={{ marginTop: 14 }}
          />
        </Card>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: SPACING.lg },
  card: { padding: SPACING.lg },

  label: { fontSize: 12, fontWeight: '800', color: COLORS.textMuted, marginBottom: 6 },

  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADII.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: COLORS.text,
    backgroundColor: '#fff',
  },

  followBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(34,197,94,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(34,197,94,0.35)',
  },
  followDot: { width: 10, height: 10, borderRadius: 999, backgroundColor: '#22c55e' },
  followText: { fontSize: 13, fontWeight: '900', color: '#166534' },

  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADII.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fff',
  },
  searchInput: { flex: 1, color: COLORS.text },

  suggestions: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADII.md,
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  suggestionMain: { fontSize: 13, fontWeight: '800', color: COLORS.text },
  suggestionSecondary: { marginTop: 2, fontSize: 12, color: COLORS.textMuted },

  map: {
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  markerBubble: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(34,197,94,0.20)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(34,197,94,0.50)',
  },
  markerDot: { width: 10, height: 10, borderRadius: 999, backgroundColor: '#22c55e' },

  rowBetween: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  checkboxRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  checkboxOn: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  checkboxText: { fontSize: 13, fontWeight: '700', color: COLORS.text },

  coordsPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#f3f4f6',
  },
  coordsText: { fontSize: 12, fontWeight: '800', color: COLORS.textMuted },
});
