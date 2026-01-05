// src/screens/ReservationDetail.tsx
import React, { useCallback, useMemo, useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
  TouchableOpacity,
  Linking,
  Image,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

import { Screen } from '../components/Screen';
import { TopBar } from '../components/TopBar';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { SectionTitle } from '../components/SectionTitle';
import { RateReservationSheet } from '../components/RateReservationSheet';
import { COLORS, SPACING, RADII } from '../styles/theme';

import {
  ReservationListItem,
  getReservationById,
  proAcceptReservation,
  proProposeReservation,
  proCancelReservation,
  proFinishReservation,
  clientAcceptProposal,
  clientRejectProposal,
  requesterFinish,
  confirmFinish,
  rejectFinish,
  // ✅ ratings
  rateReservation,
} from '../services/reservations.client';

type Props = { navigation: any; route: any };
type Side = 'SOLICITANTE' | 'PRESTADOR' | 'UNKNOWN';

function toISO(dateStr: string, timeStr: string) {
  const d = dateStr.trim();
  const t = timeStr.trim();
  if (!d || !t) return null;

  const dt = new Date(`${d}T${t}:00`);
  if (Number.isNaN(dt.getTime())) return null;
  return dt.toISOString();
}

function fmtDate(iso?: string | null) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat('es-UY', { dateStyle: 'medium', timeStyle: 'short' }).format(d);
}

