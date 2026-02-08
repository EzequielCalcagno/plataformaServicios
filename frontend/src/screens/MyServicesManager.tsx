// src/screens/MyServicesManager.tsx
import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Modal,
  TextInput,
  TouchableOpacity,
  Alert as RNAlert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { api } from '../utils/api';

import { Screen } from '../components/Screen';
import { TopBar } from '../components/TopBar';
import { Card } from '../components/Card';
import { Alert } from '../components/Alert';
import { Button } from '../components/Button';

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

type UpdateServicePayload = {
  titulo: string;
  descripcion: string | null;
  categoria: string;
  activo: boolean;
  precio_base: number | null;
};

function safeStr(v: any, fallback = '') {
  const s = String(v ?? '').trim();
  return s ? s : fallback;
}

function normalizeService(input: any, idx: number): ServiceDto {
  return {
    id: Number(input?.id ?? input?.serviceId ?? input?.servicio_id ?? idx),
    profesional_id: safeStr(input?.profesional_id ?? input?.profesionalId ?? ''),
    titulo: safeStr(input?.titulo ?? input?.title ?? input?.name, 'Servicio'),
    descripcion:
      input?.descripcion != null
        ? String(input.descripcion)
        : input?.description != null
          ? String(input.description)
          : null,
    categoria: safeStr(input?.categoria ?? input?.category ?? 'Otros', 'Otros'),
    activo: typeof input?.activo === 'boolean' ? input.activo : true,
    creado_en: input?.creado_en ?? input?.created_at ?? null,
    precio_base:
      input?.precio_base == null
        ? null
        : Number.isFinite(Number(input?.precio_base))
          ? Number(input?.precio_base)
          : null,
  };
}

