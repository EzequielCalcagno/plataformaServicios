// src/screens/AddService.tsx
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';

import { Screen } from '../components/Screen';
import { TopBar } from '../components/TopBar';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Alert } from '../components/Alert';

import { TYPO, COLORS, SPACING, RADII } from '../styles/theme';
import { api } from '../utils/api';
import { API_URL } from '../utils/http';

type Props = { navigation: any; route: any };
type AppRole = 'professional' | 'client';

type SuggestionResponse = {
  category: string;
  suggestions: string[];
};

const CATEGORIES = [
  'Plomería',
  'Electricidad',
  'Gas',
  'Pintura',
  'Carpintería',
  'Albañilería',
  'Herrería',
  'Aire acondicionado',
  'Calefacción',
  'Cerrajería',
  'Jardinería',
  'Limpieza',
  'Mudanzas',
  'Redes / Informática',
  'Otros',
];

const FALLBACK_SUGGESTIONS: Record<string, string[]> = {
  Limpieza: [
    'Limpieza de grasera',
    'Limpieza profunda de cocina',
    'Limpieza de baños',
    'Limpieza post obra',
    'Limpieza de vidrios',
    'Limpieza de oficina',
    'Limpieza de tapizados',
    'Limpieza de alfombras',
    'Limpieza de patios',
    'Limpieza de galpón',
  ],
  Plomería: [
    'Reparación de pérdidas',
    'Destapación de cañerías',
    'Instalación de grifería',
    'Cambio de flexible',
    'Arreglo de cisterna/mochila',
    'Instalación de calefón',
    'Reparación de calefón',
    'Instalación de bomba de agua',
    'Cambio de válvula',
    'Reparación de canilla',
  ],
  Electricidad: [
    'Instalación de tomacorriente',
    'Cambio de llaves térmicas',
    'Instalación de luminaria',
    'Reparación de cortocircuito',
    'Armado de tablero',
    'Instalación de disyuntor',
    'Cambio de cableado',
    'Instalación de portero eléctrico',
    'Revisión eléctrica general',
    'Instalación de extractor',
  ],
  Gas: [
    'Revisión de instalación de gas',
    'Instalación de cocina a gas',
    'Instalación de calefón a gas',
    'Detección de fuga de gas',
    'Cambio de manguera y abrazaderas',
    'Mantenimiento de calefactor a gas',
    'Prueba de hermeticidad',
  ],
  Pintura: [
    'Pintura interior',
    'Pintura exterior',
    'Pintura de rejas',
    'Enduido y reparación de paredes',
    'Pintura de techo',
    'Pintura antihumedad',
    'Barnizado de madera',
  ],
  Carpintería: [
    'Armado de muebles',
    'Reparación de puertas',
    'Ajuste de bisagras',
    'Colocación de estantes',
    'Instalación de placard',
    'Reparación de muebles',
  ],
  Albañilería: [
    'Reparación de humedad',
    'Arreglo de revoque',
    'Colocación de cerámicas',
    'Arreglo de pisos',
    'Pequeñas reformas',
    'Construcción de pared',
  ],
  Herrería: [
    'Reparación de rejas',
    'Fabricación de portón',
    'Soldadura',
    'Reparación de cerramientos',
    'Instalación de barandas',
  ],
  'Aire acondicionado': [
    'Instalación de aire acondicionado',
    'Mantenimiento de aire acondicionado',
    'Carga de gas',
    'Limpieza de filtros y unidad',
    'Reparación de aire acondicionado',
  ],
  Calefacción: [
    'Instalación de calefactor',
    'Mantenimiento de calefactor',
    'Reparación de calefacción',
    'Revisión de tiraje',
  ],
  Cerrajería: [
    'Apertura de puerta',
    'Cambio de cerradura',
    'Duplicado de llaves',
    'Instalación de cerrojo',
    'Reparación de cerradura',
  ],
  Jardinería: [
    'Corte de pasto',
    'Poda de árboles',
    'Limpieza de jardín',
    'Diseño de jardín',
    'Mantenimiento mensual',
  ],
  Mudanzas: [
    'Mudanza dentro de la ciudad',
    'Mudanza con embalaje',
    'Flete pequeño',
    'Traslado de muebles',
    'Ayuda para cargar/descargar',
  ],
  'Redes / Informática': [
    'Instalación de router / WiFi',
    'Configuración de red',
    'Formateo de PC',
    'Instalación de software',
    'Armado de PC',
    'Soporte técnico a domicilio',
  ],
  Otros: ['Servicio general a domicilio', 'Mantenimiento del hogar', 'Arreglos generales'],
};

