import supabase from '../config/db';

export const getAllUsuariosRepository = async () => {
  const { data, error } = await supabase.from('usuarios').select('*');
  if (error) throw error;
  return data;
};

export const getUsuarioByIdRepository = async (id: number) => {
  const { data, error } = await supabase.from('usuarios').select('*').eq('id', id).single();
  if (error) {
    if (error.code === 'PGRST116') {
      // No se encontró el usuario
      return null;
    }
    throw error;
  }
  return data;
};
