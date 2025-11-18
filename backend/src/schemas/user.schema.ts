import { z } from 'zod';

export const UserSchema = z.object({
  id: z.number().int().optional(), // SERIAL PRIMARY KEY

  nombre: z.string().min(1, 'El nombre es obligatorio').max(100, 'Máximo 100 caracteres'),

  apellido: z.string().max(100, 'Máximo 100 caracteres').optional().nullable(),

  email: z.string().email('Email inválido').max(150),

  contrasena_hash: z.string().min(1, 'El hash de contraseña es obligatorio'),

  telefono: z.string().max(20).optional().nullable(),

  foto_url: z.string().url('Debe ser una URL válida').optional().nullable(),

  tipo_autenticacion: z.enum(['local', 'google', 'facebook']).default('local'),

  verificado: z.boolean().default(false),

  fecha_registro: z.string().datetime().optional(),

  id_rol: z.number().int().nullable().optional(),

  activo: z.boolean().default(true),

  ultimo_login: z.string().datetime().optional().nullable(),

  ip_ultimo_login: z.string().max(45).optional().nullable(),
});

// Esquema para crear usuario (sin campos autogenerados)
export const CrearUsuarioSchema = UserSchema.omit({
  id: true,
  fecha_registro: true,
  ultimo_login: true,
  ip_ultimo_login: true,
});

// Esquema para actualizar usuario (todo opcional)
export const ActualizarUsuarioSchema = UserSchema.partial();

export type User = z.infer<typeof UserSchema>;
