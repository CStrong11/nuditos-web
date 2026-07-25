import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// Cliente con la service_role key: se salta RLS. USAR SOLO EN EL SERVIDOR
// (webhook), nunca exponer al cliente.
let cliente: SupabaseClient | null = null

export function supabaseAdmin(): SupabaseClient {
  const config = useRuntimeConfig()
  const url = config.public.supabase.url as string
  const key = config.supabaseServiceKey as string
  if (!url || !key) {
    throw new Error('Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY')
  }
  if (!cliente) {
    cliente = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  }
  return cliente
}
