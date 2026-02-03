// src/controllers/auth.controller.ts
import { Request, Response } from 'express';
import { loginService, registerService } from '../services/auth.service';
import { mapRolToRoleKey } from '../constants/roles';

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    const token = await loginService(email, password);
    return res.status(200).json({ token });
  } catch (error: any) {
    console.error('❌ Error en login controller:', error);

    // ✅ Solo esto es 401
    if (error?.message === 'INVALID_CREDENTIALS') {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // ✅ El resto es error real del backend
    return res.status(500).json({ error: 'Error interno en login' });
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
    console.error('❌ Error en register controller:', error);

    if (error?.message === 'EMAIL_ALREADY_REGISTERED') {
      return res.status(409).json({ error: 'El email ya está registrado' });
    }

    return res.status(500).json({ error: 'Error al registrar usuario' });
  }
};
