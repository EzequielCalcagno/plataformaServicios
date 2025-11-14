import supabase from '../config/db.js';

export const getAllUsuariosRepository = async () => {
  const { data, error } = await supabase.from('usuarios').select('*');
  if (error) throw error;
  return data;
};
