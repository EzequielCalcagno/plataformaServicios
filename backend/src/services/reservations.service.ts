// src/services/reservations.service.ts
import {
  ClientAcceptProposalSchema,
  ClientRejectProposalSchema,
  CreateReservationSchema,
  ProCancelSchema,
  ProFinishSchema,
  ProProposeSchema,
  ReservationDtoSchema,
  ReservationStatus,
  RequesterFinishSchema,
  ConfirmFinishSchema,
  RejectFinishSchema,
  RateReservationSchema,
} from '../schemas/reservation.schema';

import {
  createReservationRepository,
  getReservationByIdRepository,
  getServicioByIdRepository,
  listReservationsForClienteRepository,
  listReservationsForProfesionalRepository,
  updateReservationByIdRepository,
  getReservationByIdWithJoinsRepository,
  listProfessionalReviewsRepository, type ReviewSort,
} from '../repositories/reservations.repository';

/**
 * Normaliza filas del repo (con joins) a DTO amigable FE
 *
 * ✅ Soporta “visibilidad de calificaciones”:
 * - si NO calificaron ambos => cada uno ve solo SU calificación (si la hizo)
 * - si calificaron ambos => ven ambas
 */
function toReservationDto(row: any, viewerUserId?: string) {
  const servicio = row.servicio ?? row.servicios ?? null;


  const clienteCalifico = row.cliente_califico ?? false;
  const profesionalCalifico = row.profesional_califico ?? false;
  const canSeeRatings = !!clienteCalifico && !!profesionalCalifico;

  const viewerIsCliente =
    !!viewerUserId && String(row.cliente_id) === String(viewerUserId);
  const viewerIsPro =
    !!viewerUserId && String(row.profesional_id) === String(viewerUserId);

  const dto = {
    id: Number(row.id),

    servicioId: Number(row.servicio_id),
    servicioTitulo: servicio?.titulo ?? null,
    servicioCategoria: servicio?.categoria ?? null,

    profesionalId: String(row.profesional_id),
    profesionalNombre: row.profesional?.nombre ?? null,
    profesionalApellido: row.profesional?.apellido ?? null,
    profesionalFotoUrl: row.profesional?.foto_url ?? null,
    profesionalTelefono: row.profesional?.telefono ?? null,

    clienteId: String(row.cliente_id),
    clienteNombre: row.cliente?.nombre ?? null,
    clienteApellido: row.cliente?.apellido ?? null,
    clienteFotoUrl: row.cliente?.foto_url ?? null,
    clienteTelefono: row.cliente?.telefono ?? null,

    estado: row.estado as ReservationStatus,

    descripcionCliente: row.descripcion_cliente ?? null,
    fechaHoraSolicitada: row.fecha_hora_solicitada ?? null,

    fechaHoraPropuesta: row.fecha_hora_propuesta ?? null,
    mensajePropuesta: row.mensaje_propuesta ?? null,

    accionRequeridaPor: row.accion_requerida_por ?? null,

    canceladoPor: row.cancelado_por ?? null,
    motivoCancelacion: row.motivo_cancelacion ?? null,

    // flags FE
    clienteCalifico,
    profesionalCalifico,

    // ✅ ratings (visibilidad controlada)
    clientePuntaje:
      canSeeRatings
        ? row.cliente_puntaje ?? null
        : viewerIsCliente
        ? row.cliente_puntaje ?? null
        : null,
    clienteComentario:
      canSeeRatings
        ? row.cliente_comentario ?? null
        : viewerIsCliente
        ? row.cliente_comentario ?? null
        : null,

    profesionalPuntaje:
      canSeeRatings
        ? row.profesional_puntaje ?? null
        : viewerIsPro
        ? row.profesional_puntaje ?? null
        : null,
    profesionalComentario:
      canSeeRatings
        ? row.profesional_comentario ?? null
        : viewerIsPro
        ? row.profesional_comentario ?? null
        : null,

    canSeeRatings,

    creadoEn: row.creado_en ? new Date(row.creado_en).toISOString() : null,
    actualizadoEn: row.actualizado_en ? new Date(row.actualizado_en).toISOString() : null,

    // ✅ FIX: usar la variable `servicio` (no row.servicio)
    servicioPrecioBase: servicio?.precio_base ?? null,
  };

  return ReservationDtoSchema.parse(dto);
}

/**
 * ✅ DETALLE con permisos
 */
export async function getReservationByIdForUserService(userId: string, reservationId: number) {
  const row = await getReservationByIdWithJoinsRepository(reservationId);
  if (!row) return null;

  if (
    String(row.cliente_id) !== String(userId) &&
    String(row.profesional_id) !== String(userId)
  ) {
    throw new Error('No autorizado');
  }

  return toReservationDto(row, userId);
}

