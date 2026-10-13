import type { SupabaseClient } from '@supabase/supabase-js'
import { correoEntrega, correoPreventa, enviarCorreo } from './correos'

/// ¿El patrón debe entregarse ya? (no preventa, o la fecha ya llegó)
export function debeEntregarseYa(patron: { estado: string; fecha_lanzamiento: string | null }): boolean {
  if (patron.estado !== 'preventa') return true
  if (!patron.fecha_lanzamiento) return false
  // fecha_lanzamiento es una fecha (YYYY-MM-DD); se entrega ese día o después.
  return patron.fecha_lanzamiento <= new Date().toISOString().slice(0, 10)
}

/// URL pública del thumbnail de un patrón (bucket público), o null.
export function thumbnailUrl(db: SupabaseClient, path?: string | null): string | null {
  if (!path) return null
  return db.storage.from('patrones-thumbs').getPublicUrl(path).data.publicUrl
}

/// Marca la compra como entregada y envía el correo con el enlace de descarga.
export async function entregarCompra(
  db: SupabaseClient,
  compra: { id: string; email: string; token: string },
  patron: { titulo: string; thumbnail_path?: string | null },
): Promise<void> {
  const c = useRuntimeConfig()
  const base = c.public.sitioUrl as string
  const descargaUrl = `${base}/descargar/${compra.token}`

  const { subject, html } = correoEntrega({
    titulo: patron.titulo,
    descargaUrl,
    thumbnailUrl: thumbnailUrl(db, patron.thumbnail_path),
  })
  const ok = await enviarCorreo({ to: compra.email, subject, html })

  await db.from('compras_patron').update({
    estado: 'entregada',
    entregado_en: new Date().toISOString(),
  }).eq('id', compra.id)

  if (!ok) console.error('Patrón entregado pero el correo falló para la compra', compra.id)
}

/// Registra una compra de patrón y la entrega (o agenda si es preventa).
/// Sirve tanto para compras pagadas (webhook de Lemon, con lsOrderId) como
/// para patrones gratis (sin lsOrderId). Idempotente.
export async function procesarCompraPatron(
  db: SupabaseClient,
  opts: { patronId: string; email: string; lsOrderId?: string | null; monto?: number | null; moneda?: string },
): Promise<{ ok: boolean; nota?: string }> {
  const email = (opts.email || '').toLowerCase()

  // Idempotencia de pagos: si ya registramos esta orden de Lemon, salir.
  if (opts.lsOrderId) {
    const { data: ex } = await db
      .from('compras_patron').select('id').eq('ls_order_id', opts.lsOrderId).maybeSingle()
    if (ex) return { ok: true, nota: 'orden ya procesada' }
  }

  const { data: patron } = await db
    .from('patrones').select('titulo, estado, fecha_lanzamiento, thumbnail_path').eq('id', opts.patronId).maybeSingle()
  if (!patron) return { ok: true, nota: 'patrón no encontrado' }

  const entregaYa = debeEntregarseYa(patron)

  // Gratis: reusar una compra previa de ese correo+patrón (evita duplicados y
  // spam). Si corresponde, reenvía el enlace.
  if (!opts.lsOrderId) {
    const { data: previa } = await db
      .from('compras_patron')
      .select('id, email, token, estado')
      .eq('patron_id', opts.patronId).eq('email', email).neq('estado', 'reembolsada')
      .maybeSingle()
    if (previa) {
      if (entregaYa) await entregarCompra(db, previa as any, patron)
      return { ok: true, nota: 'reenviado' }
    }
  }

  // Vincula a una cuenta si existe una con ese correo (para redescargas).
  let userId: string | null = null
  if (email) {
    const { data } = await db.rpc('user_id_por_email', { p_email: email })
    if (data) userId = data as string
  }

  const { data: compra, error } = await db.from('compras_patron').insert({
    patron_id: opts.patronId,
    email,
    user_id: userId,
    estado: 'pagada',
    es_preventa: patron.estado === 'preventa' && !entregaYa,
    ls_order_id: opts.lsOrderId ?? null,
    monto: opts.monto ?? 0,
    moneda: opts.moneda ?? 'USD',
  }).select('id, email, token').single()

  if (error || !compra) {
    console.error('No se pudo registrar la compra del patrón', error)
    return { ok: false }
  }

  if (entregaYa) {
    await entregarCompra(db, compra, patron)
  } else {
    const { subject, html } = correoPreventa({
      titulo: patron.titulo,
      fecha: patron.fecha_lanzamiento!,
      thumbnailUrl: thumbnailUrl(db, patron.thumbnail_path),
    })
    await enviarCorreo({ to: compra.email, subject, html })
  }
  return { ok: true }
}
