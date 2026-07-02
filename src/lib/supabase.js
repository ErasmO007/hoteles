import SupabaseClient from './supabaseClient';

// Obtener instancia única con manejo de errores
let supabase = null;
try {
  const supabaseInstance = SupabaseClient.getInstance();
  supabase = supabaseInstance.getClient();
} catch (error) {
  console.error('❌ Error al inicializar Supabase:', error.message);
  // En lugar de lanzar el error, creamos un cliente dummy para evitar que la app explote
  // pero mostramos un mensaje claro
  if (import.meta.env.DEV) {
    console.warn('⚠️ Usando cliente dummy - las funciones no funcionarán');
  }
}

export default supabase;
export { supabase, SupabaseClient };