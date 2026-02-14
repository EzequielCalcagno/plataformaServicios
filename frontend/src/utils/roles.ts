// src/utils/roles.ts
type Role = 'professional' | 'client';

const mapRolFromId = (id_rol?: number): Role => {
  if (id_rol === 2) return 'professional';
  return 'client';
};

export { mapRolFromId, Role };