import { z } from 'zod';

export const ProfessionalSchema = z.object({
  descripcion: z.string().optional().nullable(),
  especialidad: z.string().optional().nullable(),
  experiencia: z.string().optional().nullable(),
  portadaUrl: z.string().url().optional().nullable(),
  ratingPromedio: z.number().optional().nullable(),
  fechaActualizacion: z.string().datetime().optional().nullable(),
});

export const UbicationSchema = z.object({
  id: z.number(),
  nombreUbicacion: z.string().optional().nullable(),
  ciudad: z.string().optional().nullable(),
  direccion: z.string().optional().nullable(),
  tipo: z.string().optional().nullable(),
  principal: z.boolean().optional(),
  activa: z.boolean().optional(),
});

export const ProfessionalProfileResponseSchema = z.object({
  id: z.number(),
  nombre: z.string(),
  apellido: z.string().nullable(),
  email: z.string().email(),
  avatarUrl: z.string().url().nullable().optional(),
  rol: z.string().nullable(),

  profesional: ProfessionalSchema.nullable(),

  ubicaciones: z.array(UbicationSchema),
});

export type ProfessionalProfileResponse = z.infer<typeof ProfessionalProfileResponseSchema>;
