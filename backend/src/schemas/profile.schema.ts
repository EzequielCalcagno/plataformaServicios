import { z } from 'zod';

export const ProfessionalProfileSchema = z.object({
  descripcion: z.string().optional().nullable(),
  especialidad: z.string().optional().nullable(),
  experiencia: z.string().optional().nullable(),
  portadaUrl: z.string().url().optional().nullable(),
  ratingPromedio: z.number().optional().nullable(),
  fechaActualizacion: z.string().datetime().optional().nullable(),
});

export const UbicationSchema = z.object({
  id: z.string(),
  nombreUbicacion: z.string().optional().nullable(),
  ciudad: z.string().optional().nullable(),
  direccion: z.string().optional().nullable(),
  tipo: z.string().optional().nullable(),
  principal: z.boolean().optional(),
  coordenadas: z.any().nullable().optional(),
  activa: z.boolean().optional(),
});

export const ProfessionalProfileResponseSchema = z.object({
  id: z.string(),
  nombre: z.string(),
  apellido: z.string().nullable(),
  email: z.string().email(),
  avatarUrl: z.string().url().nullable().optional(),
  rol: z.string().nullable(),

  profesional: ProfessionalProfileSchema.nullable(),

  ubicaciones: z.array(UbicationSchema),
});

export const UpdateProfessionalProfileSchema = z.object({
  descripcion: z.string().max(2000).optional(),
  especialidad: z.string().max(100).optional(),
  experiencia: z.string().max(4000).optional(),
  portadaUrl: z.string().url().nullable().optional(),
});

export type UpdateProfessionalProfileInput = z.infer<typeof UpdateProfessionalProfileSchema>;
