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

  creadoEn?: string | null;
  actualizadoEn?: string | null;
  profesionalTelefono?: string | null;
  clienteTelefono?: string | null;
  servicioPrecioBase?: number | null;
};

export type CreateReservationPayload = {
  servicioId: number;
  profesionalId: string; // (en backend no lo usás; se infiere del servicio, pero lo dejamos)
  descripcionCliente?: string;
  fechaHoraSolicitada?: string | null; // ISO
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
  const r = await api.get<{ results: ReservationListItem[] }>(`/private/reservations/mine?tab=${tab}`);
  return r?.results ?? [];
}

export async function listMyReservationsPro(tab: 'pending' | 'active' | 'done') {
  const r = await api.get<{ results: ReservationListItem[] }>(`/private/reservations/pro?tab=${tab}`);
  return r?.results ?? [];
}

// --- Acciones PRO ---
export async function proAcceptReservation(id: number) {
  return await api.patch<ReservationListItem>(`/private/reservations/${id}/accept`, { body: {} });
}

export async function proProposeReservation(
  id: number,
  payload: { fechaHoraPropuesta: string; mensajePropuesta?: string }
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
  return await api.patch<ReservationListItem>(`/private/reservations/${id}/accept-proposal`, { body: {} });
}

export async function clientRejectProposal(id: number, payload: { mensaje?: string }) {
  return await api.patch<ReservationListItem>(`/private/reservations/${id}/reject-proposal`, {
    body: payload,
  });
}
// --- Finalización por solicitante y confirmación ---
export async function requesterFinish(id: number) {
  return await api.patch<ReservationListItem>(`/private/reservations/${id}/requester-finish`, { body: {} });
}

export async function confirmFinish(id: number) {
  return await api.patch<ReservationListItem>(`/private/reservations/${id}/confirm-finish`, { body: {} });
}

export async function rejectFinish(id: number, payload: { mensaje?: string }) {
  return await api.patch<ReservationListItem>(`/private/reservations/${id}/reject-finish`, {
    body: payload,
  });
}
