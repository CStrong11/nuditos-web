import { supabaseAdmin } from '../../utils/admin'

// Valida un token de compra y devuelve un enlace firmado y temporal al PDF.
// Body: { token }. Respuestas:
//   · { disponible:false, motivo, fecha? }  -> preventa pendiente / reembolsada / expirado
//   · { disponible:true, url, titulo }        -> listo para descargar
const DIAS_VALIDO = 7

export default defineEventHandler(async (event) => {
  const { token } = await readBody<{ token?: string }>(event)
  if (!token) throw createError({ statusCode: 400, statusMessage: 'Falta el token' })

  const db = supabaseAdmin()
  const { data: compra } = await db
    .from('compras_patron')
    .select('id, estado, es_preventa, comprado_en, entregado_en, descargas, patron_id')
    .eq('token', token)
    .maybeSingle()

  if (!compra) throw createError({ statusCode: 404, statusMessage: 'Compra no encontrada' })

  if (compra.estado === 'reembolsada') {
    return { disponible: false, motivo: 'Esta compra fue reembolsada.' }
  }

  const { data: patron } = await db
    .from('patrones').select('titulo, pdf_path, fecha_lanzamiento').eq('id', compra.patron_id).maybeSingle()
  if (!patron?.pdf_path) throw createError({ statusCode: 404, statusMessage: 'Patrón no disponible' })

  // Preventa aún no entregada.
  if (compra.es_preventa && compra.estado !== 'entregada') {
    return { disponible: false, motivo: 'preventa', fecha: patron.fecha_lanzamiento }
  }

  // Ventana de validez: 7 días desde la entrega (o la compra).
  const inicio = new Date(compra.entregado_en ?? compra.comprado_en).getTime()
  if (Date.now() - inicio > DIAS_VALIDO * 24 * 60 * 60 * 1000) {
    return { disponible: false, motivo: 'El enlace de descarga expiró. Escríbenos para reenviártelo.' }
  }

  // Enlace firmado de 1 hora al bucket privado.
  const { data: firmado, error } = await db.storage
    .from('patrones-pdf')
    .createSignedUrl(patron.pdf_path, 60 * 60, { download: `${patron.titulo}.pdf` })
  if (error || !firmado?.signedUrl) {
    throw createError({ statusCode: 500, statusMessage: 'No se pudo generar el enlace' })
  }

  await db.from('compras_patron').update({ descargas: (compra.descargas ?? 0) + 1 }).eq('id', compra.id)

  return { disponible: true, url: firmado.signedUrl, titulo: patron.titulo }
})
