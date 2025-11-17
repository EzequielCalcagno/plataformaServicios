// src/screens/EditProfile.tsx
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

type Props = NativeStackScreenProps<RootStackParamList, 'EditProfile'>;
type AppRole = 'professional' | 'client';

type ProfessionalForm = {
  specialty: string;
  location: string;
  about: string;
};

type ClientForm = {
  name: string;
  location: string;
  email: string;
  phone: string;
};

export default function EditProfile({ navigation }: Props) {
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [profForm, setProfForm] = useState<ProfessionalForm>({
    specialty: '',
    location: '',
    about: '',
  });

  const [clientForm, setClientForm] = useState<ClientForm>({
    name: '',
    location: '',
    email: '',
    phone: '',
  });

  useEffect(() => {
    const loadProfileForEdit = async () => {
      try {
        setErrorMsg(null);
        setSuccessMsg(null);
        setLoading(true);

        const token = await AsyncStorage.getItem('@token');
        const storedRole = (await AsyncStorage.getItem('@role')) as AppRole | null;

        if (!token || !storedRole) {
          setErrorMsg('No hay sesión activa. Volvé a iniciar sesión.');
          return;
        }

        setRole(storedRole);

        const res = await fetch(`${API_URL}/v1/profiles/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!res.ok) {
          const txt = await res.text();
          console.log('Error al cargar perfil para editar', res.status, txt);
          setErrorMsg('No se pudo cargar el perfil.');
          return;
        }

        const data = await res.json();

        if (storedRole === 'professional') {
          setProfForm({
            specialty: data.specialty || '',
            location: data.location || '',
            about: data.about || '',
          });
        } else {
          setClientForm({
            name: data.name || '',
            location: data.location || '',
            email: data.email || '',
            phone: data.phone || '',
          });
        }
      } catch (e) {
        console.log('Error loadProfileForEdit', e);
        setErrorMsg('Error de red al cargar el perfil.');
      } finally {
        setLoading(false);
      }
    };

    loadProfileForEdit();
  }, []);

  const handleSave = async () => {
    try {
      setErrorMsg(null);
      setSuccessMsg(null);
      setSaving(true);

      const token = await AsyncStorage.getItem('@token');
      if (!token || !role) {
        setErrorMsg('No hay sesión activa.');
        return;
      }

      let body: any = {};

      if (role === 'professional') {
        body = {
          specialty: profForm.specialty,
          location: profForm.location,
          about: profForm.about,
        };
      } else {
        body = {
          name: clientForm.name,
          location: clientForm.location,
          phone: clientForm.phone,
        };
      }

      const res = await fetch(`${API_URL}/v1/profiles/me`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const txt = await res.text();
        console.log('Error al guardar perfil', res.status, txt);
        setErrorMsg('No se pudo guardar el perfil.');
        return;
      }

      setSuccessMsg('Perfil actualizado correctamente.');
    } catch (e) {
      console.log('Error save profile', e);
      setErrorMsg('Error de red al guardar el perfil.');
    } finally {
      setSaving(false);
    }
  };

  const renderProfessionalForm = () => (
    <>
      <Text style={styles.label}>Especialidad</Text>
      <TextInput
        style={styles.input}
        placeholder="Ej: Electricidad, Plomería..."
        value={profForm.specialty}
        onChangeText={(text) => setProfForm((f) => ({ ...f, specialty: text }))}
      />

      <Text style={styles.label}>Zona / Localidad</Text>
      <TextInput
        style={styles.input}
        placeholder="Ej: Montevideo, Ciudad de la Costa..."
        value={profForm.location}
        onChangeText={(text) => setProfForm((f) => ({ ...f, location: text }))}
      />

      <Text style={styles.label}>Sobre mí</Text>
      <TextInput
        style={[styles.input, styles.inputMultiline]}
        multiline
        textAlignVertical="top"
        numberOfLines={4}
        placeholder="Describí tu experiencia, tipos de trabajos, etc."
        value={profForm.about}
        onChangeText={(text) => setProfForm((f) => ({ ...f, about: text }))}
      />
    </>
  );

  const renderClientForm = () => (
    <>
      <Text style={styles.label}>Nombre</Text>
      <TextInput
        style={styles.input}
        placeholder="Tu nombre"
        value={clientForm.name}
        onChangeText={(text) => setClientForm((f) => ({ ...f, name: text }))}
      />

      <Text style={styles.label}>Localidad</Text>
      <TextInput
        style={styles.input}
        placeholder="Ej: Montevideo"
        value={clientForm.location}
        onChangeText={(text) => setClientForm((f) => ({ ...f, location: text }))}
      />

      <Text style={styles.label}>Teléfono</Text>
      <TextInput
        style={styles.input}
        placeholder="Ej: +598 99 ..."
        value={clientForm.phone}
        onChangeText={(text) => setClientForm((f) => ({ ...f, phone: text }))}
        keyboardType="phone-pad"
      />

      <Text style={styles.label}>Email</Text>
      <TextInput
        style={[styles.input, { backgroundColor: '#e5e7eb' }]}
        value={clientForm.email}
        editable={false}
      />
    </>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={{ padding: 20 }}>
          <Text>Cargando datos de perfil...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!role) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={{ padding: 20 }}>
          <Text>No se pudo determinar el rol del usuario.</Text>
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
        <Text style={styles.topBarTitle}>Edit Profile</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {errorMsg && <Text style={styles.errorText}>{errorMsg}</Text>}
        {successMsg && <Text style={styles.successText}>{successMsg}</Text>}

        {role === 'professional' ? renderProfessionalForm() : renderClientForm()}

        <TouchableOpacity
          onPress={handleSave}
          disabled={saving}
          style={[styles.saveButton, saving && { opacity: 0.7 }]}
        >
          <Text style={styles.saveButtonText}>
            {saving ? 'Guardando...' : 'Guardar cambios'}
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
});
