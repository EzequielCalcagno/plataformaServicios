// src/utils/roles.ts
type Role = 'professional' | 'client';

const mapRolFromId = (id_rol?: number): Role => {
  if (id_rol === 2) return 'professional';
  // por ahora todo lo demás lo tratamos como cliente
  return 'client';
};

export { mapRolFromId, Role };