import { serverSupabaseUser } from '#supabase/server'
import { crearCheckout, variantDePlan } from '../utils/lemonsqueezy'

// Crea un checkout de Lemon Squeezy para el usuario autenticado.
// Body: { plan: 'mensual' | 'trimestral' | 'semestral' | 'anual' }
export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event).catch(() => null)
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'No autenticado' })
  }

  const { plan } = await readBody<{ plan?: string }>(event)
  const variantId = plan ? variantDePlan(plan) : undefined
  if (!variantId) {
    throw createError({ statusCode: 400, statusMessage: 'Plan no válido o no configurado' })
  }

  const origin = getRequestURL(event).origin
  const url = await crearCheckout({
    variantId,
    userId: user.id,
    email: user.email,
    redirectUrl: `${origin}/plan?estado=procesando`,
  })

  return { url }
})
