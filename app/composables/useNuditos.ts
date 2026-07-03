// Helpers compartidos — mismas reglas de negocio que la app iOS.

export function dinero(v: number): string {
  return '$' + new Intl.NumberFormat('es-CL', { maximumFractionDigits: 2 }).format(v)
}

export const GROSOR_LABELS = [
  '0 Lace', '1 Super Fine', '2 Fine', '3 Light/DK',
  '4 Medium/Worsted', '5 Bulky', '6 Super Bulky', '7 Jumbo',
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
