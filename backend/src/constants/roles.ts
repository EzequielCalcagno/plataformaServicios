// src/constants/roles.ts

export const ROLES = {
  CLIENTE: {
    id: 1,
    nombre: 'cliente' as const,
  },
  PROFESIONAL: {
    id: 2,
    nombre: 'profesional' as const,
  },
  ADMIN: {
    id: 3,
    nombre: 'admin' as const,
  },
} as const;

export type RoleKey = keyof typeof ROLES; // 'CLIENTE' | 'PROFESIONAL' | 'ADMIN'
export type RoleId = (typeof ROLES)[RoleKey]['id']; // 1 | 2 | 3
export type RoleName = (typeof ROLES)[RoleKey]['nombre']; // 'cliente' | 'profesional' | 'admin'

const mapRolToRoleKey = (rol?: string): RoleKey => {
  switch ((rol || '').toLowerCase()) {
    case 'cliente':
      return 'CLIENTE';
    case 'profesional':
      return 'PROFESIONAL';
    case 'admin':
      return 'ADMIN';
    default:
      return 'CLIENTE';
  }
};

export { mapRolToRoleKey };
