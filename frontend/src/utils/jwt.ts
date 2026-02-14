// src/utils/jwt.ts

// Payload del JWT tal como lo usamos en la app/backend
export interface JwtPayload {
  id?: string | number;   
  sub?: string;          
  email?: string;
  rolId?: number;
  iat?: number;
  exp?: number;
}

// helper para decodificar el payload del JWT (sin libs extra)
export const decodeJwtPayload = (token: string): JwtPayload | null => {
  try {
    const [, payload] = token.split('.');
    if (!payload) return null;

    // React Native a veces no trae atob, podés instalar "base-64" si hace falta
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const decoded =
      typeof atob === 'function'
        ? atob(base64)
        : Buffer.from(base64, 'base64').toString('utf8');

    return JSON.parse(decoded) as JwtPayload;
  } catch {
    return null;
  }
};
