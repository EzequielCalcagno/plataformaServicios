// src/screens/Jobs.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../utils/api';
import { Loading } from './Loading';
import { Error } from './Error';

type Props = {
  navigation: any;
  route: any;
};

type WorkImage = {
  url: string;
  orden: number;
};

type Work = {
  id: number;
  titulo: string;
  descripcion: string;
  fecha: string | null;
  imagenes: WorkImage[];
};

export default function Jobs({ navigation }: Props) {
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [works, setWorks] = useState<Work[]>([]);

  useEffect(() => {
    const loadWorks = async () => {
      try {
        setLoading(true);
        setErrorMsg(null);

        const token = await AsyncStorage.getItem('@token');
        const userId = await AsyncStorage.getItem('@userId');

        if (!token || !userId) {
          setErrorMsg('Sesión no válida. Volvé a iniciar sesión.');
          return;
        }

        const res = await fetch(`${api}/profiles/${userId}/works`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!res.ok) {
          const txt = await res.text();
          console.log('Error al cargar trabajos', res.status, txt);
          setErrorMsg(`Error al cargar trabajos (${res.status})`);
          return;
        }

        const data = (await res.json()) as Work[];
        setWorks(data);
      } catch (e) {
        console.log('Error loadWorks', e);
        setErrorMsg('Error de red al cargar los trabajos.');
      } finally {
        setLoading(false);
      }
    };

    loadWorks();
  }, []);

  // ========= Renders principales =========
  if (loading) {
    return <Loading message="Cargando trabajos..." />;
  }

  if (!works) {
    return (
      <Error
        title="No se pudo cargar tu información."
        message="Volver a iniciar sesión para continuar."
        actionLabel="Reintentar"
        onAction={() => navigation.reset({ index: 0, routes: [{ name: 'Login' }] })}
      />
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.topBar}>
        <TouchableOpacity style={{ padding: 4 }} onPress={() => navigation.goBack()}>
          <Text style={{ fontSize: 18 }}>←</Text>
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>Jobs</Text>
        <View style={{ width: 24 }} />
      </View>

      {works.length === 0 ? (
        <View style={{ padding: 16 }}>
          <Text>No tenés trabajos registrados todavía.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          {works.map((w) => {
            const firstImage = w.imagenes && w.imagenes[0];
            const dateLabel = w.fecha ? new Date(w.fecha).toLocaleDateString() : 'Sin fecha';

            return (
              <View key={w.id} style={styles.card}>
                {firstImage?.url ? (
                  <Image source={{ uri: firstImage.url }} style={styles.cardImage} />
                ) : (
                  <View style={styles.cardImagePlaceholder}>
                    <Text style={{ color: '#9ca3af' }}>Sin imagen</Text>
                  </View>
                )}

                <View style={styles.cardBody}>
                  <Text style={styles.cardTitle}>{w.titulo}</Text>
                  <Text style={styles.cardDate}>{dateLabel}</Text>
                  <Text style={styles.cardDesc}>{w.descripcion}</Text>
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}
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
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
  },
  cardImage: {
    width: '100%',
    height: 160,
  },
  cardImagePlaceholder: {
    width: '100%',
    height: 160,
    backgroundColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
    color: '#111827',
  },
  cardDate: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 14,
    color: '#4b5563',
  },
});
