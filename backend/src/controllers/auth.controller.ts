import { Request, Response } from 'express';
import { loginService, registerService } from '../services/auth.service';

export const Login = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  try {
    const token = await loginService(email, password);
    return res.status(200).json({ token });
  } catch (error) {
    console.error('❌ Error en controller:', error);
    return res.status(401).json({ error: 'Credenciales inválidas' });
  }
};

export const Register = async (req: Request, res: Response) => {
  const { email, password, rol } = req.body;
  try {
    await registerService(email, password, rol);
    return res.status(201).json({ message: 'Usuario registrado exitosamente' });
  } catch (error) {
    console.error('❌ Error en controller:', error);
    return res.status(500).json({ error: 'Error al registrar usuario' });
  }
};
