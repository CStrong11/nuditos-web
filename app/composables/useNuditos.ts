// Helpers compartidos — mismas reglas de negocio que la app iOS.

/// Id del usuario a partir de useSupabaseUser(). En @nuxtjs/supabase v2 el
/// composable devuelve el payload del JWT (el id viene en `sub`, no en `id`).
export function userID(u: any): string {
  const id = u?.sub ?? u?.id
  if (!id) throw new Error('Sesión no disponible — inicia sesión de nuevo')
  return id
}

export function dinero(v: number): string {
  return '$' + new Intl.NumberFormat('es-CL', { maximumFractionDigits: 2 }).format(v)
}

/// Equivalente en ovillos de una cantidad, según la unidad del hilo y sus
/// datos de ovillo. null si el hilo no tiene el dato necesario.
export function ovillosDe(
  cantidad: number,
  unidad: string,
  pesoPorOvillo?: number | null,
  metrosPorOvillo?: number | null,
): number | null {
  if (unidad === 'g' && pesoPorOvillo) return cantidad / pesoPorOvillo
  if (unidad === 'm' && metrosPorOvillo) return cantidad / metrosPorOvillo
  return null
}

export function formatoOvillos(n: number): string {
  const redondeado = Math.round(n * 10) / 10
  const texto = Number.isInteger(redondeado) ? String(redondeado) : redondeado.toFixed(1)
  return `${texto} ${redondeado === 1 ? 'ovillo' : 'ovillos'}`
}

/// Una cantidad expresada en todas las medidas computables del hilo:
/// su unidad propia, la alterna (g↔m si tiene ambos datos de ovillo) y ovillos.
export function medidasDe(
  cantidad: number,
  unidad: string,
  pesoPorOvillo?: number | null,
  metrosPorOvillo?: number | null,
): string[] {
  const partes = [`${cantidad.toFixed(1)} ${unidad}`]
  if (pesoPorOvillo && metrosPorOvillo) {
    if (unidad === 'g') partes.push(`${(cantidad * metrosPorOvillo / pesoPorOvillo).toFixed(1)} m`)
    else if (unidad === 'm') partes.push(`${(cantidad * pesoPorOvillo / metrosPorOvillo).toFixed(1)} g`)
  }
  const ovillos = ovillosDe(cantidad, unidad, pesoPorOvillo, metrosPorOvillo)
  if (ovillos != null) partes.push(formatoOvillos(ovillos))
  return partes
}

// El índice (0-7) es lo que se guarda; la etiqueta es solo para mostrar.
// Se mantiene entre paréntesis el nombre estándar internacional cuando aplica.
export const GROSOR_LABELS = [
  '0 Encaje', '1 Súper fino', '2 Fino', '3 Ligero (DK)',
  '4 Medio (Worsted)', '5 Grueso', '6 Súper grueso', '7 Jumbo',
]

export interface GastoMovimiento {
  id: string
  hilo_id: string
  proyecto_id: string | null
  cantidad: number
  tipo: string
  nota: string | null
  created_at: string
  hilo: {
    nombre: string
    costo: number | null
    unidad: string
    peso_por_ovillo: number | null
    metros_por_ovillo: number | null
  } | null
}

export const GASTO_SELECT =
  'id, hilo_id, proyecto_id, cantidad, tipo, nota, created_at, hilo:hilo_id(nombre, costo, unidad, peso_por_ovillo, metros_por_ovillo)'

/// `costo` es precio por ovillo; se prorratea con peso/metros por ovillo.
export function costoEstimado(m: GastoMovimiento): number | null {
  const h = m.hilo
  if (!h || h.costo == null) return null
  let porUnidad: number | null = null
  if (h.unidad === 'g' && h.peso_por_ovillo) porUnidad = h.costo / h.peso_por_ovillo
  else if (h.unidad === 'm' && h.metros_por_ovillo) porUnidad = h.costo / h.metros_por_ovillo
  if (porUnidad == null) return null
  return Math.abs(m.cantidad) * porUnidad
}

/// Sube una imagen a un bucket en {uid}/{nombre}.jpg y devuelve la URL
/// pública con cache-bust (misma convención que la app iOS).
export async function subirImagen(
  supabase: ReturnType<typeof useSupabaseClient>,
  bucket: string,
  uid: string,
  nombre: string,
  archivo: File,
): Promise<string> {
  const path = `${uid}/${nombre}.jpg`
  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, archivo, { contentType: archivo.type || 'image/jpeg', upsert: true })
  if (error) throw error
  const { data } = supabase.storage.from(bucket).getPublicUrl(path)
  return `${data.publicUrl}?v=${Date.now()}`
}
