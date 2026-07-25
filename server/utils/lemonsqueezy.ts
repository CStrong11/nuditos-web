import { createHmac, timingSafeEqual } from 'node:crypto'

const API = 'https://api.lemonsqueezy.com/v1'

/// Mapea el id de plan a su variant_id de Lemon Squeezy (desde env).
export function variantDePlan(plan: string): string | undefined {
  const c = useRuntimeConfig()
  const mapa: Record<string, string> = {
    mensual: c.lemonsqueezyVariantMensual as string,
    trimestral: c.lemonsqueezyVariantTrimestral as string,
    semestral: c.lemonsqueezyVariantSemestral as string,
    anual: c.lemonsqueezyVariantAnual as string,
  }
  return mapa[plan] || undefined
}

/// Reverso: dado un variant_id (que llega en el webhook), devuelve el plan.
export function planDeVariant(variantId?: string | number | null): string | null {
  if (variantId == null) return null
  const c = useRuntimeConfig()
  const v = String(variantId)
  if (v === String(c.lemonsqueezyVariantMensual)) return 'mensual'
  if (v === String(c.lemonsqueezyVariantTrimestral)) return 'trimestral'
  if (v === String(c.lemonsqueezyVariantSemestral)) return 'semestral'
  if (v === String(c.lemonsqueezyVariantAnual)) return 'anual'
  return null
}

/// Crea un checkout en Lemon Squeezy y devuelve la URL de pago.
export async function crearCheckout(opts: {
  variantId: string
  userId: string
  email?: string
  redirectUrl: string
}): Promise<string> {
  const c = useRuntimeConfig()
  const body = {
    data: {
      type: 'checkouts',
      attributes: {
        checkout_data: {
          email: opts.email || undefined,
          custom: { user_id: opts.userId },
        },
        product_options: {
          redirect_url: opts.redirectUrl,
        },
      },
      relationships: {
        store: { data: { type: 'stores', id: String(c.lemonsqueezyStoreId) } },
        variant: { data: { type: 'variants', id: String(opts.variantId) } },
      },
    },
  }

  const res = await $fetch<any>(`${API}/checkouts`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${c.lemonsqueezyApiKey}`,
      'Content-Type': 'application/vnd.api+json',
      Accept: 'application/vnd.api+json',
    },
    body,
  })
  const url = res?.data?.attributes?.url
  if (!url) throw new Error('Lemon Squeezy no devolvió URL de checkout')
  return url
}

/// Verifica la firma X-Signature del webhook (HMAC-SHA256 del cuerpo crudo).
export function firmaValida(rawBody: string, firma: string | undefined, secret: string): boolean {
  if (!firma || !secret) return false
  const esperado = createHmac('sha256', secret).update(rawBody).digest('hex')
  const a = Buffer.from(esperado, 'utf8')
  const b = Buffer.from(firma, 'utf8')
  if (a.length !== b.length) return false
  return timingSafeEqual(a, b)
}
