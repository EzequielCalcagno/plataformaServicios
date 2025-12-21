// src/repositories/reservations.repository.ts
import db from '../config/db';
import { ReservationStatus } from '../schemas/reservation.schema';

type CreateReservationDbPayload = {
  servicio_id: number;
  profesional_id: string;
  cliente_id: string;
  estado: ReservationStatus;
  descripcion_cliente?: string | null;
  fecha_hora_solicitada?: string | null;
  accion_requerida_por?: 'CLIENTE' | 'PROFESIONAL' | null;
};

type UpdateReservationDbPayload = Partial<{
  estado: ReservationStatus;
  fecha_hora_propuesta: string | null;
  mensaje_propuesta: string | null;
  accion_requerida_por: 'CLIENTE' | 'PROFESIONAL' | null;

  cancelado_por: 'CLIENTE' | 'PROFESIONAL' | null;
  motivo_cancelacion: string | null;

  cliente_califico: boolean;
  profesional_califico: boolean;

  actualizado_en: string;
}>;

export async function getServicioByIdRepository(servicioId: number) {
  const { data, error } = await db
    .from('servicios')
    .select(`id, profesional_id, titulo, categoria, activo`)
    .eq('id', servicioId)
    .single();

  if (error) {
    console.error('❌ Error getServicioByIdRepository:', error);
    throw error;
  }

  return data || null;
}

export async function createReservationRepository(payload: CreateReservationDbPayload) {
  const { data, error } = await db
    .from('reservations')
    .insert({
      servicio_id: payload.servicio_id,
      profesional_id: payload.profesional_id,
      cliente_id: payload.cliente_id,
      estado: payload.estado,
      descripcion_cliente: payload.descripcion_cliente ?? null,
      fecha_hora_solicitada: payload.fecha_hora_solicitada ?? null,
      accion_requerida_por: payload.accion_requerida_por ?? null,
    })
    .select('*')
    .single();

  if (error) {
    console.error('❌ Error createReservationRepository:', error);
    throw error;
  }

  return data;
}

export async function getReservationByIdRepository(id: number) {
  const { data, error } = await db
    .from('reservations')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('❌ Error getReservationByIdRepository:', error);
    throw error;
  }

  return data || null;
}

export async function updateReservationByIdRepository(id: number, patch: UpdateReservationDbPayload) {
  const { data, error } = await db
    .from('reservations')
    .update({
      ...patch,
      actualizado_en: patch.actualizado_en ?? new Date().toISOString(),
    })
    .eq('id', id)
    .select('*')
    .single();

  if (error) {
    console.error('❌ Error updateReservationByIdRepository:', error);
    throw error;
  }

  return data;
}

/**
 * Listados para tabs (cliente / profesional)
 * ✅ Incluye joins correctos (servicio + usuario)
 *
 * OJO: los "usuarios!reservations_*_fkey" dependen del nombre real del FK.
 */
export async function listReservationsForClienteRepository(
  clienteId: string,
  estados: ReservationStatus[],
) {
  const { data, error } = await db
    .from('reservations')
    .select(
      `
      id,
      servicio_id,
      profesional_id,
      cliente_id,
      estado,
      descripcion_cliente,
      fecha_hora_solicitada,
      fecha_hora_propuesta,
      mensaje_propuesta,
      accion_requerida_por,
      cancelado_por,
      motivo_cancelacion,
      cliente_califico,
      profesional_califico,
      creado_en,
      actualizado_en,

      servicio:servicios!reservations_servicio_id_fkey (
        id,
        titulo,
        categoria
      ),

      profesional:usuarios!reservations_profesional_id_fkey (
        id,
        nombre,
        apellido,
        foto_url
      )
    `,
    )
    .eq('cliente_id', clienteId)
    .in('estado', estados as any)
    .order('creado_en', { ascending: false });

  if (error) {
    console.error('❌ Error listReservationsForClienteRepository:', error);
    throw error;
  }

  return data || [];
}

export async function listReservationsForProfesionalRepository(
  profesionalId: string,
  estados: ReservationStatus[],
) {
  const { data, error } = await db
    .from('reservations')
    .select(
      `
      id,
      servicio_id,
      profesional_id,
      cliente_id,
      estado,
      descripcion_cliente,
      fecha_hora_solicitada,
      fecha_hora_propuesta,
      mensaje_propuesta,
      accion_requerida_por,
      cancelado_por,
      motivo_cancelacion,
      cliente_califico,
      profesional_califico,
      creado_en,
      actualizado_en,

      servicio:servicios!reservations_servicio_id_fkey (
        id,
        titulo,
        categoria
      ),

      cliente:usuarios!reservations_cliente_id_fkey (
        id,
        nombre,
        apellido,
        foto_url
      )
    `,
    )
    .eq('profesional_id', profesionalId)
    .in('estado', estados as any)
    .order('creado_en', { ascending: false });

  if (error) {
    console.error('❌ Error listReservationsForProfesionalRepository:', error);
    throw error;
  }

  return data || [];
}
export async function getReservationByIdWithJoinsRepository(id: number) {
  const { data, error } = await db
    .from('reservations')
    .select(
      `
      id,
      servicio_id,
      profesional_id,
      cliente_id,
      estado,
      descripcion_cliente,
      fecha_hora_solicitada,
      fecha_hora_propuesta,
      mensaje_propuesta,
      accion_requerida_por,
      cancelado_por,
      motivo_cancelacion,
      cliente_califico,
      profesional_califico,
      creado_en,
      actualizado_en,

      servicios:servicio_id (
        id,
        titulo,
        categoria
      ),

      profesional:profesional_id (
        id,
        nombre,
        apellido,
        foto_url,
        telefono
      ),

      cliente:cliente_id (
        id,
        nombre,
        apellido,
        foto_url,
        telefono
      )
    `
    )
    .eq('id', id)
    .single();

  if (error) {
    console.error('❌ Error getReservationByIdWithJoinsRepository:', error);
    return null;
  }

  return data || null;
}