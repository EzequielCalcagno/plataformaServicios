// src/screens/EditProfile.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import * as ImagePicker from 'expo-image-picker';

import { Screen } from '../components/Screen';
import { Card } from '../components/Card';
import { Input } from '../components/Input';
import { Alert } from '../components/Alert';
import { Button } from '../components/Button';
import { COLORS, SPACING, TYPO } from '../styles/theme';
import { TopBar } from '../components/TopBar';

const API_URL = (Constants.expoConfig?.extra?.API_URL as string)?.replace(/\/+$/, '') || '';

type Props = { navigation: any };
type AppRole = 'professional' | 'client';

type ProfessionalForm = {
  specialty: string;
  about: string;
};

export default function EditProfile({ navigation }: Props) {
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const [alertMsg, setAlertMsg] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const [profForm, setProfForm] = useState<ProfessionalForm>({
    specialty: '',
    about: '',
  });

  // ========= CARGAR PERFIL ==========
  useEffect(() => {
    const loadProfileForEdit = async () => {
      try {
        setLoading(true);
        setAlertMsg(null);
        setOk(false);

        const token = await AsyncStorage.getItem('@token');
        const storedRole = (await AsyncStorage.getItem('@role')) as AppRole | null;

        if (!token || !storedRole) {
          setAlertMsg('No hay sesión activa.');
          setOk(false);
          return;
        }

        setRole(storedRole);

        // Avatar SIEMPRE desde currentUser
        const meRes = await fetch(`${API_URL}/private/currentUser`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (meRes.ok) {
          const meData = await meRes.json();
          const url = meData?.foto_url ? `${meData.foto_url}?t=${Date.now()}` : null;
          setAvatarUrl(url);
        }

        // Si es cliente, solo foto por ahora (no bloqueamos toda la pantalla con error feo)
        if (storedRole !== 'professional') {
          setAlertMsg('Por ahora, en perfil de cliente solo podés actualizar tu foto.');
          setOk(true);
          return;
        }

        // Datos profesionales
        const res = await fetch(`${API_URL}/private/profile`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!res.ok) {
          const txt = await res.text();
          console.log('❌ Error al cargar perfil profesional', res.status, txt);
          setAlertMsg('No se pudo cargar el perfil profesional.');
          setOk(false);
          return;
        }

        const data = await res.json();

        setProfForm({
          specialty: data.especialidad || '',
          about: data.descripcion || data.experiencia || '',
        });
      } catch (error) {
        console.log('❌ Error loadProfileForEdit', error);
        setAlertMsg('Error al cargar el perfil.');
        setOk(false);
      } finally {
        setLoading(false);
      }
    };

    loadProfileForEdit();
  }, []);

  // ========= SUBIR AVATAR ==========
  const handlePickAvatar = async () => {
    try {
      setAlertMsg(null);
      setOk(false);
      setUploadingAvatar(true);

      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        setAlertMsg('Necesitamos permiso para acceder a tus fotos.');
        setOk(false);
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
        setAlertMsg('No se pudo obtener la imagen seleccionada.');
        setOk(false);
        return;
      }

      const token = await AsyncStorage.getItem('@token');
      if (!token) {
        setAlertMsg('No hay sesión activa.');
        setOk(false);
        return;
      }

      const formData = new FormData();
      formData.append('image', {
        uri: asset.uri,
        type: 'image/jpeg',
        name: 'avatar.jpg',
      } as any);

      const uploadUrl = `${API_URL}/uploads/profile-image`;

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
        setAlertMsg(data.message || 'No se pudo subir la imagen.');
        setOk(false);
        return;
      }

      if (!data.url) {
        setAlertMsg('El servidor no devolvió la URL.');
        setOk(false);
        return;
      }

      setAvatarUrl(`${data.url}?t=${Date.now()}`);
      setAlertMsg('Imagen actualizada correctamente.');
      setOk(true);
    } catch (error) {
      console.log('❌ Error handlePickAvatar:', error);
      setAlertMsg('Error al subir la imagen.');
      setOk(false);
    } finally {
      setUploadingAvatar(false);
    }
  };

  // ========= GUARDAR PERFIL ==========
  const handleSave = async () => {
    try {
      setSaving(true);
      setAlertMsg(null);
      setOk(false);

      const token = await AsyncStorage.getItem('@token');
      if (!token || !role) {
        setAlertMsg('No hay sesión activa.');
        setOk(false);
        return;
      }

      if (role !== 'professional') {
        setAlertMsg('Foto actualizada. (Edición de cliente aún no implementada)');
        setOk(true);
        return;
      }

      const body = {
        descripcion: profForm.about,
        especialidad: profForm.specialty,
        experiencia: profForm.about,
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
        setAlertMsg('No se pudo guardar el perfil.');
        setOk(false);
        return;
      }

      setAlertMsg('Perfil actualizado correctamente.');
      setOk(true);
    } catch (error) {
      console.log('❌ Error saving profile', error);
      setAlertMsg('Error de red al guardar el perfil.');
      setOk(false);
    } finally {
      setSaving(false);
    }
  };

  const initials = useMemo(() => {
    const base = (profForm.specialty || 'U').trim();
    return (base[0] || 'U').toUpperCase();
  }, [profForm.specialty]);

  const isPro = role === 'professional';
  const canEdit = isPro; // por ahora

  if (loading) {
    return (
      <Screen>
        <View style={styles.center}>
          <Text style={styles.muted}>Cargando perfil…</Text>
        </View>
      </Screen>
    );
  }

  if (!role) {
    return (
      <Screen>
        <View style={styles.center}>
          <Text style={styles.muted}>No se pudo determinar el rol.</Text>
          <Button title="Volver" onPress={() => navigation.goBack()} variant="outline" />
        </View>
      </Screen>
    );
  }

  return (
    <Screen>\
      <TopBar title="Editar perfil" showBack />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {alertMsg && (
          <Alert
            type={ok ? 'success' : 'error'}
            message={alertMsg}
            style={{ marginBottom: SPACING.md }}
          />
        )}

        {/* Avatar card */}
        <Card style={styles.avatarCard} withShadow>
          <View style={styles.avatarRow}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Text style={styles.avatarInitial}>{initials}</Text>
              </View>
            )}

            <View style={{ flex: 1 }}>
              <Text style={styles.avatarTitle}>Foto de perfil</Text>
              <Text style={styles.avatarSub}>
                Se muestra en tu perfil público y en tus reservas.
              </Text>

              <View style={{ marginTop: 10 }}>
                <Button
                  title={
                    uploadingAvatar ? 'Subiendo…' : avatarUrl ? 'Cambiar foto' : 'Agregar foto'
                  }
                  onPress={handlePickAvatar}
                  disabled={uploadingAvatar}
                  variant="neutral"
                  size="md"
                  leftIcon={
                    <Ionicons
                      name="image-outline"
                      size={18}
                      color={COLORS.text}
                      style={{ marginRight: 6 }}
                    />
                  }
                />
              </View>
            </View>
          </View>
        </Card>

        {/* Form profesional */}
        <View style={{ marginTop: SPACING.lg }}>
          <Text style={styles.sectionTitle}>Información profesional</Text>
          <Text style={styles.sectionSub}>
            {canEdit
              ? 'Completá estos datos para aparecer mejor en búsquedas.'
              : 'Solo disponible para perfiles profesionales.'}
          </Text>

          <View style={{ marginTop: SPACING.md, gap: 12 }}>
            <Input
              placeholder="Especialidad (ej: Electricidad, Plomería)"
              value={profForm.specialty}
              onChangeText={(t: string) => setProfForm((f) => ({ ...f, specialty: t }))}
              editable={canEdit}
            />

            <Input
              placeholder="Sobre mí (tu experiencia, qué ofrecés, cómo trabajás)"
              value={profForm.about}
              onChangeText={(t: string) => setProfForm((f) => ({ ...f, about: t }))}
              editable={canEdit}
              multiline
            />

            {isPro && (
              <Text style={styles.helper}>
                Tip: escribí 2–3 líneas concretas (años de experiencia, zonas, tiempos de
                respuesta).
              </Text>
            )}
          </View>
        </View>

        {/* Guardar */}
        <View style={{ marginTop: SPACING.xl }}>
          <Button
            title={saving ? 'Guardando…' : isPro ? 'Guardar cambios' : 'Listo'}
            onPress={handleSave}
            disabled={saving || uploadingAvatar}
            variant="primary"
            size="lg"
          />
        </View>

        {/* Cliente: aviso */}
        {!isPro && (
          <Text style={[styles.helper, { marginTop: SPACING.md }]}>
            La edición completa de perfil de cliente la agregamos después. Por ahora, foto.
          </Text>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 30,
  },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  muted: { color: COLORS.textMuted, fontWeight: '600' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    marginBottom: 8,
  },
  headerTitle: { textAlign: 'center', flex: 1 },

  iconBtn: {
    width: 42,
    height: 42,
    borderRadius: 999,
    backgroundColor: COLORS.bgLightGrey,
    alignItems: 'center',
    justifyContent: 'center',
  },

  avatarCard: {
    borderRadius: 18,
    padding: 14,
  },
  avatarRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },

  avatar: { width: 72, height: 72, borderRadius: 36 },
  avatarPlaceholder: {
    backgroundColor: COLORS.bgLightGrey,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: { fontSize: 26, fontWeight: '700', color: COLORS.textMuted },

  avatarTitle: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  avatarSub: { marginTop: 2, fontSize: 12, fontWeight: '600', color: COLORS.textMuted },

  sectionTitle: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  sectionSub: { marginTop: 2, fontSize: 12, fontWeight: '600', color: COLORS.textMuted },

  helper: { fontSize: 12, fontWeight: '600', color: COLORS.textMuted, marginTop: 6 },
});
