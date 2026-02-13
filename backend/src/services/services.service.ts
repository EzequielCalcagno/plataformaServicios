// src/services/services.service.ts
import {
  listMyServicesRepository,
  listServicesByProfessionalIdRepository,
  createMyServiceRepository,
  updateMyServiceRepository,
  deleteMyServiceRepository,
  getSuggestionsByCategoryRepository,
  createManyServicesRepository,
  existsServiceByTitleAndCategoryRepository,
  deactivateMyServiceRepository
} from '../repositories/services.repository';

function normalize(s: string) {
  return String(s ?? '').trim();
}

function toServiceDto(row: any) {
  return {
    id: Number(row.id),
    profesional_id: String(row.profesional_id),
    titulo: String(row.titulo ?? ''),
    descripcion: row.descripcion ?? null,
    categoria: String(row.categoria ?? ''),
    activo: !!row.activo,
    creado_en: row.creado_en ?? null,
    precio_base: row.precio_base ?? null,
  };
}

const FALLBACK: Record<string, string[]> = {
  'Plomería': [
    'Reparación de pérdidas',
    'Destapación de cañerías',
    'Instalación de grifería',
    'Cambio de flexible',
    'Arreglo de cisterna/mochila',
    'Instalación de calefón',
    'Reparación de calefón',
    'Instalación de bomba de agua',
    'Cambio de válvula',
    'Reparación de canilla',
    'Instalación de termofusión',
    'Cambio de cañerías',
  ],
  'Electricidad': [
    'Instalación de tomacorriente',
    'Cambio de llaves térmicas',
    'Instalación de luminaria',
    'Reparación de cortocircuito',
    'Armado de tablero',
    'Instalación de disyuntor',
    'Cambio de cableado',
    'Instalación de portero eléctrico',
    'Revisión eléctrica general',
    'Instalación de extractor',
    'Instalación de timbre',
  ],
  'Gas': [
    'Revisión de instalación de gas',
    'Instalación de cocina a gas',
    'Instalación de calefón a gas',
    'Detección de fuga de gas',
    'Cambio de manguera y abrazaderas',
    'Mantenimiento de calefactor a gas',
    'Prueba de hermeticidad',
  ],
  'Pintura': [
    'Pintura interior',
    'Pintura exterior',
    'Pintura de rejas',
    'Enduido y reparación de paredes',
    'Pintura de techo',
    'Pintura antihumedad',
    'Barnizado de madera',
  ],
  'Carpintería': [
    'Armado de muebles',
    'Reparación de puertas',
    'Ajuste de bisagras',
    'Colocación de estantes',
    'Instalación de placard',
    'Reparación de muebles',
    'Colocación de zócalos',
  ],
  'Albañilería': [
    'Reparación de humedad',
    'Arreglo de revoque',
    'Colocación de cerámicas',
    'Arreglo de pisos',
    'Pequeñas reformas',
    'Construcción de pared',
    'Colocación de yeso',
  ],
  'Herrería': [
    'Reparación de rejas',
    'Fabricación de portón',
    'Soldadura',
    'Reparación de cerramientos',
    'Instalación de barandas',
  ],
  'Aire acondicionado': [
    'Instalación de aire acondicionado',
    'Mantenimiento de aire acondicionado',
    'Carga de gas',
    'Limpieza de unidad interior/exterior',
    'Reparación de aire acondicionado',
  ],
  'Calefacción': [
    'Instalación de calefactor',
    'Mantenimiento de calefactor',
    'Reparación de calefacción',
    'Revisión de tiraje',
  ],
  'Cerrajería': [
    'Apertura de puerta',
    'Cambio de cerradura',
    'Duplicado de llaves',
    'Instalación de cerrojo',
    'Reparación de cerradura',
  ],
  'Jardinería': [
    'Corte de pasto',
    'Poda de árboles',
    'Limpieza de jardín',
    'Diseño de jardín',
    'Mantenimiento mensual',
  ],
  'Limpieza': [
    'Limpieza de grasera',
    'Limpieza profunda de cocina',
    'Limpieza de baños',
    'Limpieza post obra',
    'Limpieza de vidrios',
    'Limpieza de oficina',
    'Limpieza de tapizados',
    'Limpieza de alfombras',
    'Limpieza de patios',
    'Limpieza de galpón',
  ],
  'Mudanzas': [
    'Mudanza dentro de la ciudad',
    'Mudanza con embalaje',
    'Flete pequeño',
    'Traslado de muebles',
    'Ayuda para cargar/descargar',
  ],
  'Redes / Informática': [
    'Instalación de router / WiFi',
    'Configuración de red',
    'Formateo de PC',
    'Instalación de software',
    'Armado de PC',
    'Soporte técnico a domicilio',
    'Soporte técnico a domicilio',
  ],
  'Otros': [
    'Servicio general a domicilio',
    'Mantenimiento del hogar',
    'Arreglos generales',
  ],
};

function getFallback(category: string) {
  const exact = FALLBACK[category];
  if (exact?.length) return exact;
  const key = Object.keys(FALLBACK).find((k) => k.toLowerCase() === category.toLowerCase());
  if (key) return FALLBACK[key];

  return FALLBACK['Otros'];
}

export async function listMyServicesService(profesionalId: string) {
  const rows = await listMyServicesRepository(profesionalId);
  return rows.map(toServiceDto);
}

// lista servicios por profesionalId 

