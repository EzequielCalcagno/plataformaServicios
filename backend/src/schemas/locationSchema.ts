import { z } from 'zod';

export const LocationSchema = z.object({
  id: z.number(),
  nombreUbicacion: z.string().optional().nullable(),
  ciudad: z.string().optional().nullable(),
  direccion: z.string().optional().nullable(),
  tipo: z.string().optional().nullable(),
  principal: z.boolean().optional(),
  coordenadas: z.any().nullable().optional(),
  activa: z.boolean().optional(),
});