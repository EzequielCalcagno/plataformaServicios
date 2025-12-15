// src/screens/AddService.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { API_URL } from '../utils/http'; // ✅ importante

type Props = {
  navigation: any;
  route: any;
};

type AppRole = 'professional' | 'client';

export default function AddService({ navigation }: Props) {
  const [role, setRole] = useState<AppRole | null>(null);
  const [loadingRole, setLoadingRole] = useState(true);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
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

  // =====================================================
  // 📸 Seleccionar imagen desde el dispositivo
  // =====================================================
  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.8,
      });

      if (!result.canceled && result.assets?.length) {
        setLocalImageUri(result.assets[0].uri);
        setUploadedImageUrl(null); // limpio para evitar confusión
      }
    } catch (e) {
      console.log('Error seleccionando imagen:', e);
      setErrorMsg('No se pudo seleccionar la imagen.');
    }
  };

  // =====================================================
  // ☁️ Subir imagen al backend
  // =====================================================
  const uploadImage = async (): Promise<string | null> => {
    if (!localImageUri) return null;

    const token = await AsyncStorage.getItem('@token');
    const uploadUrl = `${API_URL}/uploads/work-image`;

    console.log('🌐 Subiendo imagen a:', uploadUrl);

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

  // =====================================================
  // 💾 Guardar servicio/trabajo
  // =====================================================
  const handleSave = async () => {
    try {
      setErrorMsg(null);
      setSuccessMsg(null);

      if (!title.trim() || !description.trim()) {
        setErrorMsg('Título y descripción son obligatorios.');
        return;
      }

      if (role !== 'professional') {
        setErrorMsg('Solo los profesionales pueden agregar trabajos.');
        return;
      }

      setSaving(true);

      const token = await AsyncStorage.getItem('@token');
      if (!token) {
        setErrorMsg('No hay sesión activa.');
        return;
      }

      // 1) Subir imagen si existe
      let finalImageUrl: string | null = null;

      if (localImageUri) {
        finalImageUrl = await uploadImage();
        if (!finalImageUrl) return; // error ya mostrado
      }

      // 2) Enviar el servicio
      const worksUrl = `${API_URL}/works`;

      const body: any = {
        title: title.trim(),
        description: description.trim(),
      };

      if (date.trim()) body.date = date.trim();
      if (finalImageUrl) body.imageUrls = [finalImageUrl];

      console.log('🌐 POST servicio a:', worksUrl, 'body:', body);

      const res = await fetch(worksUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const txt = await res.text();

      if (!res.ok) {
        console.log('Error al crear servicio', res.status, txt);
        setErrorMsg('No se pudo guardar el servicio.');
        return;
      }

      // reset UI
      setSuccessMsg('Servicio agregado correctamente.');
      setTitle('');
      setDescription('');
      setDate('');
      setLocalImageUri(null);
      setUploadedImageUrl(finalImageUrl);
    } catch (e) {
      console.log('Error AddService save', e);
      setErrorMsg('Error de red al guardar el servicio.');
    } finally {
      setSaving(false);
    }
  };

  // =====================================================
  // RENDER
  // =====================================================
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
            Solo los profesionales pueden agregar trabajos realizados.
          </Text>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backToProfileBtn}
          >
            <Text style={{ color: '#fff', textAlign: 'center' }}>Volver</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={{ fontSize: 18 }}>←</Text>
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>Agregar Trabajo</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {errorMsg && <Text style={styles.errorText}>{errorMsg}</Text>}
        {successMsg && <Text style={styles.successText}>{successMsg}</Text>}

        <Text style={styles.label}>Título</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="Ej: Instalación de calefón"
        />

        <Text style={styles.label}>Descripción</Text>
        <TextInput
          style={[styles.input, styles.inputMultiline]}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          value={description}
          onChangeText={setDescription}
          placeholder="Detalles del trabajo..."
        />

        <Text style={styles.label}>Fecha (opcional)</Text>
        <TextInput
          style={styles.input}
          value={date}
          onChangeText={setDate}
          placeholder="YYYY-MM-DD"
        />

        {/* Imagen seleccionada */}
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
          <Text style={styles.saveButtonText}>
            {saving ? 'Guardando...' : 'Guardar servicio'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

// =====================================================
// ESTILOS
// =====================================================
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

  content: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },

  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 6,
    marginTop: 12,
  },

  input: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },

  inputMultiline: {
    minHeight: 100,
  },

  uploadBtn: {
    marginTop: 12,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#0ea5e9',
    alignItems: 'center',
  },
  uploadBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },

  saveButton: {
    marginTop: 24,
    backgroundColor: '#2563eb',
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },

  errorText: {
    color: '#b91c1c',
    marginBottom: 8,
    fontWeight: '600',
  },
  successText: {
    color: '#166534',
    marginBottom: 8,
    fontWeight: '600',
  },

  backToProfileBtn: {
    backgroundColor: '#2563eb',
    paddingVertical: 10,
    borderRadius: 12,
  },
});