export async function listServicesByProfessionalIdService(profesionalId: string) {
  const id = normalize(profesionalId);
  if (!id) throw new Error('profesionalId es obligatorio');

  // Por defecto: solo activos 
  const rows = await listServicesByProfessionalIdRepository(id, true /* solo activos */);
  return rows.map(toServiceDto);
}

export async function createMyServiceService(profesionalId: string, payload: any) {
  const titulo = normalize(payload?.titulo ?? payload?.title ?? '');
  const descripcion = payload?.descripcion ?? payload?.description ?? null;
  const categoria = normalize(payload?.categoria ?? payload?.category ?? 'Otros') || 'Otros';
  const precio_base_raw = payload?.precio_base ?? payload?.price_base ?? payload?.priceBase ?? null;
  const precio_base =
    precio_base_raw == null
      ? null
      : Number.isFinite(Number(precio_base_raw))
        ? Number(precio_base_raw)
        : null;

  if (!titulo) throw new Error('titulo es obligatorio');
  if (!categoria) throw new Error('categoria es obligatoria');

  const created = await createMyServiceRepository({
    profesional_id: profesionalId,
    titulo,
    descripcion: typeof descripcion === 'string' ? descripcion : null,
    categoria,
    activo: true,
    precio_base,
  });

  return toServiceDto(created);
}

export async function updateMyServiceService(profesionalId: string, serviceId: number, payload: any) {
  const patch: any = {};

  if (payload?.titulo != null || payload?.title != null) {
    patch.titulo = normalize(payload?.titulo ?? payload?.title ?? '');
  }
  if (payload?.descripcion !== undefined || payload?.description !== undefined) {
    const v = payload?.descripcion ?? payload?.description;
    patch.descripcion = v === null ? null : normalize(v ?? '');
  }
  if (payload?.categoria != null || payload?.category != null) {
    patch.categoria = normalize(payload?.categoria ?? payload?.category ?? '');
  }
  if (typeof payload?.activo === 'boolean') patch.activo = payload.activo;

  if (payload?.precio_base !== undefined || payload?.price_base !== undefined || payload?.priceBase !== undefined) {
    const v = payload?.precio_base ?? payload?.price_base ?? payload?.priceBase;
    patch.precio_base = v == null ? null : (Number.isFinite(Number(v)) ? Number(v) : null);
  }

  const updated = await updateMyServiceRepository(profesionalId, serviceId, patch);
  return toServiceDto(updated);
}

export async function deleteMyServiceService(profesionalId: string, serviceId: number) {
  await deleteMyServiceRepository(profesionalId, serviceId);
  return true;
}

export async function deactivateMyServiceService(profesionalId: string, serviceId: number) {
  const updated = await deactivateMyServiceRepository(profesionalId, serviceId);
  return toServiceDto(updated);
}

export async function getServiceSuggestionsService(input: { category: string; q?: string; limit?: number }) {
  const category = normalize(input.category);
  const q = normalize(input.q ?? '');
  const limit = Number.isFinite(Number(input.limit)) ? Number(input.limit) : 30;
  const db = await getSuggestionsByCategoryRepository(category, Math.min(100, limit));
  const base = db.length ? db : getFallback(category);

  const filtered = q
    ? base.filter((t) => t.toLowerCase().includes(q.toLowerCase()))
    : base;
  const uniq: string[] = [];
  const seen = new Set<string>();
  for (const t of filtered) {
    const k = t.toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k);
    uniq.push(t);
    if (uniq.length >= limit) break;
  }

  return uniq;
}


// bootstrap:
// crea servicios típicos para el profesional (por categoría o varias)
// evita duplicados (profesional + categoria + titulo)
 
export async function bootstrapMyServicesService(
  profesionalId: string,
  input?: { category?: string | null; titles?: string[] | null; max?: number; priceBase?: number | null },
) {
  const max = Number.isFinite(Number(input?.max)) ? Number(input?.max) : 8;
  const category = input?.category ? normalize(input.category) : null;
  const customTitles =
    input?.titles?.map((t) => normalize(t)).filter(Boolean) ?? null;

  let targets: Array<{ categoria: string; titulo: string }> = [];

  if (customTitles?.length) {
    const cat = category ?? 'Otros';
    targets = customTitles.map((t) => ({ categoria: cat, titulo: t }));
  } else if (category) {
    targets = getFallback(category).slice(0, Math.max(1, max)).map((t) => ({
      categoria: category,
      titulo: t,
    }));
  } else {
    // si no especifica categoría: precargamos un set chico de categorías comunes
    const commonCats = ['Plomería', 'Electricidad', 'Limpieza', 'Pintura', 'Cerrajería', 'Jardinería'];
    for (const c of commonCats) {
      const list = getFallback(c).slice(0, 2);
      for (const t of list) targets.push({ categoria: c, titulo: t });
    }
    targets = targets.slice(0, Math.max(1, max));
  }

  const toInsert: any[] = [];
  for (const t of targets) {
    const exists = await existsServiceByTitleAndCategoryRepository(profesionalId, t.titulo, t.categoria);
    if (exists) continue;

    toInsert.push({
      profesional_id: profesionalId,
      titulo: t.titulo,
      descripcion: null,
      categoria: t.categoria,
      activo: true,
      precio_base: input?.priceBase ?? null,
    });
  }

  if (!toInsert.length) return [];

  const created = await createManyServicesRepository(profesionalId, toInsert);
  return created.map(toServiceDto);
}
