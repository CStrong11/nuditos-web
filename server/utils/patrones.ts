import type { SupabaseClient } from '@supabase/supabase-js'
import { correoEntrega } from './correos'

/// ¿El patrón debe entregarse ya? (no preventa, o la fecha ya llegó)
export function debeEntregarseYa(patron: { estado: string; fecha_lanzamiento: string | null }): boolean {
  if (patron.estado !== 'preventa') return true
  if (!patron.fecha_lanzamiento) return false
  // fecha_lanzamiento es una fecha (YYYY-MM-DD); se entrega ese día o después.
  return patron.fecha_lanzamiento <= new Date().toISOString().slice(0, 10)
}

/// Marca la compra como entregada y envía el correo con el enlace de descarga.
export async function entregarCompra(
  db: SupabaseClient,
  compra: { id: string; email: string; token: string },
  patron: { titulo: string },
): Promise<void> {
  const c = useRuntimeConfig()
  const base = c.public.sitioUrl as string
  const descargaUrl = `${base}/descargar/${compra.token}`

  const { subject, html } = correoEntrega({ titulo: patron.titulo, descargaUrl })
  const ok = await enviarCorreo({ to: compra.email, subject, html })

  await db.from('compras_patron').update({
    estado: 'entregada',
    entregado_en: new Date().toISOString(),
  }).eq('id', compra.id)

  if (!ok) console.error('Patrón entregado pero el correo falló para la compra', compra.id)
}
