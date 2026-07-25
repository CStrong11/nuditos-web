import { firmaValida, planDeVariant } from '../../utils/lemonsqueezy'
import { supabaseAdmin } from '../../utils/admin'

// Recibe los eventos de Lemon Squeezy, verifica la firma y actualiza
// `suscripciones` / `pagos` usando la service_role key.
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const raw = (await readRawBody(event, 'utf8')) || ''
  const firma = getHeader(event, 'x-signature')

  if (!firmaValida(raw, firma, config.lemonsqueezyWebhookSecret as string)) {
    throw createError({ statusCode: 401, statusMessage: 'Firma inválida' })
  }

  const payload = JSON.parse(raw)
  const eventName: string = payload?.meta?.event_name ?? ''
  const custom = payload?.meta?.custom_data ?? {}
  const attrs = payload?.data?.attributes ?? {}
  const dataId = payload?.data?.id
  const db = supabaseAdmin()

  // Resuelve el user_id: primero por custom_data, luego por la suscripción guardada.
  async function resolverUsuario(subscriptionId?: string | null): Promise<string | null> {
    if (custom?.user_id) return custom.user_id as string
    if (subscriptionId) {
      const { data } = await db
        .from('suscripciones')
        .select('user_id')
        .eq('ls_subscription_id', String(subscriptionId))
        .maybeSingle()
      if (data?.user_id) return data.user_id
    }
    return null
  }

  // ---- Eventos de suscripción ----
  if (eventName.startsWith('subscription_') && !eventName.startsWith('subscription_payment')) {
    const subscriptionId = String(dataId)
    const userId = await resolverUsuario(subscriptionId)
    if (!userId) return { ok: true, nota: 'usuario no resuelto' }

    const status: string = attrs.status ?? ''
    const plan = planDeVariant(attrs.variant_id)
    const periodoFin: string | null = attrs.ends_at ?? attrs.renews_at ?? null

    let estado: string
    if (status === 'cancelled') estado = 'cancelada'
    else if (['expired', 'unpaid', 'paused'].includes(status)) estado = 'vencida'
    else estado = 'activa' // active, on_trial, past_due

    // No degradar a quienes tienen vitalicia (embajadoras).
    const { data: actual } = await db
      .from('suscripciones')
      .select('estado')
      .eq('user_id', userId)
      .maybeSingle()
    if (actual?.estado === 'vitalicia') estado = 'vitalicia'

    await db.from('suscripciones').upsert({
      user_id: userId,
      estado,
      plan,
      periodo_termina_en: periodoFin,
      ls_subscription_id: subscriptionId,
      ls_customer_id: attrs.customer_id ? String(attrs.customer_id) : null,
      ls_variant_id: attrs.variant_id ? String(attrs.variant_id) : null,
      actualizado_en: new Date().toISOString(),
    }, { onConflict: 'user_id' })

    return { ok: true }
  }

  // ---- Pagos (facturas de suscripción) ----
  if (eventName === 'subscription_payment_success' || eventName === 'subscription_payment_failed') {
    const subscriptionId = attrs.subscription_id ? String(attrs.subscription_id) : null
    const userId = await resolverUsuario(subscriptionId)
    if (!userId) return { ok: true, nota: 'usuario no resuelto' }

    await db.from('pagos').insert({
      user_id: userId,
      ls_subscription_id: subscriptionId,
      monto: typeof attrs.total === 'number' ? attrs.total / 100 : null,
      moneda: attrs.currency ?? 'USD',
      plan: planDeVariant(attrs.variant_id),
      estado: eventName === 'subscription_payment_success' ? 'paid' : 'failed',
      invoice_url: attrs?.urls?.invoice_url ?? null,
    })

    return { ok: true }
  }

  return { ok: true, nota: `evento ignorado: ${eventName}` }
})
