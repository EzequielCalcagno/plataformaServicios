// src/repositories/reservations.repository.ts
import db from '../config/db';
import { ReservationStatus, VisitStatus } from '../schemas/reservation.schema';

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

  // flags
  cliente_califico: boolean;
  profesional_califico: boolean;

  // ✅ ratings
  cliente_puntaje: number | null;
  cliente_comentario: string | null;
  cliente_califico_en: string | null;

  profesional_puntaje: number | null;
  profesional_comentario: string | null;
  profesional_califico_en: string | null;

  actualizado_en: string;
}>;

export async function getServicioByIdRepository(servicioId: number) {
  const { data, error } = await db
    .from('servicios')
    .select(`id, profesional_id, titulo, categoria, activo, precio_base`)
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
 * ✅ Incluye joins (servicio + usuario)
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
      cliente_puntaje,
      cliente_comentario,
      cliente_califico_en,
      profesional_puntaje,
      profesional_comentario,
      profesional_califico_en,

      creado_en,
      actualizado_en,

      servicio:servicios!reservations_servicio_id_fkey (
        id,
        titulo,
        categoria,
        precio_base
      ),

      profesional:usuarios!reservations_profesional_id_fkey (
        id,
        nombre,
        apellido,
        foto_url,
        telefono
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
      cliente_puntaje,
      cliente_comentario,
      cliente_califico_en,
      profesional_puntaje,
      profesional_comentario,
      profesional_califico_en,

      creado_en,
      actualizado_en,

      servicio:servicios!reservations_servicio_id_fkey (
        id,
        titulo,
        categoria,
        precio_base
      ),

      cliente:usuarios!reservations_cliente_id_fkey (
        id,
        nombre,
        apellido,
        foto_url,
        telefono
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

/**
 * Detalle con joins (servicio + profesional + cliente)
 */
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
      cliente_puntaje,
      cliente_comentario,
      cliente_califico_en,
      profesional_puntaje,
      profesional_comentario,
      profesional_califico_en,

      creado_en,
      actualizado_en,

      servicio:servicios!reservations_servicio_id_fkey (
        id,
        titulo,
        categoria,
        precio_base
      ),

      profesional:usuarios!reservations_profesional_id_fkey (
        id,
        nombre,
        apellido,
        foto_url,
        telefono
      ),

      cliente:usuarios!reservations_cliente_id_fkey (
        id,
        nombre,
        apellido,
        foto_url,
        telefono
      )
    `,
    )
    .eq('id', id)
    .single();

  if (error) {
    console.error('❌ Error getReservationByIdWithJoinsRepository:', error);
    return null;
  }

  return data || null;
}

// ✅ NUEVO: Reviews del profesional (las calificaciones del cliente)
export type ReviewSort = 'recent' | 'best' | 'worst';

export async function listProfessionalReviewsRepository(params: {
  profesionalId: string;
  sort: ReviewSort;
  rating: number; // 0..5 (0 = sin filtro)
  limit: number;
  offset: number;
}) {
  const { profesionalId, sort, rating, limit, offset } = params;

  const limitPlus = limit + 1;
  const from = offset;
  const to = offset + limitPlus - 1;

  let q = db
    .from('reservations')
    .select(
      `
      id,
      creado_en,
      actualizado_en,
      cliente_puntaje,
      cliente_comentario,

      cliente:usuarios!reservations_cliente_id_fkey (
        id,
        nombre,
        apellido,
        foto_url
      )
    `,
    )
    .eq('profesional_id', profesionalId)
    .eq('estado', 'CERRADO')
    .eq('cliente_califico', true)
    .not('cliente_puntaje', 'is', null);

  // filtro por rating (1..5)
  if (rating >= 1 && rating <= 5) {
    q = q.eq('cliente_puntaje', rating);
  }

  // sort
  if (sort === 'best') {
    q = q.order('cliente_puntaje', { ascending: false }).order('actualizado_en', { ascending: false });
  } else if (sort === 'worst') {
    q = q.order('cliente_puntaje', { ascending: true }).order('actualizado_en', { ascending: false });
  } else {
    q = q.order('actualizado_en', { ascending: false });
  }

  const { data, error } = await q.range(from, to);

  if (error) {
    console.error('❌ Error listProfessionalReviewsRepository:', error);
    throw error;
  }

  const rows = data ?? [];
  const hasMore = rows.length > limit;
  const page = hasMore ? rows.slice(0, limit) : rows;

  const results = page.map((r: any) => {
    const authorName =
      `${r?.cliente?.nombre ?? ''} ${r?.cliente?.apellido ?? ''}`.trim() || 'Usuario';

    return {
      id: String(r.id),
      authorName,
      authorPhotoUrl: r?.cliente?.foto_url ?? null,
      createdAt: (r.actualizado_en ?? r.creado_en ?? new Date().toISOString()) as string,
      rating: Number(r.cliente_puntaje ?? 0),
      comment: (r.cliente_comentario ?? null) as string | null,
    };
  });

  return {
    results,
    nextOffset: hasMore ? offset + limit : null,
  };
}

/* ============================================================
   ✅ NUEVO: VISITAS + DETALLES (en el MISMO repository)
   Tablas: reservation_visits, reservation_service_details
   ============================================================ */

export async function listReservationVisitsRepository(reservationId: number) {
  const { data, error } = await db
    .from('reservation_visits')
    .select(`id, reservation_id, created_by, visit_at, status, notes, created_at, updated_at`)
    .eq('reservation_id', reservationId)
    .order('visit_at', { ascending: true });

  if (error) {
    console.error('❌ Error listReservationVisitsRepository:', error);
    throw error;
  }
  return data ?? [];
}

export async function createReservationVisitRepository(payload: {
  reservation_id: number;
  created_by: string;
  visit_at: string;
  status: VisitStatus;
  notes?: string | null;
}) {
  const { data, error } = await db
    .from('reservation_visits')
    .insert({
      reservation_id: payload.reservation_id,
      created_by: payload.created_by,
      visit_at: payload.visit_at,
      status: payload.status,
      notes: payload.notes ?? null,
    })
    .select(`id, reservation_id, created_by, visit_at, status, notes, created_at, updated_at`)
    .single();

  if (error) {
    console.error('❌ Error createReservationVisitRepository:', error);
    throw error;
  }
  return data;
}

export async function getReservationVisitByIdRepository(visitId: number) {
  const { data, error } = await db
    .from('reservation_visits')
    .select(`id, reservation_id`)
    .eq('id', visitId)
    .single();

  if (error) return null;
  return data ?? null;
}

export async function updateReservationVisitRepository(
  visitId: number,
  patch: Partial<{ visit_at: string; status: VisitStatus; notes: string | null }>,
) {
  const { data, error } = await db
    .from('reservation_visits')
    .update({
      ...patch,
      updated_at: new Date().toISOString(),
    })
    .eq('id', visitId)
    .select(`id, reservation_id, created_by, visit_at, status, notes, created_at, updated_at`)
    .single();

  if (error) {
    console.error('❌ Error updateReservationVisitRepository:', error);
    throw error;
  }
  return data;
}

export async function deleteReservationVisitRepository(visitId: number) {
  const { error } = await db.from('reservation_visits').delete().eq('id', visitId);
  if (error) {
    console.error('❌ Error deleteReservationVisitRepository:', error);
    throw error;
  }
  return true;
}

// ---- detalles del servicio (1 por reserva) ----

export async function getReservationServiceDetailsRepository(reservationId: number) {
  const { data, error } = await db
    .from('reservation_service_details')
    .select(`reservation_id, updated_by, final_price, duration_minutes, materials_used, final_notes, updated_at`)
    .eq('reservation_id', reservationId)
    .single();

  if (error) return null;
  return data ?? null;
}

export async function upsertReservationServiceDetailsRepository(payload: {
  reservation_id: number;
  updated_by: string;
  final_price?: number | null;
  duration_minutes?: number | null;
  materials_used?: string | null;
  final_notes?: string | null;
}) {
  const { data, error } = await db
    .from('reservation_service_details')
    .upsert(
      {
        reservation_id: payload.reservation_id,
        updated_by: payload.updated_by,
        final_price: payload.final_price ?? null,
        duration_minutes: payload.duration_minutes ?? null,
        materials_used: payload.materials_used ?? null,
        final_notes: payload.final_notes ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'reservation_id' },
    )
    .select(`reservation_id, updated_by, final_price, duration_minutes, materials_used, final_notes, updated_at`)
    .single();

  if (error) {
    console.error('❌ Error upsertReservationServiceDetailsRepository:', error);
    throw error;
  }
  return data;
}
