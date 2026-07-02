import { createClient } from '@supabase/supabase-js';

// Verificar que las variables existan
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Mensaje de error más descriptivo
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Error: Variables de entorno de Supabase no configuradas');
  console.error('📝 Asegúrate de tener un archivo .env con:');
  console.error('   VITE_SUPABASE_URL=tu-url');
  console.error('   VITE_SUPABASE_ANON_KEY=tu-clave');
  console.error('📂 El archivo .env debe estar en la raíz del proyecto');
  
  // En desarrollo, mostrar un error visual
  if (import.meta.env.DEV) {
    throw new Error(
      '⚠️ Faltan variables de entorno de Supabase.\n\n' +
      'Crea un archivo .env en la raíz del proyecto con:\n' +
      'VITE_SUPABASE_URL=tu-url\n' +
      'VITE_SUPABASE_ANON_KEY=tu-clave\n\n' +
      'Obtén las credenciales desde: https://supabase.com/dashboard'
    );
  }
}

// Clase Singleton para la conexión a Supabase
class SupabaseClient {
  static instance = null;

  constructor() {
    if (SupabaseClient.instance) {
      return SupabaseClient.instance;
    }

    console.log('🔌 Conectando a Supabase...');
    
    this.client = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        storageKey: 'dash-hotel-auth',
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    });

    console.log('✅ Supabase conectado correctamente');
    SupabaseClient.instance = this;
  }

  getClient() {
    return this.client;
  }

  static getInstance() {
    if (!SupabaseClient.instance) {
      SupabaseClient.instance = new SupabaseClient();
    }
    return SupabaseClient.instance;
  }
}

export default SupabaseClient;