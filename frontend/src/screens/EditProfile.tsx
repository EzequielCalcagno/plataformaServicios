// src/screens/EditProfile.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

import { ApiError } from '../utils/http';

import { uploadProfileImage } from '../services/uploads.client';
import { getCurrentUser } from '../services/user.client';
import {
  getMyProfile,
  updateProfessionalProfile,
  getProOnboardingProfile,
  updateProOnboardingProfile,
} from '../services/profile.client';

import { Screen } from '../components/Screen';
import { Card } from '../components/Card';
import { Input } from '../components/Input';
import { Alert } from '../components/Alert';
import { Button } from '../components/Button';
import { COLORS, SPACING } from '../styles/theme';
import { TopBar } from '../components/TopBar';

type Props = { navigation: any; route: any };
type AppRole = 'professional' | 'client';

type ProfessionalForm = {
  specialty: string;
  about: string;
};

export default function EditProfile({ navigation, route }: Props) {
  const fromBecomePro = !!route?.params?.fromBecomePro;

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

  const isPro = role === 'professional';
  const showProSection = isPro || fromBecomePro;

  // ========= CARGAR PERFIL ==========
  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        setLoading(true);
        setAlertMsg(null);
        setOk(false);

        // 1) Fuente de verdad: backend
        const me = await getCurrentUser();

        const roleId = Number(me.id_rol);
        const derivedRole: AppRole = roleId === 2 ? 'professional' : 'client';

        setRole(derivedRole);
        setAvatarUrl(me.foto_url ? `${me.foto_url}?t=${Date.now()}` : null);

        const canSeeProSection = derivedRole === 'professional' || fromBecomePro;

        if (!canSeeProSection) {
          setOk(true);
          setAlertMsg('Por ahora, en perfil de cliente solo podés actualizar tu foto.');
          return;
        }

        try {
          const pro =
            derivedRole === 'professional' ? await getMyProfile() : await getProOnboardingProfile();

          setProfForm({
            specialty: pro?.especialidad || '',
            about: pro?.descripcion || pro?.experiencia || '',
          });
        } catch (e: any) {
          // Si falla, no rompas la pantalla
          setProfForm({ specialty: '', about: '' });
          setOk(true);
          setAlertMsg('Completá tu info profesional para continuar.');
        }
      } catch (error: any) {
        console.log('❌ Error loadProfileForEdit', error);
        if (mounted) {
          setAlertMsg(error?.message || 'Error al cargar el perfil.');
          setOk(false);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
    // IMPORTANTE: showProSection depende de role, pero role se setea acá.
    // Para evitar loop, usamos fromBecomePro (estable) y NO showProSection.
  }, [fromBecomePro]);

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
      if (!asset?.uri) throw new Error('Sin uri');

      const { url } = await uploadProfileImage({
        uri: asset.uri,
        type: asset.mimeType ?? 'image/jpeg',
        name: asset.fileName ?? 'avatar.jpg',
      });

      setAvatarUrl(`${url}?t=${Date.now()}`);
      setAlertMsg('Imagen actualizada correctamente.');
      setOk(true);
    } catch (error: any) {
      console.log('❌ Error handlePickAvatar:', error);
      setAlertMsg(error?.message || 'Error al subir la imagen.');
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

      // Cliente normal => solo salir
      if (!showProSection) {
        navigation.goBack();
        return;
      }

      if (isPro) {
        await updateProfessionalProfile({
          especialidad: profForm.specialty,
          descripcion: profForm.about,
          experiencia: profForm.about,
        });
        setOk(true);
        setAlertMsg('Perfil actualizado correctamente.');
        return;
      }

      // onboarding (cliente desde BecomePro)
      await updateProOnboardingProfile({
        especialidad: profForm.specialty,
        descripcion: profForm.about,
        experiencia: profForm.about,
      });

      setOk(true);
      setAlertMsg('Perfil profesional guardado. Volvé para continuar el onboarding.');
    } catch (e: any) {
      console.log('❌ Error saving profile', e);
      setAlertMsg(e?.message || 'Error de red al guardar el perfil.');
      setOk(false);
    } finally {
      setSaving(false);
    }
  };

  const initials = useMemo(() => {
    const base = (profForm.specialty || 'U').trim();
    return (base[0] || 'U').toUpperCase();
  }, [profForm.specialty]);

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
    <Screen>
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
        {showProSection && (
          <View style={{ marginTop: SPACING.lg }}>
            <Text style={styles.sectionTitle}>Información profesional</Text>
            <Text style={styles.sectionSub}>
              Completá estos datos para aparecer mejor en búsquedas.
            </Text>

            <View style={{ marginTop: SPACING.md, gap: 12 }}>
              <Input
                placeholder="Especialidad (ej: Electricidad, Plomería)"
                value={profForm.specialty}
                onChangeText={(t: string) => setProfForm((f) => ({ ...f, specialty: t }))}
                editable
              />

              <Input
                placeholder="Sobre mí (tu experiencia, qué ofrecés, cómo trabajás)"
                value={profForm.about}
                onChangeText={(t: string) => setProfForm((f) => ({ ...f, about: t }))}
                editable
                multiline
              />
            </View>
          </View>
        )}

        {/* Guardar */}
        <View style={{ marginTop: SPACING.xl }}>
          <Button
            title={saving ? 'Guardando…' : showProSection ? 'Guardar cambios' : 'Listo'}
            onPress={handleSave}
            disabled={saving || uploadingAvatar}
            variant="primary"
            size="lg"
          />
        </View>
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
});
