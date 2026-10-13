import { firmaValida, planDeVariant } from '../../utils/lemonsqueezy'
import { supabaseAdmin } from '../../utils/admin'
import { debeEntregarseYa, entregarCompra, thumbnailUrl } from '../../utils/patrones'
import { correoPreventa, enviarCorreo } from '../../utils/correos'

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

  // =====================================================================
  // TIENDA DE PATRONES (pago único). Se distingue por custom.tipo='patron'.
  // =====================================================================
  if (eventName === 'order_created' && custom?.tipo === 'patron') {
    const orderId = String(dataId)
    const patronId = String(custom.patron_id)
    const email: string = (attrs.user_email || '').toLowerCase()

    // Idempotencia: si ya registramos esta orden, no la dupliques.
    const { data: existente } = await db
      .from('compras_patron').select('id').eq('ls_order_id', orderId).maybeSingle()
    if (existente) return { ok: true, nota: 'orden ya procesada' }

    const { data: patron } = await db
      .from('patrones').select('titulo, estado, fecha_lanzamiento, thumbnail_path').eq('id', patronId).maybeSingle()
    if (!patron) return { ok: true, nota: 'patrón no encontrado' }

    // Vincula a una cuenta si existe una con ese correo (para redescargas).
    let userId: string | null = null
    if (email) {
      const { data } = await db.rpc('user_id_por_email', { p_email: email })
      if (data) userId = data as string
    }

    const entregaYa = debeEntregarseYa(patron)
    const { data: compra, error: insErr } = await db.from('compras_patron').insert({
      patron_id: patronId,
      email,
      user_id: userId,
      estado: 'pagada',
      es_preventa: patron.estado === 'preventa' && !entregaYa,
      ls_order_id: orderId,
      monto: typeof attrs.total === 'number' ? attrs.total / 100 : null,
      moneda: attrs.currency ?? 'USD',
    }).select('id, email, token').single()

    if (insErr || !compra) {
      console.error('No se pudo registrar la compra del patrón', insErr)
      return { ok: false }
    }

    if (entregaYa) {
      await entregarCompra(db, compra, patron)
    } else {
      // Preventa: confirma la compra; el PDF se envía el día del lanzamiento (cron).
      const { subject, html } = correoPreventa({
        titulo: patron.titulo,
        fecha: patron.fecha_lanzamiento!,
        thumbnailUrl: thumbnailUrl(db, patron.thumbnail_path),
      })
      await enviarCorreo({ to: compra.email, subject, html })
    }

    return { ok: true }
  }

  // Reembolso de una compra de patrón.
  if (eventName === 'order_refunded' && custom?.tipo === 'patron') {
    await db.from('compras_patron').update({ estado: 'reembolsada' }).eq('ls_order_id', String(dataId))
    return { ok: true }
  }

  // Resuelve el user_id en cascada: custom_data -> suscripción guardada -> email.
  async function resolverUsuario(subscriptionId?: string | null, email?: string | null): Promise<string | null> {
    if (custom?.user_id) return custom.user_id as string
    if (subscriptionId) {
      const { data } = await db
        .from('suscripciones')
        .select('user_id')
        .eq('ls_subscription_id', String(subscriptionId))
        .maybeSingle()
      if (data?.user_id) return data.user_id
    }
    if (email) {
      const { data } = await db.rpc('user_id_por_email', { p_email: email })
      if (data) return data as string
    }
    return null
  }

  // ---- Eventos de suscripción ----
  if (eventName.startsWith('subscription_') && !eventName.startsWith('subscription_payment')) {
    const subscriptionId = String(dataId)
    const userId = await resolverUsuario(subscriptionId, attrs.user_email)
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
    const userId = await resolverUsuario(subscriptionId, attrs.user_email)
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
