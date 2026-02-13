// src/repositories/id.repository.ts
import db from '../config/db';

export const getNextClienteId = async () => {
  const { data, error } = await db.rpc('next_cliente_id');

  if (error) {
    console.error('❌ Error generando ID cliente:', error);
    throw error;
  }

  return data as string; // ej: "c_00001"
};

export const getNextProfesionalId = async () => {
  const { data, error } = await db.rpc('next_profesional_id');

  if (error) {
    console.error('❌ Error generando ID profesional:', error);
    throw error;
  }

  return data as string; 
};