const MAX_DESC = 500;

export default function AddService({ navigation }: Props) {
  const [role, setRole] = useState<AppRole | null>(null);
  const [loadingRole, setLoadingRole] = useState(true);

  const [category, setCategory] = useState<string>('Plomería');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priceBase, setPriceBase] = useState<string>('');

  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [localImageUri, setLocalImageUri] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [alertMsg, setAlertMsg] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  // =========================
  // Load role
  // =========================
  useEffect(() => {
    (async () => {
      try {
        const storedRole = (await AsyncStorage.getItem('@role')) as AppRole | null;
        setRole(storedRole);
      } catch (e) {
        console.log('Error leyendo rol', e);
      } finally {
        setLoadingRole(false);
      }
    })();
  }, []);

  // =========================
  // Suggestions
  // =========================
  const fetchSuggestions = useCallback(async (cat: string) => {
    try {
      setLoadingSuggestions(true);
      const data = await api.get<SuggestionResponse>(
        `/private/services/suggestions?category=${encodeURIComponent(cat)}`,
      );
      setSuggestions(Array.isArray(data?.suggestions) ? data.suggestions : []);
    } catch {
      setSuggestions([]);
    } finally {
      setLoadingSuggestions(false);
    }
  }, []);

  useEffect(() => {
    fetchSuggestions(category);
  }, [category, fetchSuggestions]);

  const filteredSuggestions = useMemo(() => {
    const q = title.trim().toLowerCase();
    const base = suggestions.length ? suggestions : FALLBACK_SUGGESTIONS[category] ?? [];
    if (!q) return base.slice(0, 10);
    return base.filter((s) => s.toLowerCase().includes(q)).slice(0, 10);
  }, [suggestions, title, category]);

  // =========================
  // Pick image
  // =========================
  const pickImage = useCallback(async () => {
    try {
      setAlertMsg(null);
      setOk(false);

      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (perm.status !== 'granted') {
        setAlertMsg('Necesitamos permiso para acceder a tus fotos.');
        setOk(false);
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.85,
        allowsEditing: true,
        aspect: [4, 3],
      });

      if (!result.canceled && result.assets?.length) {
        setLocalImageUri(result.assets[0].uri);
        setUploadedImageUrl(null);
      }
    } catch (e) {
      console.log('Error seleccionando imagen:', e);
      setAlertMsg('No se pudo seleccionar la imagen.');
      setOk(false);
    }
  }, []);

  // =========================
  // Upload image
  // =========================
  const uploadImage = useCallback(async (): Promise<string | null> => {
    if (!localImageUri) return null;

    const token = await AsyncStorage.getItem('@token');
    if (!token) {
      setAlertMsg('No hay sesión activa.');
      setOk(false);
      return null;
    }

    const uploadUrl = `${API_URL}/uploads/work-image`;

    const formData = new FormData();
    formData.append('image', {
      uri: localImageUri,
      type: 'image/jpeg',
      name: 'work.jpg',
    } as any);

    try {
      setUploading(true);

      const res = await fetch(uploadUrl, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` } as any,
        body: formData,
      });

      const text = await res.text();
      let data: any = null;
      try {
        data = text ? JSON.parse(text) : null;
      } catch {
        data = { raw: text };
      }

      if (!res.ok) {
        console.log('🔥 Error upload image', res.status, data);
        setAlertMsg(data?.message || 'No se pudo subir la imagen.');
        setOk(false);
        return null;
      }

      if (!data?.url) {
        setAlertMsg('El servidor no devolvió la URL de la imagen.');
        setOk(false);
        return null;
      }

      return data.url as string;
    } catch (err) {
      console.log('Error al subir imagen', err);
      setAlertMsg('No se pudo subir la imagen.');
      setOk(false);
      return null;
    } finally {
      setUploading(false);
    }
  }, [localImageUri]);

  // =========================
  // Save
  // =========================
  const canSave = useMemo(() => {
    if (saving || uploading) return false;
    if (role !== 'professional') return false;
    if (!category.trim()) return false;
    if (!title.trim()) return false;
    return true;
  }, [saving, uploading, role, category, title]);

  const handleSave = useCallback(async () => {
    try {
      setAlertMsg(null);
      setOk(false);

      if (role !== 'professional') {
        setAlertMsg('Solo los profesionales pueden agregar servicios.');
        setOk(false);
        return;
      }
      if (!category.trim()) {
        setAlertMsg('La categoría es obligatoria.');
        setOk(false);
        return;
      }
      if (!title.trim()) {
        setAlertMsg('El título es obligatorio (podés elegir uno sugerido o escribirlo).');
        setOk(false);
        return;
      }

      setSaving(true);

      let finalImageUrl: string | null = null;
      if (localImageUri) {
        finalImageUrl = await uploadImage();
        if (!finalImageUrl) return;
      }

      const priceNum =
        priceBase.trim() === '' ? null : Number(String(priceBase).replace(',', '.'));

      const body: any = {
        titulo: title.trim(),
        descripcion: description.trim() ? description.trim() : null,
        categoria: category.trim(),
        precio_base: Number.isFinite(priceNum as any) ? priceNum : null,
        imageUrl: finalImageUrl ?? null,
      };

      const created = await api.post<any>('/private/services', { body });
      console.log('✅ created service', created);

      setOk(true);
      setAlertMsg('Servicio agregado correctamente.');

      setTitle('');
      setDescription('');
      setPriceBase('');
      setLocalImageUri(null);
      setUploadedImageUrl(finalImageUrl);

      fetchSuggestions(category);
    } catch (e: any) {
      console.log('❌ Error AddService save', e);
      setOk(false);
      setAlertMsg(e?.message || 'No se pudo guardar el servicio.');
    } finally {
      setSaving(false);
    }
  }, [role, category, title, description, priceBase, localImageUri, uploadImage, fetchSuggestions]);

  // =========================
  // Render guards
  // =========================
  if (loadingRole) {
    return (
      <Screen>
        <TopBar title="Agregar servicio" showBack />
        <View style={styles.center}>
          <ActivityIndicator />
          <Text style={[TYPO.bodyMuted, { marginTop: SPACING.md }]}>Cargando…</Text>
        </View>
      </Screen>
    );
  }

  if (role !== 'professional') {
    return (
      <Screen>
        <TopBar title="Agregar servicio" showBack />
        <View style={styles.container}>
          <Card style={styles.blockCard} withShadow>
            <Text style={TYPO.h3}>Acceso restringido</Text>
            <Text style={[TYPO.subtitle, { marginTop: SPACING.sm }]}>
              Solo los profesionales pueden agregar servicios.
            </Text>
            <View style={{ marginTop: SPACING.lg }}>
              <Button title="Volver" variant="primary" size="lg" onPress={() => navigation.goBack()} />
            </View>
          </Card>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <TopBar title="Agregar servicio" showBack />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Text style={TYPO.h2}>Mostrá tu experiencia</Text>
            <Text style={[TYPO.subtitle, { marginTop: SPACING.xs }]}>
              Agregá servicios reales para generar confianza y mejorar conversiones.
            </Text>
          </View>

          {alertMsg && (
            <Alert
              type={ok ? 'success' : 'error'}
              message={alertMsg}
              style={{ marginBottom: SPACING.md }}
            />
          )}

          {/* Categoría */}
          <Card style={styles.blockCard} withShadow>
            <View style={styles.blockTitleRow}>
              <Text style={styles.blockTitle}>Categoría</Text>
              <Text style={TYPO.caption}>Elegí una</Text>
            </View>

            <View style={styles.pillsWrap}>
              {CATEGORIES.map((c) => {
                const selected = c === category;
                return (
                  <TouchableOpacity
                    key={c}
                    onPress={() => setCategory(c)}
                    activeOpacity={0.85}
                    style={[styles.pill, selected && styles.pillSelected]}
                  >
                    <Text style={[styles.pillText, selected && styles.pillTextSelected]}>
                      {c}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </Card>

          {/* Sugerencias */}
          <Card style={styles.blockCard} withShadow>
            <View style={styles.blockTitleRow}>
              <Text style={styles.blockTitle}>Servicios sugeridos</Text>
              {loadingSuggestions ? (
                <View style={styles.loadingInline}>
                  <ActivityIndicator size="small" />
                  <Text style={TYPO.caption}>Cargando…</Text>
                </View>
              ) : (
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => fetchSuggestions(category)}
                  style={styles.refreshBtn}
                >
                  <Ionicons name="refresh-outline" size={16} color={COLORS.textMuted} />
                  <Text style={styles.refreshText}>Actualizar</Text>
                </TouchableOpacity>
              )}
            </View>

            {filteredSuggestions.length === 0 ? (
              <Text style={TYPO.helper}>Podés escribir el nombre que quieras.</Text>
            ) : (
              <View style={styles.chipsWrap}>
                {filteredSuggestions.map((s) => (
                  <TouchableOpacity
                    key={s}
                    activeOpacity={0.85}
                    onPress={() => setTitle(s)}
                    style={styles.chip}
                  >
                    <Text style={styles.chipText}>{s}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </Card>

          {/* Datos del servicio */}
          <Card style={styles.blockCard} withShadow>
            <Text style={styles.blockTitle}>Detalles</Text>

            <Text style={styles.label}>Nombre del servicio</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="Ej: Instalación de calefón"
              placeholderTextColor={COLORS.textMuted}
            />

            <Text style={[styles.label, { marginTop: SPACING.md }]}>Descripción (opcional)</Text>
            <View style={styles.textareaWrap}>
              <TextInput
                style={styles.textarea}
                value={description}
                onChangeText={setDescription}
                placeholder="Contá qué incluye, tiempos estimados, materiales, etc."
                placeholderTextColor={COLORS.textMuted}
                multiline
                maxLength={MAX_DESC}
                textAlignVertical="top"
              />
            </View>
            <View style={styles.counterRow}>
              <Text style={TYPO.caption}>{description.length}/{MAX_DESC}</Text>
            </View>

            <Text style={[styles.label, { marginTop: SPACING.md }]}>Precio aproximado (opcional)</Text>
            <TextInput
              style={styles.input}
              value={priceBase}
              onChangeText={setPriceBase}
              placeholder="Ej: 1500"
              placeholderTextColor={COLORS.textMuted}
              keyboardType={Platform.OS === 'ios' ? 'numbers-and-punctuation' : 'numeric'}
            />
            <Text style={[TYPO.helper, { marginTop: SPACING.sm }]}>
              Podés dejarlo vacío. El precio real se negocia con el cliente.
            </Text>
          </Card>

          {/* Imagen */}
          <Card style={styles.blockCard} withShadow>
            <View style={styles.blockTitleRow}>
              <Text style={styles.blockTitle}>Imagen (opcional)</Text>
              {!!localImageUri && (
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => {
                    setLocalImageUri(null);
                    setUploadedImageUrl(null);
                  }}
                  style={styles.linkBtn}
                >
                  <Text style={styles.linkText}>Quitar</Text>
                </TouchableOpacity>
              )}
            </View>

            {localImageUri ? (
              <Image source={{ uri: localImageUri }} style={styles.previewImage} />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Ionicons name="image-outline" size={20} color={COLORS.textMuted} />
                <Text style={[TYPO.helper, { marginTop: SPACING.xs }]}>
                  Sumá una foto para mejorar la conversión
                </Text>
              </View>
            )}

            <View style={{ marginTop: SPACING.md }}>
              <Button
                title={localImageUri ? 'Cambiar imagen' : 'Seleccionar imagen'}
                variant="neutral"
                size="lg"
                onPress={pickImage}
                disabled={uploading || saving}
              />
            </View>

            {!!uploadedImageUrl && (
              <Text style={[TYPO.caption, { marginTop: SPACING.sm }]}>
                Imagen subida: {uploadedImageUrl}
              </Text>
            )}
          </Card>

          <View style={{ height: 110 }} />
        </ScrollView>

        {/* Footer fijo */}
        <SafeAreaView style={styles.footer}>
          <Button
            title={uploading ? 'Subiendo imagen…' : saving ? 'Guardando…' : 'Guardar servicio'}
            variant="primary"
            size="lg"
            onPress={handleSave}
            disabled={!canSave}
          />
          <Text style={[TYPO.caption, { textAlign: 'center', marginTop: SPACING.sm }]}>
            Asegurate de que el nombre sea claro y específico.
          </Text>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xl,
  },

  header: {
    marginBottom: SPACING.md,
  },

  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.lg,
  },

  blockCard: {
    borderRadius: RADII.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    backgroundColor: COLORS.cardBg,
    marginBottom: SPACING.md,
  },

  blockTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: SPACING.md,
  },

  blockTitle: {
    ...TYPO.h3,
  },

  label: {
    ...TYPO.label,
    marginBottom: SPACING.sm,
  },

  input: {
    borderWidth: 1,
    borderColor: COLORS.borderInput,
    backgroundColor: COLORS.bgInput,
    borderRadius: RADII.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: 12,
    fontFamily: TYPO.body.fontFamily,
    fontSize: TYPO.body.fontSize,
    color: COLORS.text,
  },

  textareaWrap: {
    borderWidth: 1,
    borderColor: COLORS.borderInput,
    backgroundColor: COLORS.bgInput,
    borderRadius: RADII.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
  },

  textarea: {
    minHeight: 110,
    fontFamily: TYPO.body.fontFamily,
    fontSize: TYPO.body.fontSize,
    color: COLORS.text,
  },

  counterRow: {
    marginTop: SPACING.sm,
    alignItems: 'flex-end',
  },

  pillsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },

  pill: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: RADII.pill,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.graySoft,
  },

  pillSelected: {
    borderColor: COLORS.buttonOutlineBorder,
    backgroundColor: COLORS.cardBg,
  },

  pillText: {
    ...TYPO.badge,
    color: COLORS.inactiveTab,
  },

  pillTextSelected: {
    color: COLORS.text,
  },

  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },

  chip: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: RADII.pill,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.cardBg,
  },

  chipText: {
    ...TYPO.badge,
    color: COLORS.text,
  },

  loadingInline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  refreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: RADII.pill,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.cardBg,
  },

  refreshText: {
    ...TYPO.caption,
    color: COLORS.textMuted,
  },

  linkBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADII.pill,
    backgroundColor: COLORS.graySoft,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  linkText: {
    ...TYPO.caption,
    color: COLORS.text,
  },

  previewImage: {
    width: '100%',
    height: 190,
    borderRadius: RADII.md,
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    backgroundColor: COLORS.graySoft,
  },

  imagePlaceholder: {
    width: '100%',
    height: 160,
    borderRadius: RADII.md,
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    backgroundColor: COLORS.graySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },

  footer: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.borderTab,
    backgroundColor: COLORS.bgScreen,
  },
});
