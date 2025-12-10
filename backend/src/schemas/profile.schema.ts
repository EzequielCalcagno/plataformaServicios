import { z } from 'zod';
import { LocationSchema } from './locationSchema';

export const ProfessionalProfileSchema = z.object({
  descripcion: z.string().optional().nullable(),
  especialidad: z.string().optional().nullable(),
  experiencia: z.string().optional().nullable(),
  portadaUrl: z.string().url().optional().nullable(),
  ratingPromedio: z.number().optional().nullable(),
  fechaActualizacion: z.string().datetime().optional().nullable(),
});

export const ProfessionalProfileResponseSchema = z.object({
  id: z.string(),
  nombre: z.string(),
  apellido: z.string().nullable(),
  email: z.string().email(),
  avatarUrl: z.string().url().nullable().optional(),
  rol: z.string().nullable(),

  profesional: ProfessionalProfileSchema.nullable(),

  ubicaciones: z.array(LocationSchema),
});

export const UpdateProfessionalProfileSchema = z.object({
  descripcion: z.string().max(2000).optional(),
  especialidad: z.string().max(100).optional(),
  experiencia: z.string().max(4000).optional(),
  portadaUrl: z.string().url().nullable().optional(),
});

export type UpdateProfessionalProfileInput = z.infer<typeof UpdateProfessionalProfileSchema>;
