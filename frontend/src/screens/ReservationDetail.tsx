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
  Platform,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

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
  rateReservation,
} from '../services/reservations.client';

type Props = { navigation: any; route: any };
type Side = 'SOLICITANTE' | 'PRESTADOR' | 'UNKNOWN';

// ✅ Visitas
type VisitStatus = 'REALIZADA' | 'CANCELADA' | 'REPROGRAMADA';
type Visit = {
  id: string;
  dateIso: string; // ISO
  status: VisitStatus;
  notes?: string;
  durationMin?: number;
};

const USER_ID_KEY = '@userId';
const VISITS_KEY = (reservationId: number) => `@reservation_visits_${reservationId}`;

function safeJsonParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function fmtDate(isoOrText?: string | null) {
  if (!isoOrText) return '';
  const d = new Date(isoOrText);
  if (Number.isNaN(d.getTime())) return isoOrText;
  return new Intl.DateTimeFormat('es-UY', { dateStyle: 'medium', timeStyle: 'short' }).format(d);
}
function fmtDateOnly(d?: Date | null) {
  if (!d) return 'Elegir...';
  try {
    return new Intl.DateTimeFormat('es-UY', { dateStyle: 'medium' }).format(d);
  } catch {
    return d.toDateString();
  }
}
function fmtTimeOnly(d?: Date | null) {
  if (!d) return 'Elegir...';
  try {
    return new Intl.DateTimeFormat('es-UY', { timeStyle: 'short' }).format(d);
  } catch {
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    return `${hh}:${mm}`;
  }
}
function fmtDuration(min?: number) {
  if (!min || !Number.isFinite(min) || min <= 0) return '';
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
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

  const [proposeMsg, setProposeMsg] = useState('');
  const [cancelReason, setCancelReason] = useState('');
  const [rejectMsg, setRejectMsg] = useState('');

  // ✅ NEGOCIACIÓN amigable (picker)
  const [proposeDateTime, setProposeDateTime] = useState<Date | null>(null);
  const [showProposeDatePicker, setShowProposeDatePicker] = useState(false);
  const [showProposeTimePicker, setShowProposeTimePicker] = useState(false);

  // ✅ bottom sheet rating
  const [showRateSheet, setShowRateSheet] = useState<boolean>(false);
  const [ratingSending, setRatingSending] = useState<boolean>(false);
  const didAutoOpenForThisClose = useRef<string | null>(null);

  // ✅ visitas (persistidas localmente por reserva)
  const [visits, setVisits] = useState<Visit[]>([]);
  const [visitDateTime, setVisitDateTime] = useState<Date | null>(null);
  const [showVisitDatePicker, setShowVisitDatePicker] = useState(false);
  const [showVisitTimePicker, setShowVisitTimePicker] = useState(false);
  const [visitDurationMin, setVisitDurationMin] = useState<string>('');
  const [visitNotes, setVisitNotes] = useState('');
  const [visitStatus, setVisitStatus] = useState<VisitStatus>('REALIZADA');

  // ✅ cuando está CERRADO, oculto el form por defecto y lo habilito si el usuario toca el link
  const [allowVisitsAfterClose, setAllowVisitsAfterClose] = useState(false);

  const loadLocalVisits = useCallback(async () => {
    if (!Number.isFinite(reservationId)) return;
    try {
      const rawVisits = await AsyncStorage.getItem(VISITS_KEY(reservationId));
      const parsedVisits = safeJsonParse<Visit[]>(rawVisits, []);
      setVisits(Array.isArray(parsedVisits) ? parsedVisits : []);
    } catch (e) {
      console.log('❌ loadLocalVisits error', e);
    }
  }, [reservationId]);

  const fetchDetail = useCallback(async () => {
    try {
      setLoading(true);

      const uid = (await AsyncStorage.getItem(USER_ID_KEY)) ?? '';
      setMyUserId(uid);

      if (!Number.isFinite(reservationId)) {
        setItem(null);
        return;
      }

      const r = await getReservationById(reservationId);
      setItem(r);

      // ✅ precarga propuesta si existe
      if (r?.fechaHoraPropuesta) {
        const dt = new Date(r.fechaHoraPropuesta);
        if (!Number.isNaN(dt.getTime())) {
          setProposeDateTime(dt);
        }
      } else {
        setProposeDateTime(null);
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
      loadLocalVisits();
    }, [fetchDetail, loadLocalVisits]),
  );

  useEffect(() => {
    loadLocalVisits();
  }, [loadLocalVisits]);

  // ✅ si cambia a NO CERRADO, vuelvo a ocultar el “override”
  useEffect(() => {
    if (!item) return;
    if (item.estado !== 'CERRADO') setAllowVisitsAfterClose(false);
  }, [item?.estado, item]);

  const mySide: Side = useMemo(() => {
    if (!item || !myUserId) return 'UNKNOWN';
    if (String(item.clienteId) === String(myUserId)) return 'SOLICITANTE';
    if (String(item.profesionalId) === String(myUserId)) return 'PRESTADOR';
    return 'UNKNOWN';
  }, [item, myUserId]);

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
      return `${item.clienteNombre ?? ''} ${item.clienteApellido ?? ''}`.trim() || String(item.clienteId);
    }
    if (mySide === 'SOLICITANTE') {
      return `${item.profesionalNombre ?? ''} ${item.profesionalApellido ?? ''}`.trim() || String(item.profesionalId);
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

  const canConfirmFinish =
    !!item && item.estado === 'FINALIZADO' && !!myActionKey && item.accionRequeridaPor === myActionKey;
  const canRejectFinish = canConfirmFinish;

  const statusStep = useMemo(() => {
    if (!item) return 0;
    if (item.estado === 'PENDIENTE' || item.estado === 'EN_NEGOCIACION') return 1;
    if (item.estado === 'EN_PROCESO') return 2;
    if (item.estado === 'FINALIZADO' || item.estado === 'CERRADO') return 3;
    return 1;
  }, [item]);

  // ✅ Rating
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
    return `¿Cómo fue tu experiencia con\n${name}?`;
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

  useEffect(() => {
    if (!item) return;

    if (item.estado !== 'CERRADO') {
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

  // ✅ Visitas: reglas
  const canLogVisitsByState = useMemo(() => {
    if (!item) return false;
    return ['EN_PROCESO', 'FINALIZADO', 'CERRADO'].includes(item.estado);
  }, [item]);

  const canShowVisitAddForm = useMemo(() => {
    if (!item) return false;
    // ✅ cuando ya está cerrado, NO se muestra a menos que el usuario lo habilite
    if (item.estado === 'CERRADO') return allowVisitsAfterClose;
    // si no está cerrado, se muestra normal en estados permitidos
    return canLogVisitsByState;
  }, [item, allowVisitsAfterClose, canLogVisitsByState]);

  const addVisit = async () => {
    if (!visitDateTime) {
      Alert.alert('Falta fecha/hora', 'Elegí una fecha y una hora para la visita.');
      return;
    }

    const dur = Number(visitDurationMin);
    const durationMin = Number.isFinite(dur) && dur > 0 ? Math.floor(dur) : undefined;

    const newVisit: Visit = {
      id: `visit_${Date.now()}`,
      dateIso: visitDateTime.toISOString(),
      status: visitStatus,
      notes: visitNotes.trim() || undefined,
      durationMin,
    };

    const next = [...visits, newVisit].sort((a, b) => a.dateIso.localeCompare(b.dateIso));
    setVisits(next);

    setVisitDateTime(null);
    setVisitDurationMin('');
    setVisitNotes('');
    setVisitStatus('REALIZADA');

    try {
      await AsyncStorage.setItem(VISITS_KEY(reservationId), JSON.stringify(next));
    } catch {}
  };

  const updateVisitStatus = async (visitId: string, status: VisitStatus) => {
    const next = visits.map((v) => (v.id === visitId ? { ...v, status } : v));
    setVisits(next);
    try {
      await AsyncStorage.setItem(VISITS_KEY(reservationId), JSON.stringify(next));
    } catch {}
  };

  const removeVisit = (visitId: string) => {
    Alert.alert('Eliminar visita', '¿Querés eliminar esta visita?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          const next = visits.filter((v) => v.id !== visitId);
          setVisits(next);
          try {
            await AsyncStorage.setItem(VISITS_KEY(reservationId), JSON.stringify(next));
          } catch {}
        },
      },
    ]);
  };

  // --- Actions ---
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

    if (!proposeDateTime) {
      Alert.alert('Falta fecha/hora', 'Elegí una fecha y una hora para proponer.');
      return;
    }

    try {
      await proProposeReservation(item.id, {
        fechaHoraPropuesta: proposeDateTime.toISOString(),
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
      <TopBar title="Detalles de la reserva" showBack />

      <ScrollView contentContainerStyle={styles.content}>
        {loading ? (
          <Text style={styles.muted}>Cargando…</Text>
        ) : !item ? (
          <Text style={styles.muted}>No se pudo cargar la reserva.</Text>
        ) : (
          <>
            <Text style={styles.pageTitle}>{`Reserva #${item.id}`}</Text>

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
                  <Text style={styles.metaLabel}>Fecha/hora agendada</Text>
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
                  <View style={[styles.avatar, styles.avatarPlaceholder]}>
                    <Ionicons name="person" size={18} color="#fff" />
                  </View>
                )}

                <View style={{ flex: 1 }}>
                  <Text style={styles.personName}>{otherName || '—'}</Text>
                  <Text style={styles.personMeta}> </Text>
                </View>

                <TouchableOpacity
                  activeOpacity={0.9}
                  disabled={!whatsappEnabled || !otherPhone}
                  onPress={() =>
                    openWhatsApp(
                      otherPhone!,
                      `Hola! Te escribo por la reserva #${item.id} (${item.servicioTitulo ?? 'servicio'}).`,
                    )
                  }
                  style={[styles.waMini, !whatsappEnabled || !otherPhone ? styles.waMiniDisabled : null]}
                >
                  <Ionicons name="logo-whatsapp" size={16} color="#25D366" />
                  <Text style={styles.waMiniText}>WhatsApp</Text>
                </TouchableOpacity>
              </View>

              {!whatsappEnabled ? (
                <Text style={styles.help}>WhatsApp se habilita cuando el servicio esté en proceso.</Text>
              ) : !otherPhone ? (
                <Text style={styles.help}>No hay teléfono registrado para este usuario.</Text>
              ) : null}
            </Card>

            {/* Status stepper */}
            <Card withShadow style={styles.statusCard}>
              <Text style={styles.sectionLikeRef}>Estado</Text>

              <View style={styles.stepRow}>
                <Ionicons name={statusStep >= 1 ? 'checkmark-circle' : 'ellipse-outline'} size={18} color={COLORS.text} />
                <Text style={styles.stepText}>Solicitud enviada</Text>
              </View>

              <View style={styles.stepRow}>
                <Ionicons name={statusStep >= 2 ? 'checkmark-circle' : 'ellipse-outline'} size={18} color={COLORS.text} />
                <Text style={styles.stepText}>En proceso</Text>
              </View>

              <View style={styles.stepRow}>
                <Ionicons name={statusStep >= 3 ? 'checkmark-circle' : 'ellipse-outline'} size={18} color={COLORS.text} />
                <Text style={styles.stepText}>Servicio completado</Text>
              </View>
            </Card>

            {/* ✅ Calificar */}
            {isClosed && canRateNow && (
              <Card withShadow style={styles.rateCardInfo}>
                <Text style={styles.rateInfoTitle}>Calificación</Text>
                <Text style={styles.help}>Tu servicio ya está cerrado. Dejá tu calificación para ayudar a mejorar la comunidad.</Text>
                <View style={{ height: 10 }} />
                <Button title="⭐ Calificar ahora" onPress={() => setShowRateSheet(true)} />
              </Card>
            )}

            {/* ✅ Visitas */}
            <SectionTitle>Visitas</SectionTitle>

            {!canLogVisitsByState ? (
              <Card style={styles.box}>
                <Text style={styles.help}>Las visitas se registran cuando el servicio está en proceso o finalizado.</Text>
              </Card>
            ) : (
              <>
                <Card style={styles.box}>
                  <Text style={styles.boxTitle}>Historial de visitas</Text>

                  {visits.length === 0 ? (
                    <Text style={styles.help}>Todavía no hay visitas registradas.</Text>
                  ) : (
                    visits.map((v) => (
                      <View key={v.id} style={styles.visitRow}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.visitDate}>{fmtDate(v.dateIso)}</Text>
                          <Text style={styles.visitMeta}>Estado: {v.status}</Text>
                          {!!v.durationMin && <Text style={styles.visitMeta}>Duración: {fmtDuration(v.durationMin)}</Text>}
                          {!!v.notes && <Text style={styles.visitNotes}>{v.notes}</Text>}

                          <View style={styles.visitActionsRow}>
                            {(['REALIZADA', 'REPROGRAMADA', 'CANCELADA'] as VisitStatus[]).map((st) => {
                              const active = v.status === st;
                              return (
                                <TouchableOpacity
                                  key={st}
                                  activeOpacity={0.85}
                                  onPress={() => updateVisitStatus(v.id, st)}
                                  style={[styles.pill, active ? styles.pillActive : styles.pillInactive]}
                                >
                                  <Text style={[styles.pillText, active ? styles.pillTextActive : styles.pillTextInactive]}>
                                    {st}
                                  </Text>
                                </TouchableOpacity>
                              );
                            })}
                          </View>
                        </View>

                        <TouchableOpacity onPress={() => removeVisit(v.id)} style={styles.trashBtn}>
                          <Ionicons name="trash-outline" size={18} color="#ef4444" />
                        </TouchableOpacity>
                      </View>
                    ))
                  )}
                </Card>

                {/* ✅ Form: se oculta por defecto cuando está CERRADO */}
                {canShowVisitAddForm ? (
                  <Card style={styles.box}>
                    <Text style={styles.boxTitle}>Registrar nueva visita</Text>

                    <Text style={styles.label}>Fecha y hora</Text>
                    <View style={styles.twoCols}>
                      <View style={{ flex: 1 }}>
                        <TouchableOpacity activeOpacity={0.9} onPress={() => setShowVisitDatePicker(true)} style={styles.pickerBtn}>
                          <Ionicons name="calendar-outline" size={18} color={COLORS.textMuted} />
                          <Text style={styles.pickerBtnText}>{fmtDateOnly(visitDateTime)}</Text>
                        </TouchableOpacity>
                      </View>

                      <View style={{ width: 12 }} />

                      <View style={{ flex: 1 }}>
                        <TouchableOpacity activeOpacity={0.9} onPress={() => setShowVisitTimePicker(true)} style={styles.pickerBtn}>
                          <Ionicons name="time-outline" size={18} color={COLORS.textMuted} />
                          <Text style={styles.pickerBtnText}>{fmtTimeOnly(visitDateTime)}</Text>
                        </TouchableOpacity>
                      </View>
                    </View>

                    <Text style={styles.label}>Duración (minutos)</Text>
                    <TextInput
                      value={visitDurationMin}
                      onChangeText={(t) => setVisitDurationMin(t.replace(/[^\d]/g, ''))}
                      placeholder="Ej: 90"
                      keyboardType="numeric"
                      placeholderTextColor="#9ca3af"
                      style={styles.input}
                    />

                    <Text style={styles.label}>Estado</Text>
                    <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                      {(['REALIZADA', 'REPROGRAMADA', 'CANCELADA'] as VisitStatus[]).map((st) => {
                        const active = visitStatus === st;
                        return (
                          <TouchableOpacity
                            key={st}
                            activeOpacity={0.85}
                            onPress={() => setVisitStatus(st)}
                            style={[styles.pill, active ? styles.pillActive : styles.pillInactive]}
                          >
                            <Text style={[styles.pillText, active ? styles.pillTextActive : styles.pillTextInactive]}>
                              {st}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>

                    <Text style={styles.label}>Notas (opcional)</Text>
                    <TextInput
                      value={visitNotes}
                      onChangeText={setVisitNotes}
                      placeholder="Ej: Se revisó la instalación..."
                      placeholderTextColor="#9ca3af"
                      style={[styles.input, { minHeight: 70 }]}
                      multiline
                    />

                    <Button title="Agregar visita" onPress={addVisit} />

                    {showVisitDatePicker && (
                      <DateTimePicker
                        value={visitDateTime ?? new Date()}
                        mode="date"
                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                        onChange={(e, selected) => {
                          setShowVisitDatePicker(false);
                          if (!selected) return;

                          const base = visitDateTime ?? new Date();
                          const next = new Date(selected);
                          next.setHours(base.getHours(), base.getMinutes(), 0, 0);
                          setVisitDateTime(next);
                        }}
                      />
                    )}

                    {showVisitTimePicker && (
                      <DateTimePicker
                        value={visitDateTime ?? new Date()}
                        mode="time"
                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                        onChange={(e, selected) => {
                          setShowVisitTimePicker(false);
                          if (!selected) return;

                          const base = visitDateTime ?? new Date();
                          const next = new Date(base);
                          next.setHours(selected.getHours(), selected.getMinutes(), 0, 0);
                          setVisitDateTime(next);
                        }}
                      />
                    )}
                  </Card>
                ) : null}
              </>
            )}

            {/* ✅ Vista de calificaciones (cuando corresponde) */}
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
                      <View style={styles.rateResultRow}>
                        <Text style={styles.rateResultLabel}>Solicitante</Text>
                        {renderStarsStatic(Number((item as any).clientePuntaje))}
                        {!!(item as any).clienteComentario && (
                          <Text style={styles.rateResultComment}>{String((item as any).clienteComentario)}</Text>
                        )}
                      </View>
                    ) : null}

                    {(item as any).profesionalPuntaje ? (
                      <View style={styles.rateResultRow}>
                        <Text style={styles.rateResultLabel}>Prestador</Text>
                        {renderStarsStatic(Number((item as any).profesionalPuntaje))}
                        {!!(item as any).profesionalComentario && (
                          <Text style={styles.rateResultComment}>{String((item as any).profesionalComentario)}</Text>
                        )}
                      </View>
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
                  <View style={{ height: 10 }} />

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

                    <Text style={styles.label}>Fecha y hora propuesta</Text>
                    <View style={styles.twoCols}>
                      <View style={{ flex: 1 }}>
                        <TouchableOpacity activeOpacity={0.9} onPress={() => setShowProposeDatePicker(true)} style={styles.pickerBtn}>
                          <Ionicons name="calendar-outline" size={18} color={COLORS.textMuted} />
                          <Text style={styles.pickerBtnText}>{fmtDateOnly(proposeDateTime)}</Text>
                        </TouchableOpacity>
                      </View>

                      <View style={{ width: 12 }} />

                      <View style={{ flex: 1 }}>
                        <TouchableOpacity activeOpacity={0.9} onPress={() => setShowProposeTimePicker(true)} style={styles.pickerBtn}>
                          <Ionicons name="time-outline" size={18} color={COLORS.textMuted} />
                          <Text style={styles.pickerBtnText}>{fmtTimeOnly(proposeDateTime)}</Text>
                        </TouchableOpacity>
                      </View>
                    </View>

                    {!!proposeDateTime && (
                      <Text style={styles.preview}>
                        Se enviará: <Text style={styles.previewStrong}>{fmtDate(proposeDateTime.toISOString())}</Text>
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

                    {showProposeDatePicker && (
                      <DateTimePicker
                        value={proposeDateTime ?? new Date()}
                        mode="date"
                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                        onChange={(e, selected) => {
                          setShowProposeDatePicker(false);
                          if (!selected) return;

                          const base = proposeDateTime ?? new Date();
                          const next = new Date(selected);
                          next.setHours(base.getHours(), base.getMinutes(), 0, 0);
                          setProposeDateTime(next);
                        }}
                      />
                    )}

                    {showProposeTimePicker && (
                      <DateTimePicker
                        value={proposeDateTime ?? new Date()}
                        mode="time"
                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                        onChange={(e, selected) => {
                          setShowProposeTimePicker(false);
                          if (!selected) return;

                          const base = proposeDateTime ?? new Date();
                          const next = new Date(base);
                          next.setHours(selected.getHours(), selected.getMinutes(), 0, 0);
                          setProposeDateTime(next);
                        }}
                      />
                    )}
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
                  <View style={{ height: 10 }} />

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
                  <Text style={styles.help}>Al finalizar, le llegará una notificación al otro usuario para confirmar.</Text>
                </Card>
              </>
            )}

            {/* ✅ Link al final: habilitar visitas si estaba cerrado */}
            {isClosed && !allowVisitsAfterClose && (
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => setAllowVisitsAfterClose(true)}
                style={styles.forgotVisitsLink}
              >
                <Ionicons name="add-circle-outline" size={18} color={COLORS.textMuted} />
                <Text style={styles.forgotVisitsText}>¿Olvidaste agregar alguna visita?</Text>
              </TouchableOpacity>
            )}
          </>
        )}
      </ScrollView>

      {/* ✅ Bottom sheet rating */}
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

  // visits
  visitRow: { flexDirection: 'row', gap: 10, paddingVertical: 10, borderTopWidth: 1, borderTopColor: COLORS.border },
  visitDate: { fontSize: 13, fontWeight: '900', color: COLORS.text },
  visitMeta: { marginTop: 2, fontSize: 12, color: COLORS.textMuted, fontWeight: '700' },
  visitNotes: { marginTop: 6, fontSize: 12, color: COLORS.text, lineHeight: 16 },
  visitActionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  trashBtn: { padding: 8, borderRadius: 12, backgroundColor: '#fee2e2', alignSelf: 'flex-start' },

  pill: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, borderWidth: 1 },
  pillActive: { backgroundColor: '#ecfeff', borderColor: '#bae6fd' },
  pillInactive: { backgroundColor: '#f3f4f6', borderColor: '#e5e7eb' },
  pillText: { fontSize: 11, fontWeight: '900' },
  pillTextActive: { color: '#0369a1' },
  pillTextInactive: { color: '#374151' },

  // date/time picker button
  pickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADII.lg,
    padding: 12,
    backgroundColor: '#fff',
  },
  pickerBtnText: { fontSize: 14, fontWeight: '800', color: COLORS.text },

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

  forgotVisitsLink: {
    marginTop: 12,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
  },
  forgotVisitsText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.textMuted,
    textDecorationLine: 'underline',
  },
});
