import SupabaseClient from './supabaseClient';

// Obtener instancia única con manejo de errores
let supabase = null;
let supabaseAdmin = null;
try {
  const supabaseInstance = SupabaseClient.getInstance();
  supabase = supabaseInstance.getClient();
  supabaseAdmin = supabaseInstance.getAdminClient();
} catch (error) {
  console.error('❌ Error al inicializar Supabase:', error.message);
  if (import.meta.env.DEV) {
    console.warn('⚠️ Usando cliente dummy - las funciones no funcionarán');
  }
}

export default supabase;
export { supabase, supabaseAdmin, SupabaseClient };