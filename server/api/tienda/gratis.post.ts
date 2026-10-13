import { supabaseAdmin } from '../../utils/admin'
import { procesarCompraPatron } from '../../utils/patrones'

// Entrega de un patrón GRATIS: sin pasar por Lemon. La tejedora solo pone su
// correo y le enviamos el PDF (o lo agendamos si es preventa).
// Body: { patronId, email }
export default defineEventHandler(async (event) => {
  const { patronId, email } = await readBody<{ patronId?: string; email?: string }>(event)

  if (!patronId) throw createError({ statusCode: 400, statusMessage: 'Falta el patrón' })
  if (!email || !/.+@.+\..+/.test(email)) {
    throw createError({ statusCode: 400, statusMessage: 'Correo no válido' })
  }

  const db = supabaseAdmin()
  const { data: patron, error } = await db
    .from('patrones')
    .select('id, precio, precio_descuento, estado')
    .eq('id', patronId)
    .maybeSingle()

  if (error || !patron) throw createError({ statusCode: 404, statusMessage: 'Patrón no encontrado' })
  if (patron.estado !== 'publicado' && patron.estado !== 'preventa') {
    throw createError({ statusCode: 400, statusMessage: 'Este patrón no está disponible' })
  }

  // Solo aquí para patrones realmente gratis (precio efectivo 0). Los de pago
  // deben ir por /api/tienda/checkout.
  const efectivo = Number(patron.precio_descuento ?? patron.precio)
  if (efectivo > 0) throw createError({ statusCode: 400, statusMessage: 'Este patrón no es gratis' })

  const res = await procesarCompraPatron(db, {
    patronId: patron.id,
    email: email.trim().toLowerCase(),
    monto: 0,
    moneda: 'USD',
  })
  if (!res.ok) throw createError({ statusCode: 500, statusMessage: 'No se pudo entregar el patrón' })

  return { ok: true }
})
