import { crearCheckoutPatron } from '../../utils/lemonsqueezy'
import { supabaseAdmin } from '../../utils/admin'

// Crea un checkout de Lemon Squeezy para comprar UN patrón.
// Compra como invitada: solo requiere el correo. Body: { patronId, email }
export default defineEventHandler(async (event) => {
  const { patronId, email } = await readBody<{ patronId?: string; email?: string }>(event)

  if (!patronId) throw createError({ statusCode: 400, statusMessage: 'Falta el patrón' })
  if (!email || !/.+@.+\..+/.test(email)) {
    throw createError({ statusCode: 400, statusMessage: 'Correo no válido' })
  }

  // Lee el patrón con service_role (precio/estado confiables, no del cliente).
  const db = supabaseAdmin()
  const { data: patron, error } = await db
    .from('patrones')
    .select('id, titulo, precio, precio_descuento, estado')
    .eq('id', patronId)
    .maybeSingle()

  if (error || !patron) throw createError({ statusCode: 404, statusMessage: 'Patrón no encontrado' })
  if (patron.estado !== 'publicado' && patron.estado !== 'preventa') {
    throw createError({ statusCode: 400, statusMessage: 'Este patrón no está a la venta' })
  }

  const precio = patron.precio_descuento ?? patron.precio
  const precioCentavos = Math.round(Number(precio) * 100)
  if (!precioCentavos || precioCentavos <= 0) {
    throw createError({ statusCode: 400, statusMessage: 'Precio no válido' })
  }

  const origin = getRequestURL(event).origin
  const url = await crearCheckoutPatron({
    patronId: patron.id,
    email: email.trim().toLowerCase(),
    precioCentavos,
    nombre: patron.titulo,
    redirectUrl: `${origin}/tienda-de-patrones/gracias`,
  })

  return { url }
})
