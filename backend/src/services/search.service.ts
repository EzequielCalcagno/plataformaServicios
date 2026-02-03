// src/services/search.service.ts
import { searchServiciosRepository } from '../repositories/search.repository';
import { getUsersBasicByIdsRepository } from '../repositories/users.repository';

export const searchServiciosService = async (input: {
  lat: number;
  lng: number;
  q?: string;
  radiusKm?: number;
  limit?: number;
  offset?: number;
}) => {
  const rows: any[] = await searchServiciosRepository(input);

  // Detectar el id del profesional aunque tu RPC use distintos nombres
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
    new Set(
      rows
        .map(getProfessionalIdFromRow)
        .filter((id): id is string => !!id),
    ),
  );

  const users = await getUsersBasicByIdsRepository(ids);

  const usersMap = new Map(
    users.map((u: any) => [
      String(u.id),
      {
        fullName: `${u.nombre ?? ''} ${u.apellido ?? ''}`.trim(),
        foto_url: u.foto_url ?? null,
      },
    ]),
  );

  return rows.map((row) => {
    const professionalId = getProfessionalIdFromRow(row);
    const u = professionalId ? usersMap.get(professionalId) : null;

    return {
      ...row,
      photoUrl: row.photoUrl ?? u?.foto_url ?? null, // ✅ listo para el front
      professionalPhotoUrl: row.professionalPhotoUrl ?? u?.foto_url ?? null,
      professionalName: row.professionalName ?? u?.fullName ?? null,
    };
  });
};