/**
 * Crear reserva:
 * requester = cliente_id (independiente del rol)
 */
export async function createReservationService(clienteId: string, payload: unknown) {
  const parsed = CreateReservationSchema.parse(payload);

  const servicio = await getServicioByIdRepository(parsed.servicioId);
  if (!servicio) throw new Error('Servicio no existe');
  if (servicio.activo === false) throw new Error('Servicio inactivo');

  const profesionalId = String(servicio.profesional_id);
  if (!profesionalId) throw new Error('Servicio sin profesional');

  const created = await createReservationRepository({
    servicio_id: parsed.servicioId,
    profesional_id: profesionalId,
    cliente_id: clienteId,
    estado: 'PENDIENTE',
    descripcion_cliente: parsed.descripcionCliente ?? null,
    fecha_hora_solicitada: parsed.fechaHoraSolicitada ?? null,
    accion_requerida_por: 'PROFESIONAL',
  });

  const row = await getReservationByIdWithJoinsRepository(Number(created.id));
  return toReservationDto(row ?? created, clienteId);
}

/**
 * Tabs requester (cliente)
 */
export async function listMyReservationsAsClienteService(clienteId: string, tab: string) {
  const estados: ReservationStatus[] =
    tab === 'waiting'
      ? ['PENDIENTE', 'EN_NEGOCIACION']
      : tab === 'active'
      ? ['EN_PROCESO']
      : tab === 'done'
      ? ['FINALIZADO', 'CERRADO']
      : ['PENDIENTE', 'EN_NEGOCIACION'];

  const rows = await listReservationsForClienteRepository(clienteId, estados);
  return rows.map((r) => toReservationDto(r, clienteId));
}

/**
 * Tabs profesional (recibidas)
 */
export async function listMyReservationsAsProfesionalService(profesionalId: string, tab: string) {
  const estados: ReservationStatus[] =
    tab === 'pending'
      ? ['PENDIENTE', 'EN_NEGOCIACION']
      : tab === 'active'
      ? ['EN_PROCESO']
      : tab === 'done'
      ? ['FINALIZADO', 'CERRADO']
      : ['PENDIENTE', 'EN_NEGOCIACION'];

  const rows = await listReservationsForProfesionalRepository(profesionalId, estados);
  return rows.map((r) => toReservationDto(r, profesionalId));
}

/**
 * PROFESIONAL acepta
 */
export async function profesionalAcceptReservationService(profesionalId: string, reservationId: number) {
  const reservation = await getReservationByIdRepository(reservationId);
  if (!reservation) throw new Error('Reserva no encontrada');
  if (String(reservation.profesional_id) !== String(profesionalId)) throw new Error('No autorizado');

  if (!['PENDIENTE', 'EN_NEGOCIACION'].includes(reservation.estado)) {
    throw new Error(`No se puede aceptar desde estado ${reservation.estado}`);
  }

  const updated = await updateReservationByIdRepository(reservationId, {
    estado: 'EN_PROCESO',
    accion_requerida_por: null,
  });

  const row = await getReservationByIdWithJoinsRepository(reservationId);
  return toReservationDto(row ?? updated, profesionalId);
}

/**
 * PROFESIONAL propone
 */
export async function profesionalProposeService(
  profesionalId: string,
  reservationId: number,
  payload: unknown,
) {
  const parsed = ProProposeSchema.parse(payload);

  const reservation = await getReservationByIdRepository(reservationId);
  if (!reservation) throw new Error('Reserva no encontrada');
  if (String(reservation.profesional_id) !== String(profesionalId)) throw new Error('No autorizado');

  if (!['PENDIENTE', 'EN_NEGOCIACION'].includes(reservation.estado)) {
    throw new Error(`No se puede negociar desde estado ${reservation.estado}`);
  }

  const updated = await updateReservationByIdRepository(reservationId, {
    estado: 'EN_NEGOCIACION',
    fecha_hora_propuesta: parsed.fechaHoraPropuesta,
    mensaje_propuesta: parsed.mensajePropuesta ?? null,
    accion_requerida_por: 'CLIENTE',
  });

  const row = await getReservationByIdWithJoinsRepository(reservationId);
  return toReservationDto(row ?? updated, profesionalId);
}

/**
 * PROFESIONAL cancela
 */
