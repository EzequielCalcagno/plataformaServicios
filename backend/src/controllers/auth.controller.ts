// src/controllers/auth.controller.ts
import { Request, Response } from 'express';
// Services
import { loginService, registerService } from '../services/auth.service';
// Constants
import { mapRolToRoleKey } from '../constants/roles';

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  try {
    const token = await loginService(email, password);
    return res.status(200).json({ token });
  } catch (error) {
    console.error('❌ Error en controller:', error);
    return res.status(401).json({ error: 'Credenciales inválidas' });
  }
};

export const register = async (req: Request, res: Response) => {
  const { email, password, nombre, apellido, telefono } = req.body;

  try {
    const rolCode = mapRolToRoleKey('CLIENTE');

    await registerService({
      email,
      password,
      rolCode,
      nombre,
      apellido,
      telefono,
    });

    return res.status(201).json({ message: 'Usuario registrado exitosamente' });
  } catch (error: any) {
    console.error('❌ Error en controller:', error);

    if (error.message === 'El email ya está registrado') {
      return res.status(409).json({ error: error.message });
    }

    return res.status(500).json({ error: 'Error al registrar usuario' });
  }
};
