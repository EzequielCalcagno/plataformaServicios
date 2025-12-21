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
  RejectFinishSchema
} from '../schemas/reservation.schema';

import {
  createReservationRepository,
  getReservationByIdRepository,
  getServicioByIdRepository,
  listReservationsForClienteRepository,
  listReservationsForProfesionalRepository,
  updateReservationByIdRepository,
  getReservationByIdWithJoinsRepository,
} from '../repositories/reservations.repository';

/**
 * Normaliza filas del repo (con joins) a DTO amigable FE
 * ✅ nombres alineados al frontend
 */
function toReservationDto(row: any) {
  // soporta ambas formas por si el repo devuelve `servicios:` o `servicio:`
  const servicio = row.servicio ?? row.servicios ?? null;

  const dto = {
    id: Number(row.id),

    servicioId: Number(row.servicio_id),
    servicioTitulo: servicio?.titulo ?? null,
    servicioCategoria: servicio?.categoria ?? null,

    profesionalId: String(row.profesional_id),
    profesionalNombre: row.profesional?.nombre ?? null,
    profesionalApellido: row.profesional?.apellido ?? null,
    profesionalPhotoUrl: row.profesional?.foto_url ?? null,

    clienteId: String(row.cliente_id),
    clienteNombre: row.cliente?.nombre ?? null,
    clienteApellido: row.cliente?.apellido ?? null,
    clientePhotoUrl: row.cliente?.foto_url ?? null,

    estado: row.estado as ReservationStatus,

    descripcionCliente: row.descripcion_cliente ?? null,
    fechaHoraSolicitada: row.fecha_hora_solicitada ?? null,

    fechaHoraPropuesta: row.fecha_hora_propuesta ?? null,
    mensajePropuesta: row.mensaje_propuesta ?? null,

    accionRequeridaPor: row.accion_requerida_por ?? null,

    canceladoPor: row.cancelado_por ?? null,
    motivoCancelacion: row.motivo_cancelacion ?? null,

    clienteCalifico: row.cliente_califico ?? false,
    profesionalCalifico: row.profesional_califico ?? false,

    creadoEn: row.creado_en ? new Date(row.creado_en).toISOString() : null,
    actualizadoEn: row.actualizado_en ? new Date(row.actualizado_en).toISOString() : null,

    profesionalTelefono: row.profesional?.telefono ?? null,
    clienteTelefono: row.cliente?.telefono ?? null,
    servicioPrecioBase: row.servicio?.precio_base ?? null,
  };

  return ReservationDtoSchema.parse(dto);
}

/**
 * ✅ DETALLE con permisos:
 * - solo puede ver si es cliente_id o profesional_id
 * (esto es lo que tu controller está intentando llamar)
 */
export async function getReservationByIdForUserService(userId: string, reservationId: number) {
  const row = await getReservationByIdWithJoinsRepository(reservationId);
  if (!row) return null;

  if (String(row.cliente_id) !== String(userId) && String(row.profesional_id) !== String(userId)) {
    throw new Error('No autorizado');
  }

  return toReservationDto(row);
}

/**
 * Crear reserva:
 * requester = cliente_id (independiente del rol real del usuario)
 * Estado inicial: PENDIENTE + accion_requerida_por=PROFESIONAL
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

  // ✅ devolvemos detalle completo con joins (evita nulls y faltantes en FE)
  const row = await getReservationByIdWithJoinsRepository(Number(created.id));
  return toReservationDto(row ?? created);
}

/**
 * Tabs requester (cliente):
 * waiting: PENDIENTE + EN_NEGOCIACION
 * active: EN_PROCESO
 * done: FINALIZADO + CERRADO
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
  return rows.map(toReservationDto);
}

/**
 * Tabs profesional (recibidas):
 * pending: PENDIENTE + EN_NEGOCIACION
 * active: EN_PROCESO
 * done: FINALIZADO + CERRADO
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
  return rows.map(toReservationDto);
}

/**
 * PROFESIONAL acepta:
 * PENDIENTE | EN_NEGOCIACION -> EN_PROCESO
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
  return toReservationDto(row ?? updated);
}

/**
 * PROFESIONAL propone:
 * PENDIENTE | EN_NEGOCIACION -> EN_NEGOCIACION
 * accion_requerida_por -> CLIENTE (requester)
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
  return toReservationDto(row ?? updated);
}

/**
 * PROFESIONAL cancela:
 * PENDIENTE | EN_NEGOCIACION -> CANCELADO
 */
export async function profesionalCancelService(profesionalId: string, reservationId: number, payload: unknown) {
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
  return toReservationDto(row ?? updated);
}

/**
 * PROFESIONAL finaliza:
 * EN_PROCESO -> FINALIZADO
 * accion_requerida_por -> CLIENTE (requester) para confirmar/calificar
 */
export async function profesionalFinishService(profesionalId: string, reservationId: number, _payload: unknown) {
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
  return toReservationDto(row ?? updated);
}

/**
 * REQUESTER (cliente_id) acepta propuesta:
 * EN_NEGOCIACION -> EN_PROCESO
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
  return toReservationDto(row ?? updated);
}

/**
 * REQUESTER (cliente_id) rechaza propuesta:
 * EN_NEGOCIACION -> PENDIENTE
 * accion_requerida_por -> PROFESIONAL
 */
export async function requesterRejectProposalService(userId: string, reservationId: number, payload: unknown) {
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
  return toReservationDto(row ?? updated);
}
// requester = cliente_id (independiente del rol real del usuario)
export async function requesterFinishService(userId: string, reservationId: number) {
  RequesterFinishSchema.parse({});

  const reservation = await getReservationByIdRepository(reservationId);
  if (!reservation) throw new Error('Reserva no encontrada');

  if (String(reservation.cliente_id) !== String(userId)) throw new Error('No autorizado');

  if (reservation.estado !== 'EN_PROCESO') {
    throw new Error(`No se puede finalizar desde estado ${reservation.estado}`);
  }

  // ✅ el solicitante finaliza => el otro (PROFESIONAL) debe confirmar
  const updated = await updateReservationByIdRepository(reservationId, {
    estado: 'FINALIZADO',
    accion_requerida_por: 'PROFESIONAL',
  });

  const row = await getReservationByIdWithJoinsRepository(reservationId);
  return toReservationDto(row ?? updated);
}

export async function confirmFinishService(userId: string, reservationId: number) {
  ConfirmFinishSchema.parse({});

  const reservation = await getReservationByIdRepository(reservationId);
  if (!reservation) throw new Error('Reserva no encontrada');

  // solo pueden confirmar el “otro lado” cuando accion_requerida_por lo pide
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

  // ✅ confirmación final => CERRADO
  const updated = await updateReservationByIdRepository(reservationId, {
    estado: 'CERRADO',
    accion_requerida_por: null,
  });

  const row = await getReservationByIdWithJoinsRepository(reservationId);
  return toReservationDto(row ?? updated);
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

  // ✅ vuelve a EN_PROCESO y deja un mensaje
  const updated = await updateReservationByIdRepository(reservationId, {
    estado: 'EN_PROCESO',
    accion_requerida_por: null,
    // reutilizamos mensaje_propuesta como "nota" (si querés, creamos columna nueva después)
    mensaje_propuesta: parsed.mensaje ?? reservation.mensaje_propuesta ?? null,
  });

  const row = await getReservationByIdWithJoinsRepository(reservationId);
  return toReservationDto(row ?? updated);
}