import { createClient } from '@supabase/supabase-js';

// Verificar que las variables existan
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const serviceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

// Mensaje de error más descriptivo
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Error: Variables de entorno de Supabase no configuradas');
  console.error('📝 Asegúrate de tener un archivo .env con:');
  console.error('   VITE_SUPABASE_URL=tu-url');
  console.error('   VITE_SUPABASE_ANON_KEY=tu-clave');
  console.error('📂 El archivo .env debe estar en la raíz del proyecto');

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

const createBaseClient = (key, options = {}) => createClient(supabaseUrl, key, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storageKey: 'dash-hotel-auth',
    ...options.auth,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// Clase Singleton para la conexión a Supabase
class SupabaseClient {
  static instance = null;

  constructor() {
    if (SupabaseClient.instance) {
      return SupabaseClient.instance;
    }

    console.log('🔌 Conectando a Supabase...');

    this.client = createBaseClient(supabaseAnonKey);
    this.adminClient = serviceRoleKey
      ? createBaseClient(serviceRoleKey, {
          auth: {
            persistSession: false,
            autoRefreshToken: false,
          },
        })
      : null;

    console.log('✅ Supabase conectado correctamente');
    SupabaseClient.instance = this;
  }

  getClient() {
    return this.client;
  }

  getAdminClient() {
    return this.adminClient;
  }

  static getInstance() {
    if (!SupabaseClient.instance) {
      SupabaseClient.instance = new SupabaseClient();
    }
    return SupabaseClient.instance;
  }
}

export const createSupabaseAdminClient = () => {
  if (!serviceRoleKey) return null;
  return createBaseClient(serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
};

export default SupabaseClient;