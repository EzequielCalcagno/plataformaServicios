// src/controllers/reservations.controller.ts
import { Request, Response } from 'express';
import {
  requesterAcceptProposalService,
  requesterRejectProposalService,
  getReservationByIdForUserService,
  createReservationService,
  listMyReservationsAsClienteService,
  listMyReservationsAsProfesionalService,
  profesionalAcceptReservationService,
  profesionalCancelService,
  profesionalFinishService,
  profesionalProposeService,
  requesterFinishService,
  confirmFinishService,
  rejectFinishService,
} from '../services/reservations.service';

function getAuthUserId(req: Request) {
  const u: any = (req as any).user;
  return String(u?.id ?? '');
}

export const createReservationController = async (req: Request, res: Response) => {
  try {
    const clienteId = getAuthUserId(req);
    if (!clienteId) return res.status(401).json({ error: 'No autenticado' });

    const created = await createReservationService(clienteId, req.body);
    return res.status(201).json(created);
  } catch (error: any) {
    console.error('❌ createReservationController:', error);
    return res.status(400).json({ error: error.message ?? 'Error al crear reserva' });
  }
};

export const getReservationByIdController = async (req: Request, res: Response) => {
  try {
    const userId = getAuthUserId(req);
    if (!userId) return res.status(401).json({ error: 'No autenticado' });

    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ error: 'ID inválido' });

    const dto = await getReservationByIdForUserService(userId, id);
    if (!dto) return res.status(404).json({ error: 'Reserva no encontrada' });

    return res.json(dto);
  } catch (error: any) {
    console.error('❌ getReservationByIdController:', error);
    return res.status(400).json({ error: error.message ?? 'Error obteniendo reserva' });
  }
};

export const listMyReservationsClienteController = async (req: Request, res: Response) => {
  try {
    const clienteId = getAuthUserId(req);
    if (!clienteId) return res.status(401).json({ error: 'No autenticado' });

    const tab = String(req.query.tab ?? 'waiting');
    const list = await listMyReservationsAsClienteService(clienteId, tab);
    return res.json({ results: list });
  } catch (error: any) {
    console.error('❌ listMyReservationsClienteController:', error);
    return res.status(400).json({ error: error.message ?? 'Error listando reservas' });
  }
};

export const listMyReservationsProfesionalController = async (req: Request, res: Response) => {
  try {
    const profesionalId = getAuthUserId(req);
    if (!profesionalId) return res.status(401).json({ error: 'No autenticado' });

    const tab = String(req.query.tab ?? 'pending');
    const list = await listMyReservationsAsProfesionalService(profesionalId, tab);
    return res.json({ results: list });
  } catch (error: any) {
    console.error('❌ listMyReservationsProfesionalController:', error);
    return res.status(400).json({ error: error.message ?? 'Error listando reservas' });
  }
};

export const profesionalAcceptReservationController = async (req: Request, res: Response) => {
  try {
    const profesionalId = getAuthUserId(req);
    if (!profesionalId) return res.status(401).json({ error: 'No autenticado' });

    const id = Number(req.params.id);
    const updated = await profesionalAcceptReservationService(profesionalId, id);
    return res.json(updated);
  } catch (error: any) {
    console.error('❌ profesionalAcceptReservationController:', error);
    return res.status(400).json({ error: error.message ?? 'Error aceptando' });
  }
};

export const profesionalProposeController = async (req: Request, res: Response) => {
  try {
    const profesionalId = getAuthUserId(req);
    if (!profesionalId) return res.status(401).json({ error: 'No autenticado' });

    const id = Number(req.params.id);
    const updated = await profesionalProposeService(profesionalId, id, req.body);
    return res.json(updated);
  } catch (error: any) {
    console.error('❌ profesionalProposeController:', error);
    return res.status(400).json({ error: error.message ?? 'Error negociando' });
  }
};

export const profesionalCancelController = async (req: Request, res: Response) => {
  try {
    const profesionalId = getAuthUserId(req);
    if (!profesionalId) return res.status(401).json({ error: 'No autenticado' });

    const id = Number(req.params.id);
    const updated = await profesionalCancelService(profesionalId, id, req.body);
    return res.json(updated);
  } catch (error: any) {
    console.error('❌ profesionalCancelController:', error);
    return res.status(400).json({ error: error.message ?? 'Error cancelando' });
  }
};

export const profesionalFinishController = async (req: Request, res: Response) => {
  try {
    const profesionalId = getAuthUserId(req);
    if (!profesionalId) return res.status(401).json({ error: 'No autenticado' });

    const id = Number(req.params.id);
    const updated = await profesionalFinishService(profesionalId, id, req.body);
    return res.json(updated);
  } catch (error: any) {
    console.error('❌ profesionalFinishController:', error);
    return res.status(400).json({ error: error.message ?? 'Error finalizando' });
  }
};

export const clientAcceptProposalController = async (req: Request, res: Response) => {
  try {
    const userId = getAuthUserId(req);
    if (!userId) return res.status(401).json({ error: 'No autenticado' });

    const id = Number(req.params.id);
    const updated = await requesterAcceptProposalService(userId, id);
    return res.json(updated);
  } catch (error: any) {
    console.error('❌ clientAcceptProposalController:', error);
    return res.status(400).json({ error: error.message ?? 'Error aceptando propuesta' });
  }
};

export const clientRejectProposalController = async (req: Request, res: Response) => {
  try {
    const userId = getAuthUserId(req);
    if (!userId) return res.status(401).json({ error: 'No autenticado' });

    const id = Number(req.params.id);
    const updated = await requesterRejectProposalService(userId, id, req.body);
    return res.json(updated);
  } catch (error: any) {
    console.error('❌ clientRejectProposalController:', error);
    return res.status(400).json({ error: error.message ?? 'Error rechazando propuesta' });
  }
};

export const requesterFinishController = async (req: Request, res: Response) => {
  try {
    const userId = getAuthUserId(req);
    if (!userId) return res.status(401).json({ error: 'No autenticado' });

    const id = Number(req.params.id);
    const updated = await requesterFinishService(userId, id);
    return res.json(updated);
  } catch (error: any) {
    console.error('❌ requesterFinishController:', error);
    return res.status(400).json({ error: error.message ?? 'Error finalizando' });
  }
};

export const confirmFinishController = async (req: Request, res: Response) => {
  try {
    const userId = getAuthUserId(req);
    if (!userId) return res.status(401).json({ error: 'No autenticado' });

    const id = Number(req.params.id);
    const updated = await confirmFinishService(userId, id);
    return res.json(updated);
  } catch (error: any) {
    console.error('❌ confirmFinishController:', error);
    return res.status(400).json({ error: error.message ?? 'Error confirmando' });
  }
};

export const rejectFinishController = async (req: Request, res: Response) => {
  try {
    const userId = getAuthUserId(req);
    if (!userId) return res.status(401).json({ error: 'No autenticado' });

    const id = Number(req.params.id);
    const updated = await rejectFinishService(userId, id, req.body);
    return res.json(updated);
  } catch (error: any) {
    console.error('❌ rejectFinishController:', error);
    return res.status(400).json({ error: error.message ?? 'Error rechazando' });
  }
};
