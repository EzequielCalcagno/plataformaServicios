// src/repositories/services.repository.ts
import db from '../config/db';

export type ServiceRow = {
  id: number;
  profesional_id: string;
  titulo: string;
  descripcion: string | null;
  categoria: string;
  activo: boolean;
  creado_en: string | null;
  precio_base: number | null;
};

export type CreateServiceDbPayload = {
  profesional_id: string;
  titulo: string;
  descripcion?: string | null;
  categoria: string;
  activo?: boolean;
  precio_base?: number | null;
};

export type UpdateServiceDbPayload = Partial<{
  titulo: string;
  descripcion: string | null;
  categoria: string;
  activo: boolean;
  precio_base: number | null;
}>;

const SELECT_FIELDS = `
  id,
  profesional_id,
  titulo,
  descripcion,
  categoria,
  activo,
  creado_en,
  precio_base
`;

// Mis servicios (profesional logueado)
export async function listMyServicesRepository(profesionalId: string) {
  const { data, error } = await db
    .from('servicios')
    .select(SELECT_FIELDS)
    .eq('profesional_id', profesionalId)
    .order('creado_en', { ascending: false });

  if (error) {
    console.error('❌ Error en listMyServicesRepository:', error);
    throw error;
  }

  return (data ?? []) as ServiceRow[];
}

// Servicios por profesional (seleccionado desde el front)
export async function listServicesByProfessionalIdRepository(
  profesionalId: string,
  onlyActive = true,
) {
  let q = db
    .from('servicios')
    .select(SELECT_FIELDS)
    .eq('profesional_id', profesionalId)
    .order('creado_en', { ascending: false });

  if (onlyActive) q = q.eq('activo', true);

  const { data, error } = await q;

  if (error) {
    console.error('❌ Error en listServicesByProfessionalIdRepository:', error);
    throw error;
  }

  return (data ?? []) as ServiceRow[];
}

export async function createMyServiceRepository(payload: CreateServiceDbPayload) {
  const { data, error } = await db
    .from('servicios')
    .insert({
      profesional_id: payload.profesional_id,
      titulo: payload.titulo,
      descripcion: payload.descripcion ?? null,
      categoria: payload.categoria,
      activo: payload.activo ?? true,
      precio_base: payload.precio_base ?? null,
    })
    .select(SELECT_FIELDS)
    .single();

  if (error) {
    console.error('❌ Error en createMyServiceRepository:', error);
    throw error;
  }

  return data as ServiceRow;
}

export async function updateMyServiceRepository(
  profesionalId: string,
  serviceId: number,
  patch: UpdateServiceDbPayload,
) {
  const { data, error } = await db
    .from('servicios')
    .update(patch)
    .eq('id', serviceId)
    .eq('profesional_id', profesionalId)
    .select(SELECT_FIELDS)
    .single();

  if (error) {
    console.error('❌ Error en updateMyServiceRepository:', error);
    throw error;
  }

  return data as ServiceRow;
}

export async function deleteMyServiceRepository(profesionalId: string, serviceId: number) {
  const { error } = await db
    .from('servicios')
    .delete()
    .eq('id', serviceId)
    .eq('profesional_id', profesionalId);

  if (error) {
    console.error('❌ Error en deleteMyServiceRepository:', error);
    throw error;
  }

  return true;
}

 //trae hasta 500 servicios, filtra por categoría (case-insensitive)
 //cuenta repetidos y devuelve top 
 
export async function getSuggestionsByCategoryRepository(
  category: string,
  limit = 30,
): Promise<string[]> {
  const { data, error } = await db
    .from('servicios')
    .select('titulo, categoria')
    .ilike('categoria', category) 
    .limit(500);

  if (error) {
    console.error('❌ Error en getSuggestionsByCategoryRepository:', error);
    return [];
  }

  const titles = (data ?? [])
    .map((r: any) => String(r?.titulo ?? '').trim())
    .filter(Boolean);

  const count = new Map<string, number>();
  for (const t of titles) count.set(t, (count.get(t) ?? 0) + 1);

  return Array.from(count.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([t]) => t);
}

// Bootstrap: inserta varios servicios de una (bulk)

export async function createManyServicesRepository(
  profesionalId: string,
  payloads: CreateServiceDbPayload[],
) {
  if (!payloads.length) return [];

  const { data, error } = await db
    .from('servicios')
    .insert(
      payloads.map((p) => ({
        profesional_id: profesionalId,
        titulo: p.titulo,
        descripcion: p.descripcion ?? null,
        categoria: p.categoria,
        activo: p.activo ?? true,
        precio_base: p.precio_base ?? null,
      })),
    )
    .select(SELECT_FIELDS);

  if (error) {
    console.error('❌ Error en createManyServicesRepository:', error);
    throw error;
  }

  return (data ?? []) as ServiceRow[];
}

// helper: evitar duplicados (profesional + categoría + título)
 
export async function existsServiceByTitleAndCategoryRepository(
  profesionalId: string,
  titulo: string,
  categoria: string,
) {
  const { data, error } = await db
    .from('servicios')
    .select('id')
    .eq('profesional_id', profesionalId)
    .eq('categoria', categoria)
    .eq('titulo', titulo)
    .limit(1);

  if (error) return false;
  return (data ?? []).length > 0;
}
export async function deactivateMyServiceRepository(profesionalId: string, serviceId: number) {
  const { data, error } = await db
    .from('servicios')
    .update({ activo: false })
    .eq('id', serviceId)
    .eq('profesional_id', profesionalId)
    .select(SELECT_FIELDS)
    .single();

  if (error) {
    console.error('❌ Error en deactivateMyServiceRepository:', error);
    throw error;
  }

  return data as ServiceRow;
}