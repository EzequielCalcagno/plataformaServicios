import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import { AppScreen } from '../components/AppScreen';
import { AppInput } from '../components/AppInput';
import { AppButton } from '../components/AppButton';
import { TopBar } from '../components/TopBar';
import { COLORS, SPACING } from '../styles/theme';

import { createLocation } from '../services/locations.client';

export default function LocationFormScreen() {
  const navigation = useNavigation<any>();

  const [nombre, setNombre] = useState('');
  const [ciudad, setCiudad] = useState('');
  const [direccion, setDireccion] = useState('');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [principal, setPrincipal] = useState(false);

  const [loading, setLoading] = useState(false);

  async function handleSave() {
    if (!nombre || !ciudad || !direccion) {
      Alert.alert('Faltan datos', 'Completá nombre, ciudad y dirección.');
      return;
    }

    try {
      setLoading(true);

      await createLocation({
        nombre_ubicacion: nombre,
        ciudad,
        direccion,
        lat: lat ? Number(lat) : undefined,
        lng: lng ? Number(lng) : undefined,
        principal,
      });

      Alert.alert('Listo ✨', 'Ubicación agregada correctamente.');
      navigation.goBack(); // vuelve a la lista → vuelve a cargar con useFocusEffect
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'No se pudo crear la ubicación.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppScreen>
      <TopBar title="Nueva ubicación" showBack onPressBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.label}>Nombre de la ubicación</Text>
        <AppInput placeholder="Casa, Oficina..." value={nombre} onChangeText={setNombre} />

        <Text style={styles.label}>Ciudad</Text>
        <AppInput placeholder="Ej: Montevideo" value={ciudad} onChangeText={setCiudad} />

        <Text style={styles.label}>Dirección</Text>
        <AppInput placeholder="Calle 123" value={direccion} onChangeText={setDireccion} />

        <Text style={styles.sectionTitle}>Coordenadas (opcional)</Text>

        <Text style={styles.label}>Latitud</Text>
        <AppInput
          placeholder="-34.90..."
          keyboardType="numeric"
          value={lat}
          onChangeText={setLat}
        />

        <Text style={styles.label}>Longitud</Text>
        <AppInput
          placeholder="-56.16..."
          keyboardType="numeric"
          value={lng}
          onChangeText={setLng}
        />

        <View style={{ marginVertical: SPACING.md }}>
          <AppButton
            title={principal ? '✓ Es principal' : 'Marcar como principal'}
            variant={principal ? 'primary' : 'outline'}
            onPress={() => setPrincipal((v) => !v)}
          />
        </View>

        <AppButton
          title={loading ? 'Guardando...' : 'Guardar ubicación'}
          onPress={handleSave}
          disabled={loading}
          style={{ marginTop: SPACING.lg }}
        />
      </ScrollView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    paddingBottom: 60,
  },
  label: {
    marginTop: SPACING.md,
    marginBottom: 4,
    color: COLORS.text,
    fontWeight: '600',
  },
  sectionTitle: {
    marginTop: SPACING.lg,
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
});
