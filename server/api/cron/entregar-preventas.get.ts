import { supabaseAdmin } from '../../utils/admin'
import { entregarCompra } from '../../utils/patrones'

// Cron diario (Vercel): entrega los patrones de preventa cuyo día de
// lanzamiento ya llegó. Protegido con CRON_SECRET (Vercel lo manda como
// Authorization: Bearer <CRON_SECRET>).
export default defineEventHandler(async (event) => {
  const c = useRuntimeConfig()
  const secret = c.cronSecret as string
  if (secret) {
    const auth = getHeader(event, 'authorization')
    if (auth !== `Bearer ${secret}`) {
      throw createError({ statusCode: 401, statusMessage: 'No autorizado' })
    }
  }

  const hoy = new Date().toISOString().slice(0, 10)
  const db = supabaseAdmin()

  // Compras de preventa pagadas pero aún no entregadas, con su patrón.
  const { data: compras, error } = await db
    .from('compras_patron')
    .select('id, email, token, patron:patron_id(titulo, fecha_lanzamiento, thumbnail_path)')
    .eq('es_preventa', true)
    .eq('estado', 'pagada')
  if (error) throw createError({ statusCode: 500, statusMessage: error.message })

  let entregadas = 0
  for (const compra of compras ?? []) {
    const patron = (compra as any).patron
    if (!patron?.fecha_lanzamiento || patron.fecha_lanzamiento > hoy) continue
    await entregarCompra(db, compra as any, patron)
    entregadas += 1
  }

  return { ok: true, revisadas: compras?.length ?? 0, entregadas }
})