export async function profesionalCancelService(
  profesionalId: string,
  reservationId: number,
  payload: unknown,
) {
  const parsed = ProCancelSchema.parse(payload);

  const reservation = await getReservationByIdRepository(reservationId);
  if (!reservation) throw new Error('Reserva no encontrada');
  if (String(reservation.profesional_id) !== String(profesionalId)) throw new Error('No autorizado');

  if (!['PENDIENTE', 'EN_NEGOCIACION'].includes(reservation.estado)) {
    throw new Error(`No se puede cancelar desde estado ${reservation.estado}`);
  }

  const updated = await updateReservationByIdRepository(reservationId, {
    estado: 'CANCELADO',
    cancelado_por: 'PROFESIONAL',
    motivo_cancelacion: parsed.motivo ?? null,
    accion_requerida_por: null,
  });

  const row = await getReservationByIdWithJoinsRepository(reservationId);
  return toReservationDto(row ?? updated, profesionalId);
}

/**
 * PROFESIONAL finaliza
 */
export async function profesionalFinishService(
  profesionalId: string,
  reservationId: number,
  _payload: unknown,
) {
  ProFinishSchema.parse(_payload);

  const reservation = await getReservationByIdRepository(reservationId);
  if (!reservation) throw new Error('Reserva no encontrada');
  if (String(reservation.profesional_id) !== String(profesionalId)) throw new Error('No autorizado');

  if (reservation.estado !== 'EN_PROCESO') {
    throw new Error(`No se puede finalizar desde estado ${reservation.estado}`);
  }

  const updated = await updateReservationByIdRepository(reservationId, {
    estado: 'FINALIZADO',
    accion_requerida_por: 'CLIENTE',
  });

  const row = await getReservationByIdWithJoinsRepository(reservationId);
  return toReservationDto(row ?? updated, profesionalId);
}

/**
 * REQUESTER acepta propuesta
 */
export async function requesterAcceptProposalService(userId: string, reservationId: number) {
  ClientAcceptProposalSchema.parse({});

  const reservation = await getReservationByIdRepository(reservationId);
  if (!reservation) throw new Error('Reserva no encontrada');

  if (String(reservation.cliente_id) !== String(userId)) throw new Error('No autorizado');

  if (reservation.estado !== 'EN_NEGOCIACION') {
    throw new Error(`No se puede aceptar propuesta desde estado ${reservation.estado}`);
  }

  const updated = await updateReservationByIdRepository(reservationId, {
    estado: 'EN_PROCESO',
    accion_requerida_por: null,
  });

  const row = await getReservationByIdWithJoinsRepository(reservationId);
  return toReservationDto(row ?? updated, userId);
}

/**
 * REQUESTER rechaza propuesta
 */
export async function requesterRejectProposalService(
  userId: string,
  reservationId: number,
  payload: unknown,
) {
  const parsed = ClientRejectProposalSchema.parse(payload);

  const reservation = await getReservationByIdRepository(reservationId);
  if (!reservation) throw new Error('Reserva no encontrada');

  if (String(reservation.cliente_id) !== String(userId)) throw new Error('No autorizado');

  if (reservation.estado !== 'EN_NEGOCIACION') {
    throw new Error(`No se puede rechazar propuesta desde estado ${reservation.estado}`);
  }

  const updated = await updateReservationByIdRepository(reservationId, {
    estado: 'PENDIENTE',
    accion_requerida_por: 'PROFESIONAL',
    mensaje_propuesta: parsed.mensaje ?? reservation.mensaje_propuesta ?? null,
  });

  const row = await getReservationByIdWithJoinsRepository(reservationId);
  return toReservationDto(row ?? updated, userId);
}

/**
 * REQUESTER finaliza (cliente_id)
 */
export async function requesterFinishService(userId: string, reservationId: number) {
  RequesterFinishSchema.parse({});

  const reservation = await getReservationByIdRepository(reservationId);
  if (!reservation) throw new Error('Reserva no encontrada');

  if (String(reservation.cliente_id) !== String(userId)) throw new Error('No autorizado');

  if (reservation.estado !== 'EN_PROCESO') {
    throw new Error(`No se puede finalizar desde estado ${reservation.estado}`);
  }

  const updated = await updateReservationByIdRepository(reservationId, {
    estado: 'FINALIZADO',
    accion_requerida_por: 'PROFESIONAL',
  });

  const row = await getReservationByIdWithJoinsRepository(reservationId);
  return toReservationDto(row ?? updated, userId);
}

