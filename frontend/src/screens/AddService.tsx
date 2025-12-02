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
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { API_URL } from '../utils/api';
import * as ImagePicker from 'expo-image-picker';

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
  const [date, setDate] = useState(''); // opcional, formato YYYY-MM-DD

  // URL escrita a mano (sigue existiendo como opción)
  const [imageUrlInput, setImageUrlInput] = useState('');

  // Imagen local seleccionada desde la galería
  const [localImageUri, setLocalImageUri] = useState<string | null>(null);

  // URL pública devuelta por el backend al subir la imagen
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Cargar rol desde AsyncStorage
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

  // ======= PICKER DE IMAGEN =======

  const pickImage = async () => {
    try {
      // Pedir permisos
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permiso requerido',
          'Necesitamos acceso a tus fotos para subir imágenes de tus trabajos.',
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
         mediaTypes: ImagePicker.MediaTypeOptions.Images,
  quality: 0.8,
      });

      if (result.canceled) {
        return;
      }

      const asset = result.assets[0];
      setLocalImageUri(asset.uri);
      setUploadedImageUrl(null); // reseteamos la subida previa
    } catch (err) {
      console.log('Error al abrir galería', err);
      Alert.alert('Error', 'No se pudo abrir la galería de imágenes.');
    }
  };

  // ======= SUBIR IMAGEN AL BACKEND =======

  const uploadImage = async () => {
    try {
      if (!localImageUri) {
        Alert.alert('Sin imagen', 'Primero seleccioná una imagen.');
        return;
      }

      setUploading(true);
      setErrorMsg(null);

      const token = await AsyncStorage.getItem('@token');
      if (!token) {
        setErrorMsg('No hay sesión activa.');
        return;
      }

      const formData = new FormData();
      formData.append('image', {
        uri: localImageUri,
        name: 'work-image.jpg',
        type: 'image/jpeg',
      } as any);

      // IMPORTANTE: no setear Content-Type a mano para mantener el boundary
      const res = await fetch(`${API_URL}/uploads/work-image`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!res.ok) {
        const txt = await res.text();
        console.log('Error upload image', res.status, txt);
        throw new Error('No se pudo subir la imagen.');
      }

      const data = await res.json();
      console.log('✅ Imagen subida (frontend):', data);

      if (!data.url) {
        throw new Error('La respuesta no contiene una URL de imagen.');
      }

      setUploadedImageUrl(data.url);
      setSuccessMsg('Imagen subida correctamente.');
    } catch (err: any) {
      console.log('Error al subir imagen', err);
      setErrorMsg(err?.message || 'No se pudo subir la imagen.');
    } finally {
      setUploading(false);
    }
  };

  // ======= GUARDAR SERVICIO / TRABAJO =======

  const handleSave = async () => {
    try {
      setErrorMsg(null);
      setSuccessMsg(null);

      if (!title.trim() || !description.trim()) {
        setErrorMsg('Título y descripción son obligatorios.');
        return;
      }

      if (role !== 'professional') {
        setErrorMsg('Solo los profesionales pueden agregar servicios / trabajos.');
        return;
      }

      setSaving(true);

      const token = await AsyncStorage.getItem('@token');
      if (!token) {
        setErrorMsg('No hay sesión activa.');
        return;
      }

      // armamos array de URLs de imagen (subida o escrita a mano)
      const imageUrls: string[] = [];
      if (uploadedImageUrl) {
        imageUrls.push(uploadedImageUrl);
      }
      if (imageUrlInput.trim()) {
        imageUrls.push(imageUrlInput.trim());
      }

      const body: any = {
        title: title.trim(),
        description: description.trim(),
      };

      if (date.trim()) body.date = date.trim();
      if (imageUrls.length > 0) body.imageUrls = imageUrls;

      // POST /private/app/works (o el endpoint donde estés creando el trabajo)
      const res = await fetch(`${API_URL}/private/app/works`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const txt = await res.text();
        console.log('Error al crear servicio', res.status, txt);
        setErrorMsg('No se pudo guardar el servicio.');
        return;
      }

      const created = await res.json();
      console.log('✅ Servicio / trabajo creado:', created);

      setSuccessMsg('Servicio / trabajo agregado correctamente.');
      setTitle('');
      setDescription('');
      setDate('');
      setImageUrlInput('');
      setLocalImageUri(null);
      setUploadedImageUrl(null);
    } catch (e) {
      console.log('Error AddService save', e);
      setErrorMsg('Error de red al guardar el servicio.');
    } finally {
      setSaving(false);
    }
  };

  // ======= ESTADOS ESPECIALES POR ROL =======

  if (loadingRole) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={{ padding: 20 }}>
          <Text>Cargando...</Text>
        </View>
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
            <Text style={{ color: '#fff', textAlign: 'center' }}>
              Volver al perfil
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ======= RENDER PRINCIPAL =======

  return (
    <SafeAreaView style={styles.screen}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={{ fontSize: 18 }}>←</Text>
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>Add Service / Work</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {errorMsg && <Text style={styles.errorText}>{errorMsg}</Text>}
        {successMsg && <Text style={styles.successText}>{successMsg}</Text>}

        <Text style={styles.label}>Título</Text>
        <TextInput
          style={styles.input}
          placeholder="Ej: Cambio de grifería, Instalación de calefón..."
          value={title}
          onChangeText={setTitle}
        />

        <Text style={styles.label}>Descripción</Text>
        <TextInput
          style={[styles.input, styles.inputMultiline]}
          multiline
          textAlignVertical="top"
          numberOfLines={4}
          placeholder="Detalles del trabajo realizado..."
          value={description}
          onChangeText={setDescription}
        />

        <Text style={styles.label}>Fecha (opcional)</Text>
        <TextInput
          style={styles.input}
          placeholder="YYYY-MM-DD"
          value={date}
          onChangeText={setDate}
        />

        {/* Sección de imagen */}
        <Text style={styles.label}>Imagen del trabajo</Text>

        {/* Preview si hay selección local o URL subida */}
        {localImageUri || uploadedImageUrl ? (
          <Image
            source={{ uri: uploadedImageUrl || localImageUri! }}
            style={styles.previewImage}
          />
        ) : null}

        <View style={styles.row}>
          <TouchableOpacity style={styles.smallButton} onPress={pickImage}>
            <Text style={styles.smallButtonText}>Elegir foto</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.smallButton,
              { backgroundColor: '#16a34a' },
              (uploading || !localImageUri) && { opacity: 0.7 },
            ]}
            onPress={uploadImage}
            disabled={uploading || !localImageUri}
          >
            <Text style={styles.smallButtonText}>
              {uploading ? 'Subiendo...' : 'Subir imagen'}
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.helpText}>
          También podés pegar una URL directa de imagen si ya la tenés subida:
        </Text>

        <TextInput
          style={styles.input}
          placeholder="https://..."
          value={imageUrlInput}
          onChangeText={setImageUrlInput}
        />

        <TouchableOpacity
          onPress={handleSave}
          disabled={saving}
          style={[styles.saveButton, saving && { opacity: 0.7 }]}
        >
          <Text style={styles.saveButtonText}>
            {saving ? 'Guardando...' : 'Guardar servicio'}
          </Text>
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
  content: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 6,
    marginTop: 10,
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
  previewImage: {
    width: '100%',
    height: 180,
    borderRadius: 12,
    marginTop: 8,
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    marginTop: 8,
    marginBottom: 4,
    columnGap: 8,
  },
  smallButton: {
    flex: 1,
    backgroundColor: '#2563eb',
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  smallButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
  },
  helpText: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
    marginBottom: 4,
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
  },
  successText: {
    color: '#166534',
    marginBottom: 8,
  },
  backToProfileBtn: {
    backgroundColor: '#2563eb',
    paddingVertical: 10,
    borderRadius: 12,
  },
});
