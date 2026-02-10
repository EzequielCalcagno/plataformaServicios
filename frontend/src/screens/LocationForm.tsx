// src/screens/LocationForm.tsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ScrollView,
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
import { COLORS, SPACING, RADII, TYPO } from '../styles/theme';

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
  },  [followLive]);

  const radarRadius = 80 + radarPhase * 220; // metros
  const radarOpacity = Math.max(0.05, (1 - radarPhase) * 0.22);

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
      if (followLive) return;
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
        Alert.alert('Listo', 'Ahora la búsqueda usará tu ubicación en tiempo real.');
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

      if (!editing) {
        try {
          const existing = await getMyLocations();
          const list = Array.isArray(existing) ? existing : [];
          if (list.length === 0) basePayload.principal = true;
        } catch {
          // no bloquees
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

  const title = followLive ? 'Seguir mi ubicación' : editing ? 'Editar ubicación' : 'Nueva ubicación';

  return (
    <Screen>
      <TopBar title={title} showBack onPressBack={() => navigation.goBack()} />

      {!canUseGoogle ? (
        <View style={{ paddingHorizontal: SPACING.lg, paddingTop: SPACING.md }}>
          <Card withShadow style={styles.warnCard}>
            <View style={styles.warnRow}>
              <View style={styles.warnIcon}>
                <Ionicons name="warning-outline" size={18} color={COLORS.danger} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.warnTitle}>Falta configurar Google Places</Text>
                <Text style={styles.warnText}>
                  Agregá <Text style={{ fontFamily: TYPO.label.fontFamily }}>EXPO_PUBLIC_GOOGLE_PLACES_KEY</Text> en tu
                  .env para habilitar sugerencias.
                </Text>
              </View>
            </View>
          </Card>
        </View>
      ) : null}

            <ScrollView
  style={styles.container}
  contentContainerStyle={{ paddingBottom: SPACING.xl * 2 }}
  keyboardShouldPersistTaps="handled"
  showsVerticalScrollIndicator={false}
  nestedScrollEnabled
>
        <Card withShadow style={styles.card}>
          {/* Header / modo seguir */}
          {followLive ? (
            <View style={styles.followCard}>
              <View style={[styles.dot, watching ? styles.dotOn : styles.dotOff]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.followTitle}>Seguimiento en tiempo real</Text>
                <Text style={styles.followSubtitle}>
                  {watching ? 'Activo · se actualizará automáticamente' : 'Activando permisos…'}
                </Text>
              </View>
              <View style={styles.followPill}>
                <Ionicons name="navigate-outline" size={16} color={COLORS.buttonOutlineText} />
                <Text style={styles.followPillText}>Live</Text>
              </View>
            </View>
          ) : (
            <>
              <Text style={styles.label}>Nombre</Text>
              <Text style={styles.helper}>Opcional. Te ayuda a reconocerla rápido.</Text>

              <View style={styles.inputWrap}>
                <Ionicons name="pricetag-outline" size={18} color={COLORS.textMuted} />
                <TextInput
                  value={nombreUbicacion}
                  onChangeText={setNombreUbicacion}
                  placeholder="Ej: Casa / Trabajo"
                  style={styles.input}
                  placeholderTextColor={COLORS.textMuted}
                />
              </View>
            </>
          )}

          {/* Dirección */}
          <View style={styles.section}>
            <Text style={styles.label}>Dirección</Text>
            <Text style={styles.helper}>
              {followLive ? 'Se detectará a partir de tu ubicación.' : 'Escribí y elegí una sugerencia para mayor precisión.'}
            </Text>

            <View style={[styles.inputWrap, followLive && styles.inputWrapDisabled]}>
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
                placeholder="Ej: Soca 1232"
                style={styles.input}
                placeholderTextColor={COLORS.textMuted}
                autoCorrect={false}
                autoCapitalize="none"
                editable={!followLive}
              />
              {loadingPred || loadingDetails ? <ActivityIndicator /> : null}
            </View>

            {!followLive && predictions.length > 0 ? (
              <View style={styles.suggestions}>
                  {predictions.map((item, index) => {
                    const main = item.structured_formatting?.main_text ?? item.description;
                    const secondary = item.structured_formatting?.secondary_text ?? '';
                    const showDivider = index !== predictions.length - 1;

                    return (
                      <TouchableOpacity
                        key={item.place_id}
                        style={[styles.suggestionRow, showDivider && styles.suggestionDivider]}
                        activeOpacity={0.85}
                        onPress={() => {
                          const guessedCity = pickCityFromSecondary(secondary);
                          if (guessedCity) setCiudad(guessedCity);
                          fetchPlaceDetails(item.place_id);
                        }}
                      >
                        <View style={styles.suggestionIcon}>
                          <Ionicons name="location-outline" size={18} color={COLORS.text} />
                        </View>

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

                        <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
                      </TouchableOpacity>
                    );
                  })}
                </View>
            ) : null}
          </View>

          {/* Mapa */}
          <View style={styles.section}>
            <Text style={styles.label}>
              {followLive ? 'Tu ubicación actual' : 'Elegí en el mapa'}
            </Text>
            <Text style={styles.helper}>
              {followLive
                ? 'Se actualizará en vivo. No podés mover el pin.'
                : 'Tocá el mapa para mover el pin y completar coordenadas.'}
            </Text>

            <View style={styles.mapWrap}>
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
                    {followLive && (
                      <Circle
                        center={{ latitude: lat, longitude: lng }}
                        radius={radarRadius}
                        strokeColor={`rgba(34,148,242,${Math.min(0.70, radarOpacity + 0.25)})`}
                        fillColor={`rgba(34,148,242,${radarOpacity})`}
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
            </View>

            {/* Estado coords */}
            {!followLive ? (
              <View style={styles.rowBetween}>
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => setPrincipal((p) => !p)}
                  style={styles.checkboxRow}
                >
                  <View style={[styles.checkbox, principal ? styles.checkboxOn : null]}>
                    {principal ? <Ionicons name="checkmark" size={16} color={COLORS.buttonPrimaryText} /> : null}
                  </View>
                  <Text style={styles.checkboxText}>Marcar como principal</Text>
                </TouchableOpacity>

                <View style={styles.coordsPill}>
                  <Ionicons
                    name={lat != null && lng != null ? 'locate-outline' : 'help-circle-outline'}
                    size={16}
                    color={COLORS.textMuted}
                    style={{ marginRight: 6 }}
                  />
                  <Text style={styles.coordsText}>
                    {lat != null && lng != null ? 'Con coordenadas' : 'Sin coordenadas'}
                  </Text>
                </View>
              </View>
            ) : null}
          </View>

          {/* Ciudad */}
          <View style={styles.section}>
            <Text style={styles.label}>Ciudad</Text>
            <Text style={styles.helper}>Opcional.</Text>

            <View style={[styles.inputWrap, followLive && styles.inputWrapDisabled]}>
              <Ionicons name="business-outline" size={18} color={COLORS.textMuted} />
              <TextInput
                value={ciudad}
                onChangeText={(t) => !followLive && setCiudad(t)}
                placeholder="Ej: Montevideo"
                style={styles.input}
                placeholderTextColor={COLORS.textMuted}
                editable={!followLive}
              />
            </View>
          </View>

          {/* CTA */}
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
            style={{ marginTop: SPACING.md }}
          />

          {!followLive ? (
            <Text style={styles.footerHint}>
              Tip: guardá “Casa” y “Trabajo” y dejá una como principal para aparecer mejor en el mapa.
            </Text>
          ) : (
            <Text style={styles.footerHint}>
              Cuando esté activo, se usará tu ubicación real como principal en búsquedas.
            </Text>
          )}
        </Card>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.md },

  card: {
    borderRadius: RADII.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    backgroundColor: COLORS.cardBg,
  },

  // Warning (no google key)
  warnCard: {
    borderRadius: RADII.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    backgroundColor: COLORS.cardBg,
  },
  warnRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  warnIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: COLORS.bgLightGrey,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  warnTitle: { ...TYPO.h3 },
  warnText: { ...TYPO.subtitle, marginTop: 2 },

  // Follow card
  followCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: SPACING.md,
    borderRadius: RADII.lg,
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    backgroundColor: COLORS.cardBg,
    marginBottom: SPACING.sm,
  },
  dot: { width: 10, height: 10, borderRadius: 999 },
  dotOn: { backgroundColor: COLORS.buttonPrimaryBg },
  dotOff: { backgroundColor: COLORS.border },
  followTitle: { ...TYPO.label },
  followSubtitle: { ...TYPO.helper, marginTop: 2 },
  followPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADII.pill,
    backgroundColor: COLORS.graySoft,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  followPillText: { ...TYPO.badge, color: COLORS.buttonOutlineText },

  section: { marginTop: SPACING.md },

  label: { ...TYPO.label, fontFamily: TYPO.label.fontFamily, marginBottom: 4 },
  helper: { ...TYPO.helper, marginBottom: 8 },

  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    borderRadius: RADII.lg,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: COLORS.cardBg,
  },
  inputWrapDisabled: { opacity: 0.7 },
  input: {
    flex: 1,
    ...TYPO.body,
    paddingVertical: 0,
  },

  suggestions: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    borderRadius: RADII.lg,
    overflow: 'hidden',
    backgroundColor: COLORS.cardBg,
  },
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  suggestionDivider: { borderBottomWidth: 1, borderBottomColor: COLORS.bgDivider },
  suggestionIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: COLORS.bgLightGrey,
    alignItems: 'center',
    justifyContent: 'center',
  },
  suggestionMain: { ...TYPO.label },
  suggestionSecondary: { ...TYPO.helper, marginTop: 2 },

  mapWrap: {
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    borderRadius: RADII.lg,
    overflow: 'hidden',
    backgroundColor: COLORS.cardBg,
  },
  map: { height: 220, backgroundColor: COLORS.cardBg },

  markerBubble: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(34,148,242,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(34,148,242,0.45)',
  },
  markerDot: { width: 10, height: 10, borderRadius: 999, backgroundColor: COLORS.buttonPrimaryBg },

  rowBetween: {
    marginTop: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },

  checkboxRow: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.cardBg,
  },
  checkboxOn: { backgroundColor: COLORS.buttonPrimaryBg, borderColor: COLORS.buttonPrimaryBg },
  checkboxText: { ...TYPO.body, fontFamily: TYPO.label.fontFamily },

  coordsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: RADII.pill,
    backgroundColor: COLORS.graySoft,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  coordsText: { ...TYPO.helper, fontFamily: TYPO.label.fontFamily },

  footerHint: { ...TYPO.helper, marginTop: SPACING.md, textAlign: 'center' },
});