export async function confirmFinishService(userId: string, reservationId: number) {
  ConfirmFinishSchema.parse({});

  const reservation = await getReservationByIdRepository(reservationId);
  if (!reservation) throw new Error('Reserva no encontrada');

  const isCliente = String(reservation.cliente_id) === String(userId);
  const isPro = String(reservation.profesional_id) === String(userId);
  if (!isCliente && !isPro) throw new Error('No autorizado');

  if (reservation.estado !== 'FINALIZADO') {
    throw new Error(`No se puede confirmar desde estado ${reservation.estado}`);
  }

  const side: 'CLIENTE' | 'PROFESIONAL' = isCliente ? 'CLIENTE' : 'PROFESIONAL';
  if (reservation.accion_requerida_por !== side) {
    throw new Error('No tenés acción pendiente para confirmar');
  }

  const updated = await updateReservationByIdRepository(reservationId, {
    estado: 'CERRADO',
    accion_requerida_por: null,
  });

  const row = await getReservationByIdWithJoinsRepository(reservationId);
  return toReservationDto(row ?? updated, userId);
}

export async function rejectFinishService(userId: string, reservationId: number, payload: unknown) {
  const parsed = RejectFinishSchema.parse(payload);

  const reservation = await getReservationByIdRepository(reservationId);
  if (!reservation) throw new Error('Reserva no encontrada');

  const isCliente = String(reservation.cliente_id) === String(userId);
  const isPro = String(reservation.profesional_id) === String(userId);
  if (!isCliente && !isPro) throw new Error('No autorizado');

  if (reservation.estado !== 'FINALIZADO') {
    throw new Error(`No se puede rechazar finalización desde estado ${reservation.estado}`);
  }

  const side: 'CLIENTE' | 'PROFESIONAL' = isCliente ? 'CLIENTE' : 'PROFESIONAL';
  if (reservation.accion_requerida_por !== side) {
    throw new Error('No tenés acción pendiente para rechazar');
  }

  const updated = await updateReservationByIdRepository(reservationId, {
    estado: 'EN_PROCESO',
    accion_requerida_por: null,
    mensaje_propuesta: parsed.mensaje ?? reservation.mensaje_propuesta ?? null,
  });

  const row = await getReservationByIdWithJoinsRepository(reservationId);
  return toReservationDto(row ?? updated, userId);
}

/**
 * ✅ NUEVO: CALIFICAR
 * - Solo cuando estado = CERRADO
 * - Cliente califica al profesional / profesional califica al cliente
 * - Visibilidad: se muestran ambas cuando ambos calificaron, sino cada uno ve la suya
 */
export async function rateReservationService(userId: string, reservationId: number, payload: unknown) {
  const parsed = RateReservationSchema.parse(payload);

  const reservation = await getReservationByIdRepository(reservationId);
  if (!reservation) throw new Error('Reserva no encontrada');

  const isCliente = String(reservation.cliente_id) === String(userId);
  const isPro = String(reservation.profesional_id) === String(userId);
  if (!isCliente && !isPro) throw new Error('No autorizado');

  if (reservation.estado !== 'CERRADO') {
    throw new Error('Solo podés calificar cuando el servicio esté cerrado');
  }

  // evita doble calificación
  if (isCliente && reservation.cliente_califico) throw new Error('Ya calificaste esta reserva');
  if (isPro && reservation.profesional_califico) throw new Error('Ya calificaste esta reserva');

  const patch: any = isCliente
    ? {
        cliente_puntaje: parsed.puntaje,
        cliente_comentario: parsed.comentario ?? null,
        cliente_califico: true,
        cliente_califico_en: new Date().toISOString(),
      }
    : {
        profesional_puntaje: parsed.puntaje,
        profesional_comentario: parsed.comentario ?? null,
        profesional_califico: true,
        profesional_califico_en: new Date().toISOString(),
      };

  await updateReservationByIdRepository(reservationId, patch);

  const row = await getReservationByIdWithJoinsRepository(reservationId);
  if (!row) throw new Error('Reserva no encontrada');

  return toReservationDto(row, userId);
}
// ✅ NUEVO: listar reviews públicas de un profesional
export async function listProfessionalReviewsService(profesionalId: string, query: any) {
  const sortRaw = String(query?.sort ?? 'recent');
  const sort: ReviewSort =
    sortRaw === 'best' || sortRaw === 'worst' || sortRaw === 'recent'
      ? (sortRaw as ReviewSort)
      : 'recent';

  const rating = Number(query?.rating ?? 0);
  const limit = Math.min(Math.max(Number(query?.limit ?? 10), 1), 50);
  const offset = Math.max(Number(query?.offset ?? 0), 0);

  return await listProfessionalReviewsRepository({
    profesionalId: String(profesionalId),
    sort,
    rating: Number.isFinite(rating) ? rating : 0,
    limit,
    offset,
  });
}
