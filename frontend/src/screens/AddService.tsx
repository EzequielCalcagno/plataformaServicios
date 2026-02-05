// src/screens/AddService.tsx
import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';

import { api } from '../utils/api'; // ✅ usamos tu wrapper
import { API_URL } from '../utils/http'; // solo para upload

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

// fallback local por si backend no responde
const FALLBACK_SUGGESTIONS: Record<string, string[]> = {
  'Limpieza': [
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
  'Plomería': [
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
  'Electricidad': [
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
  'Gas': [
    'Revisión de instalación de gas',
    'Instalación de cocina a gas',
    'Instalación de calefón a gas',
    'Detección de fuga de gas',
    'Cambio de manguera y abrazaderas',
    'Mantenimiento de calefactor a gas',
    'Prueba de hermeticidad',
  ],
  'Pintura': [
    'Pintura interior',
    'Pintura exterior',
    'Pintura de rejas',
    'Enduido y reparación de paredes',
    'Pintura de techo',
    'Pintura antihumedad',
    'Barnizado de madera',
  ],
  'Carpintería': [
    'Armado de muebles',
    'Reparación de puertas',
    'Ajuste de bisagras',
    'Colocación de estantes',
    'Instalación de placard',
    'Reparación de muebles',
  ],
  'Albañilería': [
    'Reparación de humedad',
    'Arreglo de revoque',
    'Colocación de cerámicas',
    'Arreglo de pisos',
    'Pequeñas reformas',
    'Construcción de pared',
  ],
  'Herrería': [
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
  'Calefacción': [
    'Instalación de calefactor',
    'Mantenimiento de calefactor',
    'Reparación de calefacción',
    'Revisión de tiraje',
  ],
  'Cerrajería': [
    'Apertura de puerta',
    'Cambio de cerradura',
    'Duplicado de llaves',
    'Instalación de cerrojo',
    'Reparación de cerradura',
  ],
  'Jardinería': [
    'Corte de pasto',
    'Poda de árboles',
    'Limpieza de jardín',
    'Diseño de jardín',
    'Mantenimiento mensual',
  ],
  'Mudanzas': [
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
  'Otros': [
    'Servicio general a domicilio',
    'Mantenimiento del hogar',
    'Arreglos generales',
  ],
};

export default function AddService({ navigation }: Props) {
  const [role, setRole] = useState<AppRole | null>(null);
  const [loadingRole, setLoadingRole] = useState(true);

  const [category, setCategory] = useState<string>('Plomería');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priceBase, setPriceBase] = useState<string>('');

  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  const filteredSuggestions = useMemo(() => {
    const q = title.trim().toLowerCase();
    const base = suggestions.length ? suggestions : (FALLBACK_SUGGESTIONS[category] ?? []);
    if (!q) return base.slice(0, 10);
    return base.filter((s) => s.toLowerCase().includes(q)).slice(0, 10);
  }, [suggestions, title, category]);

  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [localImageUri, setLocalImageUri] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    const loadRole = async () => {
      try {
        const storedRole = (await AsyncStorage.getItem('@role')) as AppRole | null;
        setRole(storedRole);
      } catch (e) {
        console.log('Error leyendo rol', e);
      } finally {
        setLoadingRole(false);
      }
    };
    loadRole();
  }, []);

  const fetchSuggestions = async (cat: string) => {
    try {
      setLoadingSuggestions(true);
      // ✅ endpoint nuevo en backend
      const data = await api.get<SuggestionResponse>(
        `/private/services/suggestions?category=${encodeURIComponent(cat)}`,
      );
      setSuggestions(Array.isArray(data?.suggestions) ? data.suggestions : []);
    } catch (e) {
      // si falla, usamos fallback local
      setSuggestions([]);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  useEffect(() => {
    fetchSuggestions(category);
  }, [category]);

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.8,
      });

      if (!result.canceled && result.assets?.length) {
        setLocalImageUri(result.assets[0].uri);
        setUploadedImageUrl(null);
      }
    } catch (e) {
      console.log('Error seleccionando imagen:', e);
      setErrorMsg('No se pudo seleccionar la imagen.');
    }
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!localImageUri) return null;

    const token = await AsyncStorage.getItem('@token');
    const uploadUrl = `${API_URL}/uploads/work-image`;

    const formData = new FormData();
    formData.append('image', {
      uri: localImageUri,
      type: 'image/jpeg',
      name: 'photo.jpg',
    } as any);

    try {
      const res = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      });

      const text = await res.text();
      if (!res.ok) {
        console.log('🔥 Error upload image', res.status, text);
        throw new Error('No se pudo subir la imagen');
      }

      const data = JSON.parse(text);
      return data.url;
    } catch (err) {
      console.log('Error al subir imagen', err);
      setErrorMsg('No se pudo subir la imagen.');
      return null;
    }
  };

  const handleSave = async () => {
    try {
      setErrorMsg(null);
      setSuccessMsg(null);

      if (role !== 'professional') {
        setErrorMsg('Solo los profesionales pueden agregar servicios.');
        return;
      }

      if (!category.trim()) {
        setErrorMsg('La categoría es obligatoria.');
        return;
      }

      if (!title.trim()) {
        setErrorMsg('El título es obligatorio (podés elegir uno sugerido o escribirlo).');
        return;
      }

      setSaving(true);

      // (Opcional) subir imagen
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
        imageUrl: finalImageUrl ?? null, // no se guarda en DB hoy
      };

      // ✅ FIX: pegamos al PRIVATE endpoint
      const created = await api.post<any>('/private/services', { body });

      setSuccessMsg('Servicio agregado correctamente.');
      setTitle('');
      setDescription('');
      setPriceBase('');
      setLocalImageUri(null);
      setUploadedImageUrl(finalImageUrl);

      // opcional: refrescar sugerencias (para que se vea en “mis servicios”)
      fetchSuggestions(category);

      console.log('✅ created service', created);
    } catch (e: any) {
      console.log('❌ Error AddService save', e);
      setErrorMsg('No se pudo guardar el servicio.');
    } finally {
      setSaving(false);
    }
  };

  if (loadingRole) {
    return (
      <SafeAreaView style={styles.screen}>
        <Text style={{ padding: 20 }}>Cargando...</Text>
      </SafeAreaView>
    );
  }

  if (role !== 'professional') {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={{ padding: 20 }}>
          <Text style={{ marginBottom: 12 }}>
            Solo los profesionales pueden agregar servicios.
          </Text>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backToProfileBtn}>
            <Text style={{ color: '#fff', textAlign: 'center' }}>Volver</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={{ fontSize: 18 }}>←</Text>
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>Agregar Servicio</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {errorMsg && <Text style={styles.errorText}>{errorMsg}</Text>}
        {successMsg && <Text style={styles.successText}>{successMsg}</Text>}

        <Text style={styles.label}>Categoría</Text>
        <View style={styles.categoryWrap}>
          {CATEGORIES.map((c) => {
            const selected = c === category;
            return (
              <TouchableOpacity
                key={c}
                onPress={() => setCategory(c)}
                activeOpacity={0.85}
                style={[styles.catPill, selected && styles.catPillSelected]}
              >
                <Text style={[styles.catPillText, selected && styles.catPillTextSelected]}>
                  {c}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.suggestionsHeader}>
          <Text style={[styles.label, { marginTop: 0 }]}>Servicios sugeridos</Text>
          {loadingSuggestions ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <ActivityIndicator />
              <Text style={{ color: '#6b7280' }}>Cargando…</Text>
            </View>
          ) : null}
        </View>

        {filteredSuggestions.length === 0 ? (
          <Text style={styles.hint}>Podés escribir el nombre que quieras.</Text>
        ) : (
          <View style={styles.suggestionsWrap}>
            {filteredSuggestions.map((s) => (
              <TouchableOpacity
                key={s}
                activeOpacity={0.85}
                onPress={() => setTitle(s)}
                style={styles.suggestionChip}
              >
                <Text style={styles.suggestionChipText}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <Text style={styles.label}>Nombre del servicio</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="Ej: Instalación de calefón"
        />

        <Text style={styles.label}>Descripción (opcional)</Text>
        <TextInput
          style={[styles.input, styles.inputMultiline]}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          value={description}
          onChangeText={setDescription}
          placeholder="Detalles del servicio…"
        />

        <Text style={styles.label}>Precio aproximado (opcional)</Text>
        <TextInput
          style={styles.input}
          value={priceBase}
          onChangeText={setPriceBase}
          placeholder="Ej: 1500"
          keyboardType={Platform.OS === 'ios' ? 'numbers-and-punctuation' : 'numeric'}
        />
        <Text style={styles.hint}>Podés dejarlo vacío. El precio real se puede negociar.</Text>

        <Text style={styles.label}>Imagen (opcional)</Text>

        {localImageUri && (
          <Image
            source={{ uri: localImageUri }}
            style={{ width: '100%', height: 180, marginTop: 10, borderRadius: 12 }}
          />
        )}

        <TouchableOpacity style={styles.uploadBtn} onPress={pickImage}>
          <Text style={styles.uploadBtnText}>
            {localImageUri ? 'Cambiar imagen' : 'Seleccionar imagen'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.saveButton, saving && { opacity: 0.6 }]}
          disabled={saving}
          onPress={handleSave}
        >
          <Text style={styles.saveButtonText}>{saving ? 'Guardando...' : 'Guardar servicio'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f5f7fb' },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e5e7eb',
  },
  topBarTitle: { fontSize: 16, fontWeight: '600' },
  backButton: { padding: 4 },

  content: { paddingHorizontal: 16, paddingVertical: 16 },

  label: { fontSize: 14, fontWeight: '600', color: '#111827', marginBottom: 6, marginTop: 12 },

  hint: { fontSize: 12, color: '#6b7280', marginTop: 6 },

  input: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  inputMultiline: { minHeight: 100 },

  categoryWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  catPill: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#fff',
  },
  catPillSelected: { borderColor: '#2563eb', backgroundColor: '#eff6ff' },
  catPillText: { color: '#111827', fontWeight: '600', fontSize: 12 },
  catPillTextSelected: { color: '#1d4ed8' },

  suggestionsHeader: {
    marginTop: 14,
    marginBottom: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  suggestionsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  suggestionChip: { paddingHorizontal: 10, paddingVertical: 8, borderRadius: 999, backgroundColor: '#0ea5e9' },
  suggestionChipText: { color: '#fff', fontWeight: '700', fontSize: 12 },

  uploadBtn: { marginTop: 12, paddingVertical: 12, borderRadius: 12, backgroundColor: '#0ea5e9', alignItems: 'center' },
  uploadBtnText: { color: '#fff', fontWeight: '600', fontSize: 15 },

  saveButton: { marginTop: 24, backgroundColor: '#2563eb', paddingVertical: 12, borderRadius: 14, alignItems: 'center' },
  saveButtonText: { color: '#fff', fontWeight: '600', fontSize: 15 },

  errorText: { color: '#b91c1c', marginBottom: 8, fontWeight: '600' },
  successText: { color: '#166534', marginBottom: 8, fontWeight: '600' },

  backToProfileBtn: { backgroundColor: '#2563eb', paddingVertical: 10, borderRadius: 12 },
});
