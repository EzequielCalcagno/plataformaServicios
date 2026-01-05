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
  fechaHoraSolicitada: z.string().datetime().optional().nullable(), // ISO
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

export const RequesterFinishSchema = z.object({}); // no body
export const ConfirmFinishSchema = z.object({}); // no body
export const RejectFinishSchema = z.object({
  mensaje: z.string().trim().min(1).max(2000).optional(),
});

// ✅ calificación
export const RateReservationSchema = z.object({
  puntaje: z.number().int().min(1).max(5),
  comentario: z.string().trim().max(500).optional(),
});

/**
 * DTO para FE
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

  creadoEn: z.string().nullable().optional(),
  actualizadoEn: z.string().nullable().optional(),

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

  // ✅ precio base (mejor optional por compatibilidad)
  servicioPrecioBase: z.number().nullable().optional(),

  canceladoPor: z.enum(['CLIENTE', 'PROFESIONAL']).nullable().optional(),
  motivoCancelacion: z.string().nullable().optional(),

  clienteCalifico: z.boolean().optional(),
  profesionalCalifico: z.boolean().optional(),

  // ✅ ratings
  clientePuntaje: z.number().int().min(1).max(5).nullable().optional(),
  clienteComentario: z.string().nullable().optional(),
  profesionalPuntaje: z.number().int().min(1).max(5).nullable().optional(),
  profesionalComentario: z.string().nullable().optional(),

  canSeeRatings: z.boolean().optional(),
});

export type ReservationDto = z.infer<typeof ReservationDtoSchema>;
