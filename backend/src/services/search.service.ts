import { searchServiciosRepository } from '../repositories/search.repository';
import { getUsersBasicByIdsRepository } from '../repositories/users.repository';

export const searchServiciosService = async (input: {
  lat: number;
  lng: number;
  q?: string;
  radiusKm?: number;
  limit?: number;
  offset?: number;

  category?: string | null;
  requesterId?: string | null;
  workedWith?: boolean;
}) => {
  const rows: any[] = await searchServiciosRepository(input);

  const getProfessionalIdFromRow = (row: any): string | null => {
    const candidates = [
      row?.profesional_id,
      row?.professional_id,
      row?.usuario_id,
      row?.user_id,
      row?.id_profesional,
      row?.id_usuario,
      row?.profesionalId,
      row?.userId,
    ];
    const found = candidates.find((v) => v !== undefined && v !== null && String(v).trim() !== '');
    return found ? String(found) : null;
  };

  const ids = Array.from(
    new Set(rows.map(getProfessionalIdFromRow).filter((id): id is string => !!id)),
  );

  const users = await getUsersBasicByIdsRepository(ids);

  const usersMap = new Map(
    users.map((u: any) => [
      String(u.id),
      {
        nombre: u.nombre ?? null,
        apellido: u.apellido ?? null,
        foto_url: u.foto_url ?? null,
      },
    ]),
  );

  return rows.map((row) => {
    const professionalId = getProfessionalIdFromRow(row);
    const u = professionalId ? usersMap.get(professionalId) : null;

    const profesionalNombre = row.profesional_nombre ?? row.profesionalNombre ?? u?.nombre ?? null;
    const profesionalApellido = row.profesional_apellido ?? row.profesionalApellido ?? u?.apellido ?? null;

    return {
      ...row,

      // normalizamos para el Front (Search.tsx ya lo lee)
      profesional_id: professionalId ?? row.profesional_id ?? null,
      profesional_nombre: profesionalNombre,
      profesional_apellido: profesionalApellido,

      photo_url: row.photo_url ?? u?.foto_url ?? null,
      photoUrl: row.photoUrl ?? u?.foto_url ?? null,
    };
  });
};
