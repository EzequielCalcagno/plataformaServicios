// src/services/reservations.client.ts
import { api } from '../utils/api';

export type ReservationStatus =
  | 'PENDIENTE'
  | 'EN_NEGOCIACION'
  | 'EN_PROCESO'
  | 'FINALIZADO'
  | 'CERRADO'
  | 'CANCELADO';

export type AccionRequeridaPor = 'CLIENTE' | 'PROFESIONAL' | null;

export type ReservationListItem = {
  id: number;

  servicioId: number;
  servicioTitulo?: string | null;
  servicioCategoria?: string | null;

  servicioPrecioBase?: number | null;

  profesionalId: string;
  profesionalNombre?: string | null;
  profesionalApellido?: string | null;
  profesionalFotoUrl?: string | null;

  clienteId: string;
  clienteNombre?: string | null;
  clienteApellido?: string | null;
  clienteFotoUrl?: string | null;

  estado: ReservationStatus;

  descripcionCliente?: string | null;
  fechaHoraSolicitada?: string | null;

  fechaHoraPropuesta?: string | null;
  mensajePropuesta?: string | null;

  accionRequeridaPor?: AccionRequeridaPor;

  canceladoPor?: 'CLIENTE' | 'PROFESIONAL' | null;
  motivoCancelacion?: string | null;

  clienteCalifico?: boolean;
  profesionalCalifico?: boolean;

  clientePuntaje?: number | null;
  clienteComentario?: string | null;

  profesionalPuntaje?: number | null;
  profesionalComentario?: string | null;

  canSeeRatings?: boolean;

  creadoEn?: string | null;
  actualizadoEn?: string | null;

  profesionalTelefono?: string | null;
  clienteTelefono?: string | null;
};

export type CreateReservationPayload = {
  servicioId: number;
  profesionalId: string;
  descripcionCliente?: string;
  fechaHoraSolicitada?: string | null; 
};

export async function createReservation(payload: CreateReservationPayload) {
  return await api.post<ReservationListItem>('/private/reservations', {
    body: payload,
  });
}

export async function getReservationById(id: number) {
  return await api.get<ReservationListItem>(`/private/reservations/${id}`);
}

// --- Listados (Mine / Pro) ---
export async function listMyReservationsMine(tab: 'waiting' | 'active' | 'done') {
  const r = await api.get<{ results: ReservationListItem[] }>(
    `/private/reservations/mine?tab=${tab}`,
  );
  return r?.results ?? [];
}

export async function listMyReservationsPro(tab: 'pending' | 'active' | 'done') {
  const r = await api.get<{ results: ReservationListItem[] }>(
    `/private/reservations/pro?tab=${tab}`,
  );
  return r?.results ?? [];
}

// --- Acciones PRO ---
export async function proAcceptReservation(id: number) {
  return await api.patch<ReservationListItem>(`/private/reservations/${id}/accept`, { body: {} });
}

export async function proProposeReservation(
  id: number,
  payload: { fechaHoraPropuesta: string; mensajePropuesta?: string },
) {
  return await api.patch<ReservationListItem>(`/private/reservations/${id}/propose`, {
    body: payload,
  });
}

export async function proCancelReservation(id: number, payload: { motivo?: string }) {
  return await api.patch<ReservationListItem>(`/private/reservations/${id}/cancel`, {
    body: payload,
  });
}

export async function proFinishReservation(id: number) {
  return await api.patch<ReservationListItem>(`/private/reservations/${id}/finish`, { body: {} });
}

// --- Acciones CLIENTE (negociación) ---
export async function clientAcceptProposal(id: number) {
  return await api.patch<ReservationListItem>(`/private/reservations/${id}/accept-proposal`, {
    body: {},
  });
}

export async function clientRejectProposal(id: number, payload: { mensaje?: string }) {
  return await api.patch<ReservationListItem>(`/private/reservations/${id}/reject-proposal`, {
    body: payload,
  });
}

// --- Finalización por solicitante y confirmación ---
export async function requesterFinish(id: number) {
  return await api.patch<ReservationListItem>(`/private/reservations/${id}/requester-finish`, {
    body: {},
  });
}

export async function confirmFinish(id: number) {
  return await api.patch<ReservationListItem>(`/private/reservations/${id}/confirm-finish`, {
    body: {},
  });
}

export async function rejectFinish(id: number, payload: { mensaje?: string }) {
  return await api.patch<ReservationListItem>(`/private/reservations/${id}/reject-finish`, {
    body: payload,
  });
}

//calificar (cliente o profesional, según quién esté logueado)
export type RateReservationPayload = {
  puntaje: number; 
  comentario?: string;
};

export async function rateReservation(
  id: number,
  payload: { puntaje: number; comentario?: string }
) {
  return await api.patch<ReservationListItem>(`/private/reservations/${id}/rate`, {
    body: payload,
  });
}
