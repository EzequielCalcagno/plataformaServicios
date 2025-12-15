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
import Constants from 'expo-constants';
import * as ImagePicker from 'expo-image-picker';

const API_URL =
  (Constants.expoConfig?.extra?.API_URL as string)?.replace(/\/+$/, '') || '';

type Props = {
  navigation: any;
};

type AppRole = 'professional' | 'client';

type ProfessionalForm = {
  specialty: string;
  about: string;
};

export default function EditProfile({ navigation }: Props) {
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const [profForm, setProfForm] = useState<ProfessionalForm>({
    specialty: '',
    about: '',
  });

  // ========= CARGAR PERFIL ==========
  useEffect(() => {
    const loadProfileForEdit = async () => {
      try {
        setLoading(true);
        setErrorMsg(null);

        const token = await AsyncStorage.getItem('@token');
        const storedRole = (await AsyncStorage.getItem('@role')) as AppRole | null;

        if (!token || !storedRole) {
          setErrorMsg('No hay sesión activa.');
          return;
        }

        setRole(storedRole);

        if (storedRole !== 'professional') {
          setErrorMsg('Edición de cliente aún no implementada.');
          return;
        }

        const res = await fetch(`${API_URL}/private/profile`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!res.ok) {
          const txt = await res.text();
          console.log('❌ Error al cargar perfil', res.status, txt);
          setErrorMsg('No se pudo cargar el perfil.');
          return;
        }

        const data = await res.json();

        // Mapear al formulario
        setProfForm({
          specialty: data.especialidad || '',
          about: data.descripcion || data.experiencia || '',
        });

        setAvatarUrl(data.portada_url || null);
      } catch (error) {
        console.log('❌ Error loadProfileForEdit', error);
        setErrorMsg('Error al cargar el perfil.');
      } finally {
        setLoading(false);
      }
    };

    loadProfileForEdit();
  }, []);

  // ========= SUBIR AVATAR ==========
  const handlePickAvatar = async () => {
    try {
      setErrorMsg(null);
      setUploadingAvatar(true);

      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Necesitamos permiso para acceder a tus fotos.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.9,
      });

      if (result.canceled) return;

      const asset = result.assets?.[0];
      if (!asset?.uri) {
        setErrorMsg('No se pudo obtener la imagen seleccionada.');
        return;
      }

      const token = await AsyncStorage.getItem('@token');
      if (!token) {
        setErrorMsg('No hay sesión activa.');
        return;
      }

      const formData = new FormData();
      formData.append('image', {
        uri: asset.uri,
        type: 'image/jpeg',
        name: 'avatar.jpg',
      } as any);

      const uploadUrl = `${API_URL}/uploads/profile-image`;
      console.log('📤 Subiendo avatar a:', uploadUrl);

      const res = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        } as any,
        body: formData,
      });

      const text = await res.text();
      let data: any = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        data = { raw: text };
      }

      if (!res.ok) {
        console.log('❌ Error subiendo avatar:', res.status, text);
        setErrorMsg(data.message || 'No se pudo subir la imagen.');
        return;
      }

      if (!data.url) {
        setErrorMsg('El servidor no devolvió la URL.');
        return;
      }

      setAvatarUrl(data.url);
      setSuccessMsg('Imagen actualizada (no olvides guardar cambios)');
    } catch (error) {
      console.log('❌ Error handlePickAvatar:', error);
      setErrorMsg('Error al subir la imagen.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  // ========= GUARDAR PERFIL ==========
  const handleSave = async () => {
    try {
      setSaving(true);
      setErrorMsg(null);
      setSuccessMsg(null);

      const token = await AsyncStorage.getItem('@token');
      if (!token || !role) {
        setErrorMsg('No hay sesión activa.');
        return;
      }

      if (role === 'professional') {
        const body = {
          descripcion: profForm.about,
          especialidad: profForm.specialty,
          experiencia: profForm.about,
          portadaUrl: avatarUrl ?? null,
        };

        const res = await fetch(`${API_URL}/private/profile`, {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        });

        if (!res.ok) {
          const t = await res.text();
          console.log('❌ Error al guardar perfil:', res.status, t);
          setErrorMsg('No se pudo guardar el perfil.');
          return;
        }

        setSuccessMsg('Perfil actualizado correctamente.');
      }
    } catch (error) {
      console.log('❌ Error saving profile', error);
      setErrorMsg('Error de red al guardar el perfil.');
    } finally {
      setSaving(false);
    }
  };

  // ========= RENDER ==========
  if (loading) {
    return (
      <SafeAreaView style={styles.screen}>
        <Text style={{ padding: 20 }}>Cargando perfil...</Text>
      </SafeAreaView>
    );
  }

  if (!role) {
    return (
      <SafeAreaView style={styles.screen}>
        <Text style={{ padding: 20 }}>No se pudo determinar el rol.</Text>
      </SafeAreaView>
    );
  }

  const initialLetter =
    profForm.specialty?.[0]?.toUpperCase() || 'U';

  return (
    <SafeAreaView style={styles.screen}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={{ fontSize: 18 }}>←</Text>
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>Edit Profile</Text>
        <View style={{ width: 20 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {errorMsg && <Text style={styles.errorText}>{errorMsg}</Text>}
        {successMsg && <Text style={styles.successText}>{successMsg}</Text>}

        {/* Avatar */}
        <View style={styles.avatarSection}>
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Text style={styles.avatarInitial}>{initialLetter}</Text>
            </View>
          )}

          <TouchableOpacity
            onPress={handlePickAvatar}
            style={styles.avatarButton}
            disabled={uploadingAvatar}
          >
            <Text style={styles.avatarButtonText}>
              {uploadingAvatar
                ? 'Subiendo...'
                : avatarUrl
                ? 'Cambiar foto'
                : 'Agregar imagen'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Formulario profesional */}
        <Text style={styles.label}>Especialidad</Text>
        <TextInput
          style={styles.input}
          placeholder="Ej: Electricidad, Plomería..."
          value={profForm.specialty}
          onChangeText={t => setProfForm(f => ({ ...f, specialty: t }))}
        />

        <Text style={styles.label}>Sobre mí</Text>
        <TextInput
          style={[styles.input, styles.inputMultiline]}
          multiline
          value={profForm.about}
          onChangeText={t => setProfForm(f => ({ ...f, about: t }))}
          placeholder="Describe tu experiencia..."
        />

        <TouchableOpacity
          onPress={handleSave}
          style={styles.saveButton}
          disabled={saving}
        >
          <Text style={styles.saveButtonText}>
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

/* ========= STYLES ========= */
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f5f7fb' },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e5e7eb',
  },
  topBarTitle: { fontSize: 16, fontWeight: '600' },
  content: { padding: 16 },
  avatarSection: { alignItems: 'center', marginBottom: 18 },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
  },
  avatarPlaceholder: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#e5e7eb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    fontSize: 32,
    fontWeight: '700',
    color: '#6b7280',
  },
  avatarButton: {
    marginTop: 10,
    backgroundColor: '#2563EB',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 24,
  },
  avatarButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fff',
  },
  inputMultiline: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  saveButton: {
    marginTop: 22,
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
  errorText: { color: '#b91c1c', marginBottom: 8 },
  successText: { color: '#166534', marginBottom: 8 },
});