function openWhatsApp(phone: string, text: string) {
  const digits = phone.replace(/[^\d]/g, '');
  if (!digits) {
    Alert.alert('Error', 'Teléfono inválido.');
    return;
  }
  const url = `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
  Linking.openURL(url).catch(() => Alert.alert('Error', 'No se pudo abrir WhatsApp.'));
}

function getScheduledISO(it: ReservationListItem) {
  return it.fechaHoraPropuesta ?? it.fechaHoraSolicitada ?? null;
}
function isScheduledInFuture(iso?: string | null) {
  if (!iso) return false;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return false;
  return d.getTime() > Date.now();
}

function moneyUYU(n?: number | null) {
  if (n == null) return '';
  try {
    return new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'UYU' }).format(n);
  } catch {
    return `$${n}`;
  }
}

export default function ReservationDetail({ navigation, route }: Props) {
  const reservationId = Number(route?.params?.reservationId);

  const [loading, setLoading] = useState(true);
  const [item, setItem] = useState<ReservationListItem | null>(null);
  const [myUserId, setMyUserId] = useState<string>('');

  const [proposeDate, setProposeDate] = useState('');
  const [proposeTime, setProposeTime] = useState('');
  const [proposeMsg, setProposeMsg] = useState('');
  const [cancelReason, setCancelReason] = useState('');
  const [rejectMsg, setRejectMsg] = useState('');

  // ✅ bottom sheet rating
  const [showRateSheet, setShowRateSheet] = useState<boolean>(false);
  const [ratingSending, setRatingSending] = useState<boolean>(false);

  // ✅ para evitar abrir el sheet muchas veces en re-renders
  const didAutoOpenForThisClose = useRef<string | null>(null);

  const fetchDetail = useCallback(async () => {
    try {
      setLoading(true);

      const uid = (await AsyncStorage.getItem('@userId')) ?? '';
      setMyUserId(uid);

      if (!Number.isFinite(reservationId)) {
        setItem(null);
        return;
      }

      const r = await getReservationById(reservationId);
      setItem(r);

      // precarga si ya había propuesta
      if (r?.fechaHoraPropuesta) {
        const dt = new Date(r.fechaHoraPropuesta);
        if (!Number.isNaN(dt.getTime())) {
          const y = dt.getFullYear();
          const m = String(dt.getMonth() + 1).padStart(2, '0');
          const d = String(dt.getDate()).padStart(2, '0');
          const hh = String(dt.getHours()).padStart(2, '0');
          const mm = String(dt.getMinutes()).padStart(2, '0');
          setProposeDate(`${y}-${m}-${d}`);
          setProposeTime(`${hh}:${mm}`);
        }
      }
      setProposeMsg(r?.mensajePropuesta ?? '');
    } catch (e) {
      console.log('❌ ReservationDetail fetch error', e);
      setItem(null);
    } finally {
      setLoading(false);
    }
  }, [reservationId]);

  useFocusEffect(
    useCallback(() => {
      fetchDetail();
    }, [fetchDetail]),
  );

  const mySide: Side = useMemo(() => {
    if (!item || !myUserId) return 'UNKNOWN';
    if (String(item.clienteId) === String(myUserId)) return 'SOLICITANTE';
    if (String(item.profesionalId) === String(myUserId)) return 'PRESTADOR';
    return 'UNKNOWN';
  }, [item, myUserId]);

  // ✅ mapeo para comparar con accionRequeridaPor (CLIENTE/PROFESIONAL)
  const myActionKey = useMemo(() => {
    if (mySide === 'SOLICITANTE') return 'CLIENTE' as const;
    if (mySide === 'PRESTADOR') return 'PROFESIONAL' as const;
    return null;
  }, [mySide]);

  const title = useMemo(
    () => item?.servicioTitulo ?? `Reserva #${reservationId}`,
    [item?.servicioTitulo, reservationId],
  );

  const otherName = useMemo(() => {
    if (!item) return '';
    if (mySide === 'PRESTADOR') {
      return `${item.clienteNombre ?? ''} ${item.clienteApellido ?? ''}`.trim() || item.clienteId;
    }
    if (mySide === 'SOLICITANTE') {
      return `${item.profesionalNombre ?? ''} ${item.profesionalApellido ?? ''}`.trim() || item.profesionalId;
    }
    return '';
  }, [item, mySide]);

  const otherPhotoUrl = useMemo(() => {
    if (!item) return null;
    if (mySide === 'PRESTADOR') return item.clienteFotoUrl ?? null;
    if (mySide === 'SOLICITANTE') return item.profesionalFotoUrl ?? null;
    return null;
  }, [item, mySide]);

  const otherPhone = useMemo(() => {
    if (!item) return null;
    if (mySide === 'PRESTADOR') return item.clienteTelefono ?? null;
    if (mySide === 'SOLICITANTE') return item.profesionalTelefono ?? null;
    return null;
  }, [item, mySide]);

  const whatsappEnabled = useMemo(() => {
    if (!item) return false;
    return ['EN_PROCESO', 'FINALIZADO', 'CERRADO'].includes(item.estado);
  }, [item]);

  const showProviderActions = useMemo(() => {
    if (!item) return false;
    if (mySide !== 'PRESTADOR') return false;
    return ['PENDIENTE', 'EN_NEGOCIACION', 'EN_PROCESO'].includes(item.estado);
  }, [item, mySide]);

  const showRequesterActions = useMemo(() => {
    if (!item) return false;
    if (mySide !== 'SOLICITANTE') return false;
    return item.estado === 'EN_NEGOCIACION';
  }, [item, mySide]);

  const canProviderAccept =
    !!item && mySide === 'PRESTADOR' && (item.estado === 'PENDIENTE' || item.estado === 'EN_NEGOCIACION');
  const canProviderFinish = !!item && mySide === 'PRESTADOR' && item.estado === 'EN_PROCESO';

  const canRequesterAccept = !!item && mySide === 'SOLICITANTE' && item.estado === 'EN_NEGOCIACION';
  const canRequesterFinish = !!item && mySide === 'SOLICITANTE' && item.estado === 'EN_PROCESO';

  // ✅ confirmación de finalización
  const canConfirmFinish =
    !!item && item.estado === 'FINALIZADO' && !!myActionKey && item.accionRequeridaPor === myActionKey;
  const canRejectFinish = canConfirmFinish;

  const proposalIsoPreview = useMemo(() => {
    const iso = toISO(proposeDate, proposeTime);
    return iso ? fmtDate(iso) : null;
  }, [proposeDate, proposeTime]);

  const statusStep = useMemo(() => {
    if (!item) return 0;
    if (item.estado === 'PENDIENTE' || item.estado === 'EN_NEGOCIACION') return 1;
    if (item.estado === 'EN_PROCESO') return 2;
    if (item.estado === 'FINALIZADO' || item.estado === 'CERRADO') return 3;
    return 1;
  }, [item]);

  // ✅ Rating: reglas
  const isClosed = !!item && item.estado === 'CERRADO';

  const iAmRequester = mySide === 'SOLICITANTE';
  const iAmProvider = mySide === 'PRESTADOR';

  const iAlreadyRated = useMemo(() => {
    if (!item) return false;
    if (iAmRequester) return !!item.clienteCalifico;
    if (iAmProvider) return !!item.profesionalCalifico;
    return false;
  }, [item, iAmRequester, iAmProvider]);

  const otherAlreadyRated = useMemo(() => {
    if (!item) return false;
    if (iAmRequester) return !!item.profesionalCalifico;
    if (iAmProvider) return !!item.clienteCalifico;
    return false;
  }, [item, iAmRequester, iAmProvider]);

  const canRateNow = useMemo(() => {
    if (!item) return false;
    if (!isClosed) return false;
    if (mySide === 'UNKNOWN') return false;
    return !iAlreadyRated;
  }, [item, isClosed, mySide, iAlreadyRated]);

  const ratingTitle = useMemo(() => {
    if (mySide === 'SOLICITANTE') return 'Califica al profesional';
    if (mySide === 'PRESTADOR') return 'Califica al solicitante';
    return 'Calificar';
  }, [mySide]);

  const ratingQuestion = useMemo(() => {
    const name = otherName || 'la otra persona';
    return `Como fue tu experiencia con\n${name}?`;
  }, [otherName]);

  const ratingPlaceholder = useMemo(() => {
    return mySide === 'SOLICITANTE'
      ? 'Describe tu experiencia con el profesional...'
      : 'Describe tu experiencia con el solicitante...';
  }, [mySide]);

  const canSeeRatings = useMemo(() => {
    if (!item) return false;
    if (typeof (item as any).canSeeRatings === 'boolean') return (item as any).canSeeRatings;
    return !!item.clienteCalifico && !!item.profesionalCalifico;
  }, [item]);

  // ✅ AUTO-OPEN: cuando pasa a CERRADO, se abre el sheet si te toca calificar
  useEffect(() => {
    if (!item) return;

    if (item.estado !== 'CERRADO') {
      // si vuelve a estados previos, habilita a futuro volver a abrir al cerrar
      didAutoOpenForThisClose.current = null;
      return;
    }

    if (!canRateNow) return;

    const key = `${item.id}-CERRADO-${myUserId}-${mySide}`;
    if (didAutoOpenForThisClose.current === key) return;

    didAutoOpenForThisClose.current = key;
    setShowRateSheet(true);
  }, [item?.estado, item?.id, canRateNow, myUserId, mySide, item]);

  const renderStarsStatic = (value: number) => {
    const v = Math.max(0, Math.min(5, Number(value || 0)));
    return (
      <View style={styles.starsRow}>
        {[1, 2, 3, 4, 5].map((n) => (
          <Ionicons key={n} name={n <= v ? 'star' : 'star-outline'} size={22} color="#F7B500" />
        ))}
      </View>
    );
  };

  // --- Handlers ---
  const onProviderAccept = async () => {
    if (!item) return;
    try {
      await proAcceptReservation(item.id);
      Alert.alert('Listo', 'Reserva aceptada.');
      fetchDetail();
    } catch (e) {
      console.log('❌ accept error', e);
      Alert.alert('Error', 'No se pudo aceptar.');
    }
  };

  const onProviderPropose = async () => {
    if (!item) return;
    const iso = toISO(proposeDate, proposeTime);
    if (!iso) {
      Alert.alert('Falta fecha/hora', 'Ingresá fecha (YYYY-MM-DD) y hora (HH:mm).');
      return;
    }
    try {
      await proProposeReservation(item.id, {
        fechaHoraPropuesta: iso,
        mensajePropuesta: proposeMsg.trim() || undefined,
      });
      Alert.alert('Enviado', 'Propuesta enviada.');
      fetchDetail();
    } catch (e) {
      console.log('❌ propose error', e);
      Alert.alert('Error', 'No se pudo enviar la propuesta.');
    }
  };

  const onProviderCancel = async () => {
    if (!item) return;
    try {
      await proCancelReservation(item.id, { motivo: cancelReason.trim() || undefined });
      Alert.alert('Cancelado', 'La reserva fue cancelada.');
      fetchDetail();
    } catch (e) {
      console.log('❌ cancel error', e);
      Alert.alert('Error', 'No se pudo cancelar.');
    }
  };

  const onProviderFinish = async () => {
    if (!item) return;

    const sched = getScheduledISO(item);
    const warn = isScheduledInFuture(sched);
    const msg =
      (warn ? `Todavía no pasó la fecha/hora agendada (${fmtDate(sched)}).\n\n` : '') +
      `Al finalizar, le llegará una notificación al solicitante para confirmar.`;

    Alert.alert('¿Finalizar servicio?', msg, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sí, finalizar',
        style: 'destructive',
        onPress: async () => {
          try {
            await proFinishReservation(item.id);
            Alert.alert('Finalizado', 'Se solicitó la finalización.');
            fetchDetail();
          } catch (e) {
            console.log('❌ finish error', e);
            Alert.alert('Error', 'No se pudo finalizar.');
          }
        },
      },
    ]);
  };

  const onRequesterAcceptProposal = async () => {
    if (!item) return;
    try {
      await clientAcceptProposal(item.id);
      Alert.alert('Confirmado', 'Aceptaste la propuesta.');
      fetchDetail();
    } catch (e) {
      console.log('❌ accept proposal error', e);
      Alert.alert('Error', 'No se pudo aceptar.');
    }
  };

  const onRequesterRejectProposal = async () => {
    if (!item) return;
    try {
      await clientRejectProposal(item.id, { mensaje: rejectMsg.trim() || undefined });
      Alert.alert('Enviado', 'Rechazaste la propuesta (vuelve a pendiente).');
      fetchDetail();
    } catch (e) {
      console.log('❌ reject proposal error', e);
      Alert.alert('Error', 'No se pudo rechazar.');
    }
  };

  const onRequesterFinish = async () => {
    if (!item) return;

    const sched = getScheduledISO(item);
    const warn = isScheduledInFuture(sched);
    const msg =
      (warn ? `Todavía no pasó la fecha/hora agendada (${fmtDate(sched)}).\n\n` : '') +
      `Al finalizar, le llegará una notificación al prestador para confirmar.`;

    Alert.alert('¿Finalizar servicio?', msg, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sí, finalizar',
        style: 'destructive',
        onPress: async () => {
          try {
            await requesterFinish(item.id);
            Alert.alert('Listo', 'Se envió la solicitud de finalización.');
            fetchDetail();
          } catch (e) {
            console.log('❌ requesterFinish error', e);
            Alert.alert('Error', 'No se pudo solicitar la finalización.');
          }
        },
      },
    ]);
  };

  const onConfirmFinish = async () => {
    if (!item) return;
    try {
      await confirmFinish(item.id);
      Alert.alert('Confirmado', 'La finalización fue confirmada.');
      // ✅ al refrescar, si queda CERRADO y canRateNow=true, el useEffect lo abre solo
      fetchDetail();
    } catch (e) {
      console.log('❌ confirmFinish error', e);
      Alert.alert('Error', 'No se pudo confirmar.');
    }
  };

  const onRejectFinish = async () => {
    if (!item) return;
    try {
      await rejectFinish(item.id, { mensaje: rejectMsg.trim() || undefined });
      Alert.alert('Listo', 'Se indicó que el servicio sigue en curso.');
      fetchDetail();
    } catch (e) {
      console.log('❌ rejectFinish error', e);
      Alert.alert('Error', 'No se pudo rechazar.');
    }
  };

  // ✅ submit desde el bottom sheet
  const onSubmitRating = async (data: { puntaje: number; comentario?: string }) => {
    if (!item) return;
    if (!canRateNow) return;

    try {
      setRatingSending(true);
      await rateReservation(item.id, { puntaje: data.puntaje, comentario: data.comentario });
      setShowRateSheet(false);
      Alert.alert('¡Gracias!', 'Tu calificación fue enviada.');
      fetchDetail();
    } catch (e) {
      console.log('❌ rateReservation error', e);
      Alert.alert('Error', 'No se pudo enviar la calificación.');
    } finally {
      setRatingSending(false);
    }
  };

  return (
    <Screen>
      <TopBar title="Booking details" showBack />

      <ScrollView contentContainerStyle={styles.content}>
        {loading ? (
          <Text style={styles.muted}>Cargando…</Text>
        ) : !item ? (
          <Text style={styles.muted}>No se pudo cargar la reserva.</Text>
        ) : (
          <>
            <Text style={styles.pageTitle}>{`Booking #${item.id}`}</Text>

            {/* Service card */}
            <Card withShadow style={styles.serviceCard}>
              <View style={styles.serviceRow}>
                <View style={styles.serviceIconBox}>
                  <Ionicons name="hammer-outline" size={18} color={COLORS.text} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.serviceTitle}>{title}</Text>
                  {!!item.servicioCategoria && <Text style={styles.serviceSub}>{item.servicioCategoria}</Text>}
                </View>

                {!!item.servicioPrecioBase && <Text style={styles.price}>{moneyUYU(item.servicioPrecioBase)}</Text>}
              </View>

              <View style={styles.metaRow}>
                <View style={styles.metaIcon}>
                  <Ionicons name="calendar-outline" size={16} color={COLORS.textMuted} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.metaLabel}>Scheduled time</Text>
                  <Text style={styles.metaValue}>{fmtDate(getScheduledISO(item)) || 'Sin fecha'}</Text>
                </View>
              </View>
            </Card>

            {/* Profesional / Solicitante section */}
            <Card withShadow style={styles.personCard}>
              <Text style={styles.sectionLikeRef}>{mySide === 'SOLICITANTE' ? 'Profesional' : 'Solicitante'}</Text>

              <View style={styles.personRow}>
                {otherPhotoUrl ? (
                  <Image source={{ uri: otherPhotoUrl }} style={styles.avatar} />
                ) : (
                  <Text style={[styles.avatar, styles.avatarPlaceholder] as any}>
                    <Ionicons name="person" size={18} color="#fff" />
                  </Text>
                )}

                <Text style={{ flex: 1 } as any}>
                  <Text style={styles.personName}>{otherName || '—'}</Text>
                  {'\n'}
                  <Text style={styles.personMeta}>—</Text>
                </Text>

                <TouchableOpacity
                  activeOpacity={0.9}
                  disabled={!whatsappEnabled || !otherPhone}
                  onPress={() =>
                    openWhatsApp(
                      otherPhone!,
                      `Hola! Te escribo por la reserva #${item.id} (${item.servicioTitulo ?? 'servicio'}).`,
                    )
                  }
                  style={[styles.waMini, (!whatsappEnabled || !otherPhone) ? styles.waMiniDisabled : null]}
                >
                  <Ionicons name="logo-whatsapp" size={16} color="#25D366" />
                  <Text style={styles.waMiniText}>WhatsApp</Text>
                </TouchableOpacity>
              </View>

              {!whatsappEnabled ? (
                <Text style={styles.help}>WhatsApp se habilita cuando el servicio esté confirmado.</Text>
              ) : !otherPhone ? (
                <Text style={styles.help}>No hay teléfono registrado para este usuario.</Text>
              ) : null}
            </Card>

            {/* Status stepper */}
            <Card withShadow style={styles.statusCard}>
              <Text style={styles.sectionLikeRef}>Status</Text>

              <Text style={styles.stepRow as any}>
                <Ionicons name={statusStep >= 1 ? 'checkmark-circle' : 'ellipse-outline'} size={18} color={COLORS.text} />{' '}
                <Text style={styles.stepText}>Booking confirmed</Text>
              </Text>

              <Text style={styles.stepRow as any}>
                <Ionicons name={statusStep >= 2 ? 'checkmark-circle' : 'ellipse-outline'} size={18} color={COLORS.text} />{' '}
                <Text style={styles.stepText}>En proceso</Text>
              </Text>

              <Text style={styles.stepRow as any}>
                <Ionicons name={statusStep >= 3 ? 'checkmark-circle' : 'ellipse-outline'} size={18} color={COLORS.text} />{' '}
                <Text style={styles.stepText}>Service completed</Text>
              </Text>
            </Card>

            {/* ✅ Vista de calificaciones (solo cuando ambos calificaron) */}
            {isClosed && !canRateNow && (
              <Card withShadow style={styles.rateCardInfo}>
                <Text style={styles.rateInfoTitle}>Calificación</Text>

                {iAlreadyRated && !otherAlreadyRated ? (
                  <Text style={styles.help}>
                    Ya enviaste tu calificación. Cuando la otra persona también califique, podrán verlas.
                  </Text>
                ) : canSeeRatings ? (
                  <>
                    <Text style={styles.help}>Ambos calificaron ✅</Text>

                    {(item as any).clientePuntaje ? (
                      <Text style={styles.rateResultRow as any}>
                        <Text style={styles.rateResultLabel}>Solicitante</Text>
                        {renderStarsStatic(Number((item as any).clientePuntaje))}
                        {!!(item as any).clienteComentario && (
                          <Text style={styles.rateResultComment}>{String((item as any).clienteComentario)}</Text>
                        )}
                      </Text>
                    ) : null}

                    {(item as any).profesionalPuntaje ? (
                      <Text style={styles.rateResultRow as any}>
                        <Text style={styles.rateResultLabel}>Prestador</Text>
                        {renderStarsStatic(Number((item as any).profesionalPuntaje))}
                        {!!(item as any).profesionalComentario && (
                          <Text style={styles.rateResultComment}>{String((item as any).profesionalComentario)}</Text>
                        )}
                      </Text>
                    ) : null}
                  </>
                ) : (
                  <Text style={styles.help}>Por ahora no hay calificaciones para mostrar.</Text>
                )}
              </Card>
            )}

            {/* Confirmación finalización */}
            {canConfirmFinish && (
              <>
                <SectionTitle>¿Terminaste el trabajo?</SectionTitle>
                <Card style={styles.box}>
                  <Text style={styles.boxTitle}>La otra persona marcó como finalizado</Text>
                  <Text style={styles.help}>¿Confirmás que el servicio ya terminó?</Text>

                  <Button title="✅ Confirmar finalización" onPress={onConfirmFinish} disabled={!canConfirmFinish} />
                  <Text style={{ height: 10 } as any} />

                  <Text style={styles.label}>Si no estás de acuerdo, dejá un mensaje</Text>
                  <TextInput
                    value={rejectMsg}
                    onChangeText={setRejectMsg}
                    placeholder="Ej: todavía falta terminar"
                    placeholderTextColor="#9ca3af"
                    style={[styles.input, { minHeight: 70 }]}
                    multiline
                  />
                  <Button title="❌ No, sigue en curso" onPress={onRejectFinish} disabled={!canRejectFinish} />
                </Card>
              </>
            )}

            {/* Acciones Prestador */}
            {showProviderActions && (
              <>
                <SectionTitle>Acciones (Prestador)</SectionTitle>

                {(item.estado === 'PENDIENTE' || item.estado === 'EN_NEGOCIACION') && (
                  <Card style={styles.box}>
                    <Text style={styles.boxTitle}>Aceptar</Text>
                    <Button title="Aceptar solicitud" onPress={onProviderAccept} disabled={!canProviderAccept} />
                  </Card>
                )}

                {(item.estado === 'PENDIENTE' || item.estado === 'EN_NEGOCIACION') && (
                  <Card style={styles.box}>
                    <Text style={styles.boxTitle}>Negociar</Text>

                    <Text style={styles.twoCols as any}>
                      <Text style={{ flex: 1 } as any}>
                        <Text style={styles.label}>Fecha</Text>
                        {'\n'}
                        <TextInput
                          value={proposeDate}
                          onChangeText={setProposeDate}
                          placeholder="YYYY-MM-DD (ej: 2025-12-20)"
                          placeholderTextColor="#9ca3af"
                          style={styles.input}
                        />
                      </Text>

                      <Text style={{ width: 12 } as any} />

                      <Text style={{ flex: 1 } as any}>
                        <Text style={styles.label}>Hora</Text>
                        {'\n'}
                        <TextInput
                          value={proposeTime}
                          onChangeText={setProposeTime}
                          placeholder="HH:mm (ej: 14:30)"
                          placeholderTextColor="#9ca3af"
                          style={styles.input}
                        />
                      </Text>
                    </Text>

                    {!!proposalIsoPreview && (
                      <Text style={styles.preview}>
                        Se enviará: <Text style={styles.previewStrong}>{proposalIsoPreview}</Text>
                      </Text>
                    )}

                    <Text style={styles.label}>Mensaje (opcional)</Text>
                    <TextInput
                      value={proposeMsg}
                      onChangeText={setProposeMsg}
                      placeholder="Ej: ¿Te sirve el sábado a las 14:30?"
                      placeholderTextColor="#9ca3af"
                      style={[styles.input, { minHeight: 80 }]}
                      multiline
                    />

                    <Button title="Enviar propuesta" onPress={onProviderPropose} disabled={!canProviderAccept} />
                  </Card>
                )}

                {(item.estado === 'PENDIENTE' || item.estado === 'EN_NEGOCIACION') && (
                  <Card style={styles.box}>
                    <Text style={styles.boxTitle}>Cancelar</Text>
                    <TextInput
                      value={cancelReason}
                      onChangeText={setCancelReason}
                      placeholder="Motivo (opcional)"
                      placeholderTextColor="#9ca3af"
                      style={[styles.input, { minHeight: 70 }]}
                      multiline
                    />
                    <Button title="Cancelar reserva" onPress={onProviderCancel} disabled={!canProviderAccept} />
                  </Card>
                )}

                {item.estado === 'EN_PROCESO' && (
                  <Card style={styles.box}>
                    <Text style={styles.boxTitle}>Finalizar</Text>
                    <Button title="Marcar como finalizado" onPress={onProviderFinish} disabled={!canProviderFinish} />
                  </Card>
                )}
              </>
            )}

            {/* Acciones Solicitante (negociación) */}
            {showRequesterActions && (
              <>
                <SectionTitle>Acciones (Solicitante)</SectionTitle>

                <Card style={styles.box}>
                  <Text style={styles.boxTitle}>Propuesta del prestador</Text>
                  <Text style={styles.meta}>
                    {item.fechaHoraPropuesta ? fmtDate(item.fechaHoraPropuesta) : 'Sin fecha propuesta'}
                  </Text>

                  {!!item.mensajePropuesta && <Text style={styles.paragraph}>{item.mensajePropuesta}</Text>}

                  <Button title="Aceptar propuesta" onPress={onRequesterAcceptProposal} disabled={!canRequesterAccept} />
                  <Text style={{ height: 10 } as any} />

                  <Text style={styles.label}>Si querés, dejá un mensaje al rechazar</Text>
                  <TextInput
                    value={rejectMsg}
                    onChangeText={setRejectMsg}
                    placeholder="Ej: ese horario no puedo, ¿podés de tarde?"
                    placeholderTextColor="#9ca3af"
                    style={[styles.input, { minHeight: 70 }]}
                    multiline
                  />

                  <Button title="Rechazar propuesta" onPress={onRequesterRejectProposal} disabled={!canRequesterAccept} />
                </Card>
              </>
            )}

            {/* Solicitante puede finalizar en EN_PROCESO */}
            {canRequesterFinish && (
              <>
                <SectionTitle>Servicio</SectionTitle>
                <Card style={styles.box}>
                  <Text style={styles.boxTitle}>Finalizar</Text>
                  <Button title="Solicitar finalización" onPress={onRequesterFinish} disabled={!canRequesterFinish} />
                  <Text style={styles.help}>
                    Al finalizar, le llegará una notificación al otro usuario para confirmar.
                  </Text>
                </Card>
              </>
            )}
          </>
        )}
      </ScrollView>

      {/* ✅ Bottom sheet: aparece automáticamente al quedar CERRADO */}
      <RateReservationSheet
        visible={showRateSheet}
        loading={ratingSending}
        titleTop={ratingTitle}
        title={ratingQuestion}
        placeholder={ratingPlaceholder}
        onClose={() => setShowRateSheet(false)}
        onSubmit={onSubmitRating}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: SPACING.lg, paddingBottom: SPACING.xl },
  muted: { color: COLORS.textMuted },

  pageTitle: { fontSize: 18, fontWeight: '900', color: COLORS.text, marginBottom: 10 },

  serviceCard: { marginBottom: SPACING.md },
  serviceRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  serviceIconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#eef2ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceTitle: { fontSize: 14, fontWeight: '900', color: COLORS.text },
  serviceSub: { marginTop: 2, fontSize: 12, color: COLORS.textMuted },
  price: { fontSize: 14, fontWeight: '900', color: COLORS.text },

  metaRow: { flexDirection: 'row', gap: 10, marginTop: 14, alignItems: 'center' },
  metaIcon: {
    width: 28,
    height: 28,
    borderRadius: 10,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  metaLabel: { fontSize: 11, color: COLORS.textMuted, fontWeight: '800' },
  metaValue: { marginTop: 2, fontSize: 12, color: COLORS.text, fontWeight: '800' },

  personCard: { marginBottom: SPACING.md },
  sectionLikeRef: { fontSize: 13, fontWeight: '900', color: COLORS.text, marginBottom: 10 },
  personRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 42, height: 42, borderRadius: 21 },
  avatarPlaceholder: { backgroundColor: '#9ca3af', alignItems: 'center', justifyContent: 'center' },
  personName: { fontSize: 13, fontWeight: '900', color: COLORS.text },
  personMeta: { marginTop: 2, fontSize: 11, color: COLORS.textMuted },

  waMini: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#eafff2',
    borderWidth: 1,
    borderColor: '#b7f7cf',
  },
  waMiniDisabled: { opacity: 0.5 },
  waMiniText: { fontSize: 12, fontWeight: '900', color: '#16a34a' },

  statusCard: { marginBottom: SPACING.md },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 },
  stepText: { fontSize: 12, fontWeight: '800', color: COLORS.text },

  // rating view
  rateCardInfo: { marginBottom: SPACING.md },
  rateInfoTitle: { fontSize: 13, fontWeight: '900', color: COLORS.text, marginBottom: 8 },
  rateResultRow: { borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: 10 },
  rateResultLabel: { fontSize: 12, fontWeight: '900', color: COLORS.text, marginBottom: 6 },
  starsRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 6, marginBottom: 10 },
  rateResultComment: { marginTop: 6, fontSize: 12, color: COLORS.textMuted, lineHeight: 16 },

  help: { marginTop: 8, fontSize: 11, color: COLORS.textMuted },
  paragraph: { marginTop: 10, color: COLORS.text, fontSize: 13, lineHeight: 18 },
  meta: { marginTop: 6, color: COLORS.textMuted, fontSize: 12 },

  preview: { marginTop: 4, marginBottom: 8, fontSize: 12, color: COLORS.textMuted },
  previewStrong: { fontWeight: '900', color: COLORS.text },

  box: { marginBottom: SPACING.md, borderWidth: 1, borderColor: COLORS.border },
  boxTitle: { fontSize: 13, fontWeight: '900', marginBottom: 10, color: COLORS.text },
  label: { fontSize: 12, fontWeight: '700', color: COLORS.textMuted, marginBottom: 6, marginTop: 6 },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADII.lg,
    padding: 10,
    backgroundColor: '#fff',
    color: COLORS.text,
    fontSize: 14,
  },
  twoCols: { flexDirection: 'row', marginBottom: 10 },
});
