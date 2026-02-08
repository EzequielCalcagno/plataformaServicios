// src/screens/ProfessionalServices.tsx
import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { api } from '../utils/api';
import { Screen } from '../components/Screen';
import { TopBar } from '../components/TopBar';
import { Card } from '../components/Card';
import { Alert } from '../components/Alert';

import { COLORS, SPACING, RADII, TYPO, SHADOWS } from '../styles/theme';

type Props = { navigation: any; route: any };

type ServiceDto = {
  id: number;
  profesional_id: string;
  titulo: string;
  descripcion: string | null;
  categoria: string;
  activo: boolean;
  creado_en: string | null;
  precio_base: number | null;
};

function normalizeRow(r: any): ServiceDto {
  return {
    id: Number(r?.id),
    profesional_id: String(r?.profesional_id ?? ''),
    titulo: String(r?.titulo ?? ''),
    descripcion: r?.descripcion ?? null,
    categoria: String(r?.categoria ?? 'Otros'),
    activo: !!r?.activo,
    creado_en: r?.creado_en ?? null,
    precio_base: r?.precio_base ?? null,
  };
}

export default function ProfessionalServices({ route }: Props) {
  const profesionalId = String(route?.params?.profesionalId ?? '').trim();

  const [loading, setLoading] = useState(true);
  const [alertMsg, setAlertMsg] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [services, setServices] = useState<ServiceDto[]>([]);

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      setAlertMsg(null);
      setOk(false);

      if (!profesionalId) {
        setServices([]);
        setAlertMsg('No se recibió el profesionalId.');
        setOk(false);
        return;
      }

      const data = await api.get<any>(
        `/private/services/professional/${encodeURIComponent(profesionalId)}`,
      );

      const rows = Array.isArray(data) ? data : [];
      setServices(rows.map(normalizeRow).filter((s) => !!s.titulo));
    } catch (e: any) {
      console.log('❌ ProfessionalServices error:', e);
      setServices([]);
      setAlertMsg(e?.message ?? 'No se pudieron cargar los servicios.');
      setOk(false);
    } finally {
      setLoading(false);
    }
  }, [profesionalId]);

  useFocusEffect(
    useCallback(() => {
      fetchAll();
    }, [fetchAll]),
  );

  const isEmpty = useMemo(() => !loading && !alertMsg && services.length === 0, [loading, alertMsg, services]);

  return (
    <Screen>
      <TopBar title="Servicios" showBack />

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator />
          <Text style={[TYPO.bodyMuted, { marginTop: 10 }]}>Cargando servicios…</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {alertMsg ? (
            <Alert
              type={ok ? 'success' : 'error'}
              message={alertMsg}
              style={{ marginBottom: SPACING.md }}
            />
          ) : null}

          {isEmpty ? (
            <Card style={styles.emptyCard} withShadow>
              <Ionicons name="briefcase-outline" size={22} color={COLORS.textMuted} />
              <Text style={[TYPO.h3, { marginTop: 8 }]}>Aún no tienes servicios cargados</Text>
              <Text style={[TYPO.helper, { marginTop: 6, textAlign: 'center' }]}>
                Cuando agregues servicios, van a aparecer acá.
              </Text>
            </Card>
          ) : (
            <View style={{ gap: SPACING.sm }}>
              {services.map((s) => (
                <Card key={String(s.id)} style={styles.serviceCard} withShadow>
                  <View style={styles.row}>
                    <View style={styles.icon}>
                      <Ionicons name="construct-outline" size={18} color={COLORS.text} />
                    </View>

                    <View style={{ flex: 1 }}>
                      <Text style={styles.title} numberOfLines={1}>
                        {s.titulo}
                      </Text>

                      <Text style={styles.category} numberOfLines={1}>
                        {s.categoria}
                      </Text>

                      {!!s.descripcion && (
                        <Text style={styles.desc} numberOfLines={4}>
                          {s.descripcion}
                        </Text>
                      )}
                    </View>
                  </View>
                </Card>
              ))}
            </View>
          )}

          <View style={{ height: 28 }} />
        </ScrollView>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: SPACING.lg },

  content: {
    paddingHorizontal: 18,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xl,
  },

  emptyCard: {
    padding: SPACING.lg,
    borderRadius: RADII.lg,
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    backgroundColor: COLORS.cardBg,
    alignItems: 'center',
    ...SHADOWS.soft,
  },

  serviceCard: {
    borderRadius: RADII.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    backgroundColor: COLORS.cardBg,
  },

  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },

  icon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: COLORS.bgLightGrey,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  title: { ...TYPO.label, fontFamily: TYPO.label.fontFamily },
  category: { ...TYPO.caption, marginTop: 2, color: COLORS.textMuted },
  desc: { ...TYPO.body, marginTop: 8 },
});
