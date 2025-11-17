// src/screens/AddService.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';

// misma URL que usás en Login/Profile
const API_URL = 'http://192.168.1.8:3000';

type Props = NativeStackScreenProps<RootStackParamList, 'AddService'>;
type AppRole = 'professional' | 'client';

export default function AddService({ navigation }: Props) {
  const [role, setRole] = useState<AppRole | null>(null);
  const [loadingRole, setLoadingRole] = useState(true);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(''); // opcional, formato YYYY-MM-DD
  const [imageUrl, setImageUrl] = useState('');

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

      const body: any = {
        title: title.trim(),
        description: description.trim(),
      };

      if (date.trim()) body.date = date.trim();
      if (imageUrl.trim()) body.imageUrls = [imageUrl.trim()];

      // endpoint sugerido: luego lo implementamos en el backend
      const res = await fetch(`${API_URL}/v1/works`, {
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

      setSuccessMsg('Servicio / trabajo agregado correctamente.');
      setTitle('');
      setDescription('');
      setDate('');
      setImageUrl('');
    } catch (e) {
      console.log('Error AddService save', e);
      setErrorMsg('Error de red al guardar el servicio.');
    } finally {
      setSaving(false);
    }
  };

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

        <Text style={styles.label}>URL de imagen (opcional)</Text>
        <TextInput
          style={styles.input}
          placeholder="https://..."
          value={imageUrl}
          onChangeText={setImageUrl}
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
