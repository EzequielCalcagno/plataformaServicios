import { z } from 'zod';

export const ReservationStatusSchema = z.enum([
  'PENDIENTE',
  'EN_NEGOCIACION',
  'EN_PROCESO',
  'FINALIZADO',
  'CERRADO',
  'CANCELADO',
]);

export type ReservationStatus = z.infer<typeof ReservationStatusSchema>;

export const CreateReservationSchema = z.object({
  servicioId: z.number().int().positive(),
  descripcionCliente: z.string().trim().min(1).max(2000).optional(),
  fechaHoraSolicitada: z
    .string()
    .datetime()
    .optional()
    .nullable(), // ISO string
});

export const ProAcceptReservationSchema = z.object({}); // no body

export const ProProposeSchema = z.object({
  fechaHoraPropuesta: z.string().datetime(),
  mensajePropuesta: z.string().trim().min(1).max(2000).optional(),
});

export const ProCancelSchema = z.object({
  motivo: z.string().trim().min(1).max(2000).optional(),
});

export const ProFinishSchema = z.object({}); // no body

export const ClientAcceptProposalSchema = z.object({}); // no body

export const ClientRejectProposalSchema = z.object({
  mensaje: z.string().trim().min(1).max(2000).optional(),
});

/**
 * Respuesta “normalizada” para FE (lo que vas a listar en tabs)
 */
export const ReservationDtoSchema = z.object({
  id: z.number(),
  servicioId: z.number(),
  profesionalId: z.string(),
  clienteId: z.string(),

  estado: ReservationStatusSchema,

  descripcionCliente: z.string().nullable().optional(),
  fechaHoraSolicitada: z.string().nullable().optional(),

  fechaHoraPropuesta: z.string().nullable().optional(),
  mensajePropuesta: z.string().nullable().optional(),

  accionRequeridaPor: z.enum(['CLIENTE', 'PROFESIONAL']).nullable().optional(),

  // timestamps pueden no venir según cómo armes el objeto (o venir null)
  creadoEn: z.string().nullable().optional(),
  actualizadoEn: z.string().nullable().optional(),

  // Para UI (pueden faltar por joins)
  servicioTitulo: z.string().nullable().optional(),
  servicioCategoria: z.string().nullable().optional(),

  profesionalNombre: z.string().nullable().optional(),
  profesionalApellido: z.string().nullable().optional(),
  profesionalFotoUrl: z.string().nullable().optional(),

  clienteNombre: z.string().nullable().optional(),
  clienteApellido: z.string().nullable().optional(),
  clienteFotoUrl: z.string().nullable().optional(),

  profesionalTelefono: z.string().nullable().optional(),
  clienteTelefono: z.string().nullable().optional(),
  servicioPrecioBase: z.number().nullable(),
});
export const RequesterFinishSchema = z.object({}); // no body
export const ConfirmFinishSchema = z.object({});   // no body
export const RejectFinishSchema = z.object({
  mensaje: z.string().trim().min(1).max(2000).optional(),
});

export type ReservationDto = z.infer<typeof ReservationDtoSchema>;