export default function MyServicesManager({ navigation }: Props) {
  const [loading, setLoading] = useState(true);
  const [alertMsg, setAlertMsg] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [services, setServices] = useState<ServiceDto[]>([]);

  // Edit modal
  const [editOpen, setEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const [editId, setEditId] = useState<number | null>(null);
  const [formTitulo, setFormTitulo] = useState('');
  const [formDescripcion, setFormDescripcion] = useState('');
  const [formCategoria, setFormCategoria] = useState('');
  const [formPrecioBase, setFormPrecioBase] = useState('');
  const [formActivo, setFormActivo] = useState(true);

  // Category select modal
  const [catOpen, setCatOpen] = useState(false);

  const categories = useMemo(() => {
    const uniq = new Set<string>();
    for (const s of services) {
      const c = safeStr(s.categoria, '').trim();
      if (c) uniq.add(c);
    }
    const arr = Array.from(uniq).sort((a, b) => a.localeCompare(b));
    if (!arr.includes('Otros')) arr.push('Otros');
    return arr;
  }, [services]);

  const fetchServices = useCallback(async () => {
    try {
      setLoading(true);
      setAlertMsg(null);
      setOk(false);

      const data = await api.get<any>('/private/services');
      const arr = Array.isArray(data) ? data : Array.isArray(data?.services) ? data.services : [];
      setServices(arr.map((s: any, idx: number) => normalizeService(s, idx)));
    } catch (e: any) {
      console.log('❌ MyServicesManager fetch error', e);
      setServices([]);
      setOk(false);
      setAlertMsg('No se pudieron cargar tus servicios.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchServices();
    }, [fetchServices]),
  );

  const sorted = useMemo(() => {
    return [...services].sort((a, b) => {
      const ca = safeStr(a.categoria, 'Otros').toLowerCase();
      const cb = safeStr(b.categoria, 'Otros').toLowerCase();
      if (ca < cb) return -1;
      if (ca > cb) return 1;
      return safeStr(a.titulo).toLowerCase().localeCompare(safeStr(b.titulo).toLowerCase());
    });
  }, [services]);

  const empty = !loading && services.length === 0;

  const openEdit = useCallback(
    (s: ServiceDto) => {
      setEditId(s.id);
      setFormTitulo(s.titulo ?? '');
      setFormDescripcion(s.descripcion ?? '');
      setFormCategoria(s.categoria ?? 'Otros');
      setFormPrecioBase(s.precio_base == null ? '' : String(s.precio_base));
      setFormActivo(!!s.activo);
      setEditOpen(true);
    },
    [],
  );

  const closeEdit = useCallback(() => {
    setEditOpen(false);
    setEditId(null);
    setFormTitulo('');
    setFormDescripcion('');
    setFormCategoria('');
    setFormPrecioBase('');
    setFormActivo(true);
    setCatOpen(false);
  }, []);

  const onSave = useCallback(async () => {
    if (!editId) return;

    const titulo = formTitulo.trim();
    const categoria = (formCategoria.trim() || 'Otros').trim();

    if (!titulo) {
      setOk(false);
      setAlertMsg('El título es obligatorio.');
      return;
    }

    setSaving(true);
    setAlertMsg(null);
    setOk(false);

    try {
      const precio_base =
        formPrecioBase.trim() === ''
          ? null
          : Number.isFinite(Number(formPrecioBase))
            ? Number(formPrecioBase)
            : null;

      const payload: UpdateServicePayload = {
        titulo,
        descripcion: formDescripcion.trim() ? formDescripcion.trim() : null,
        categoria,
        activo: !!formActivo,
        precio_base,
      };

      // ✅ CLAVE: con tu http.ts, SIEMPRE mandamos objetos en body
      await api.patch(`/private/services/${editId}`, { body: payload });

      setOk(true);
      setAlertMsg('Servicio actualizado.');
      closeEdit();
      await fetchServices();
    } catch (e: any) {
      console.log('❌ update service error', e);
      setOk(false);
      setAlertMsg(e?.message ?? 'No se pudo actualizar el servicio.');
    } finally {
      setSaving(false);
    }
  }, [
    editId,
    formTitulo,
    formDescripcion,
    formCategoria,
    formActivo,
    formPrecioBase,
    closeEdit,
    fetchServices,
  ]);

  const confirmDelete = useCallback(
  (serviceId: number) => {
    RNAlert.alert(
      'Eliminar servicio',
      '¿Seguro que querés eliminar este servicio? Esta acción no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            setDeletingId(serviceId);
            setAlertMsg(null);
            setOk(false);

            try {
              await api.delete(`/private/services/${serviceId}`);
              setOk(true);
              setAlertMsg('Servicio eliminado.');
              await fetchServices();
            } catch (e: any) {
              console.log('❌ delete service error', e);

              // ✅ Si el backend devuelve 409 (tiene reservas), ofrecemos DESACTIVAR
              const status = e?.status;
              const code = e?.data?.code;

              if (status === 409 && code === 'SERVICE_HAS_RESERVATIONS') {
                RNAlert.alert(
                  'No se puede eliminar',
                  'Este servicio ya tiene reservas asociadas. Podés desactivarlo para que no aparezca en búsquedas.',
                  [
                    { text: 'Cancelar', style: 'cancel' },
                    {
                      text: 'Desactivar',
                      style: 'default',
                      onPress: async () => {
                        setDeletingId(serviceId);
                        setAlertMsg(null);
                        setOk(false);

                        try {
                          // ✅ endpoint sugerido: PATCH /private/services/:id/deactivate
                          // OJO: tu http() ya hace JSON.stringify(body), así que body debe ser objeto, NO string.
                          await api.patch(`/private/services/${serviceId}/deactivate`, { body: {} });

                          setOk(true);
                          setAlertMsg('Servicio desactivado.');
                          await fetchServices();
                        } catch (err: any) {
                          console.log('❌ deactivate service error', err);
                          setOk(false);
                          setAlertMsg(err?.message ?? 'No se pudo desactivar el servicio.');
                        } finally {
                          setDeletingId(null);
                        }
                      },
                    },
                  ],
                );

                return; // 👈 importante para no pisar el mensaje con el genérico
              }

              setOk(false);
              setAlertMsg(e?.message ?? 'No se pudo eliminar el servicio.');
            } finally {
              setDeletingId(null);
            }
          },
        },
      ],
    );
  },
  [fetchServices],
);


  if (loading) {
    return (
      <Screen>
        <TopBar title="Mis servicios" showBack />
        <View style={styles.center}>
          <ActivityIndicator />
          <Text style={[TYPO.bodyMuted, { marginTop: 10 }]}>Cargando servicios…</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <TopBar
        title="Mis servicios"
        showBack
        rightNode={
          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.iconBtn}
            onPress={() => navigation.navigate('AddService')}
          >
            <Ionicons name="add" size={20} color={COLORS.text} />
          </TouchableOpacity>
        }
      />

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {alertMsg ? (
          <Alert
            type={ok ? 'success' : 'error'}
            message={alertMsg}
            style={{ marginBottom: SPACING.md }}
          />
        ) : null}

        <Card style={styles.headerCard} withShadow>
          <Text style={styles.hTitle}>Tus servicios</Text>
          <Text style={styles.hSub}>Podés editarlos o eliminarlos. Para agregar uno nuevo, tocá el +.</Text>

          <View style={styles.countRow}>
            <Ionicons name="briefcase-outline" size={16} color={COLORS.textMuted} />
            <Text style={styles.countText}>{services.length} servicio(s)</Text>
          </View>
        </Card>

        {empty ? (
          <Card style={styles.emptyCard} withShadow>
            <Ionicons name="alert-circle-outline" size={20} color={COLORS.textMuted} />
            <Text style={styles.emptyTitle}>Aún no tienes servicios cargados</Text>
            <Text style={styles.emptySub}>
              Agregá tu primer servicio para que los clientes puedan encontrarte.
            </Text>

            <Button
              title="Agregar servicio"
              style={{ marginTop: SPACING.md }}
              onPress={() => navigation.navigate('AddService')}
            />
          </Card>
        ) : (
          <View style={{ gap: SPACING.sm }}>
            {sorted.map((s) => (
              <Card key={String(s.id)} style={styles.serviceCard} withShadow>
                <View style={styles.serviceRow}>
                  <View style={styles.serviceIcon}>
                    <Ionicons name="briefcase-outline" size={18} color={COLORS.text} />
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={styles.serviceTitle} numberOfLines={2}>
                      {s.titulo}
                    </Text>

                    <Text style={styles.serviceCategory} numberOfLines={1}>
                      {safeStr(s.categoria, 'Otros')}
                      {!s.activo ? ' · (Inactivo)' : ''}
                    </Text>

                    {!!s.descripcion && (
                      <Text style={styles.serviceDesc} numberOfLines={4}>
                        {s.descripcion}
                      </Text>
                    )}

                    {s.precio_base != null && (
                      <Text style={[TYPO.caption, { marginTop: 6, color: COLORS.textMuted }]}>
                        Precio base: {s.precio_base}
                      </Text>
                    )}
                  </View>

                  <View style={styles.actionsCol}>
                    <TouchableOpacity
                      activeOpacity={0.85}
                      style={styles.actionBtn}
                      onPress={() => openEdit(s)}
                    >
                      <Ionicons name="create-outline" size={18} color={COLORS.text} />
                    </TouchableOpacity>

                    <TouchableOpacity
                      activeOpacity={0.85}
                      style={[styles.actionBtn, { borderColor: COLORS.danger }]}
                      onPress={() => confirmDelete(s.id)}
                      disabled={deletingId === s.id}
                    >
                      {deletingId === s.id ? (
                        <ActivityIndicator size="small" color={COLORS.danger} />
                      ) : (
                        <Ionicons name="trash-outline" size={18} color={COLORS.danger} />
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              </Card>
            ))}
          </View>
        )}

        <View style={{ height: 60 }} />
      </ScrollView>

      {/* ===== Modal Edit ===== */}
      <Modal visible={editOpen} transparent animationType="fade" onRequestClose={closeEdit}>
        <View style={styles.modalBackdrop}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Editar servicio</Text>
                <TouchableOpacity activeOpacity={0.85} onPress={closeEdit} style={styles.closeBtn}>
                  <Ionicons name="close" size={18} color={COLORS.text} />
                </TouchableOpacity>
              </View>

              <Text style={styles.label}>Título</Text>
              <TextInput
                value={formTitulo}
                onChangeText={setFormTitulo}
                placeholder="Ej: Pintura interior"
                placeholderTextColor={COLORS.textMuted}
                style={styles.input}
              />

              <Text style={styles.label}>Categoría</Text>
              <TouchableOpacity
                activeOpacity={0.9}
                style={styles.select}
                onPress={() => setCatOpen(true)}
              >
                <Text style={styles.selectText}>
                  {formCategoria?.trim() ? formCategoria.trim() : 'Seleccionar categoría'}
                </Text>
                <Ionicons name="chevron-down" size={18} color={COLORS.textMuted} />
              </TouchableOpacity>

              <Text style={styles.label}>Descripción</Text>
              <TextInput
                value={formDescripcion}
                onChangeText={setFormDescripcion}
                placeholder="Opcional"
                placeholderTextColor={COLORS.textMuted}
                style={[styles.input, { minHeight: 84, textAlignVertical: 'top' }]}
                multiline
              />

              <Text style={styles.label}>Precio base (opcional)</Text>
              <TextInput
                value={formPrecioBase}
                onChangeText={setFormPrecioBase}
                placeholder="Ej: 2000"
                placeholderTextColor={COLORS.textMuted}
                keyboardType="numeric"
                style={styles.input}
              />

              <View style={styles.activeRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Estado</Text>
                  <Text style={[TYPO.caption, { color: COLORS.textMuted, marginTop: 2 }]}>
                    {formActivo ? 'Activo (visible en búsquedas)' : 'Inactivo (oculto)'}
                  </Text>
                </View>

                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => setFormActivo((p) => !p)}
                  style={[
                    styles.togglePill,
                    { backgroundColor: formActivo ? COLORS.primaryBrilliant : COLORS.bgLightGrey },
                  ]}
                >
                  <Text style={{ ...TYPO.caption, color: formActivo ? '#fff' : COLORS.text }}>
                    {formActivo ? 'Activo' : 'Inactivo'}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.modalBtns}>
                <Button title="Cancelar" variant="outline" onPress={closeEdit} style={{ flex: 1 }} />
                <Button
                  title={saving ? 'Guardando…' : 'Guardar'}
                  onPress={onSave}
                  style={{ flex: 1 }}
                  disabled={saving}
                />
              </View>

              {/* ===== Modal Categorías ===== */}
              <Modal
                visible={catOpen}
                transparent
                animationType="fade"
                onRequestClose={() => setCatOpen(false)}
              >
                <View style={styles.modalBackdrop}>
                  <View style={[styles.modalCard, { padding: SPACING.md }]}>
                    <View style={styles.modalHeader}>
                      <Text style={styles.modalTitle}>Seleccionar categoría</Text>
                      <TouchableOpacity
                        activeOpacity={0.85}
                        onPress={() => setCatOpen(false)}
                        style={styles.closeBtn}
                      >
                        <Ionicons name="close" size={18} color={COLORS.text} />
                      </TouchableOpacity>
                    </View>

                    <ScrollView style={{ maxHeight: 360 }} showsVerticalScrollIndicator={false}>
                      {categories.map((c) => (
                        <TouchableOpacity
                          key={c}
                          activeOpacity={0.9}
                          style={styles.catRow}
                          onPress={() => {
                            setFormCategoria(c);
                            setCatOpen(false);
                          }}
                        >
                          <Text style={styles.catText}>{c}</Text>
                          {formCategoria === c ? (
                            <Ionicons name="checkmark" size={18} color={COLORS.primaryBrilliant} />
                          ) : null}
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                </View>
              </Modal>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: SPACING.lg },

  container: {
    paddingHorizontal: 18,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xl,
  },

  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: RADII.pill,
    backgroundColor: COLORS.bgLightGrey,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  headerCard: {
    padding: SPACING.lg,
    borderRadius: RADII.lg,
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    backgroundColor: COLORS.cardBg,
    marginBottom: SPACING.md,
    ...SHADOWS.soft,
  },

  hTitle: { ...TYPO.h2 },
  hSub: { ...TYPO.subtitle, marginTop: 6 },

  countRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: SPACING.md },
  countText: { ...TYPO.caption, color: COLORS.textMuted },

  emptyCard: {
    padding: SPACING.lg,
    borderRadius: RADII.lg,
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    backgroundColor: COLORS.cardBg,
    alignItems: 'center',
    gap: 10,
  },
  emptyTitle: { ...TYPO.h3, textAlign: 'center' },
  emptySub: { ...TYPO.helper, textAlign: 'center' },

  serviceCard: {
    borderRadius: RADII.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    backgroundColor: COLORS.cardBg,
  },

  serviceRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  serviceIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: COLORS.bgLightGrey,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  serviceTitle: { ...TYPO.label, fontFamily: TYPO.label.fontFamily },
  serviceCategory: { ...TYPO.caption, marginTop: 4, color: COLORS.textMuted },
  serviceDesc: { ...TYPO.body, marginTop: 8, color: COLORS.text },

  actionsCol: { gap: 10, marginLeft: 4 },
  actionBtn: {
    width: 38,
    height: 38,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.cardBg,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
  },
  modalCard: {
    width: '100%',
    maxWidth: 520,
    backgroundColor: COLORS.cardBg,
    borderRadius: RADII.lg,
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    padding: SPACING.lg,
    ...SHADOWS.soft,
  },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  modalTitle: { ...TYPO.h2 },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.bgLightGrey,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  label: { ...TYPO.caption, color: COLORS.textMuted, marginTop: 12, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.bgLightGrey,
    borderRadius: RADII.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    ...TYPO.body,
  },

  select: {
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.bgLightGrey,
    borderRadius: RADII.md,
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectText: { ...TYPO.body, color: COLORS.text },

  activeRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12 },
  togglePill: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: RADII.pill,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  modalBtns: { flexDirection: 'row', gap: 10, marginTop: SPACING.lg },

  catRow: {
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: RADII.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.bgLightGrey,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  catText: { ...TYPO.body, color: COLORS.text },
});
