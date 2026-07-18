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

// ===================== Insumos =====================
// El stock se guarda siempre en UNIDADES sueltas.
//  · tipo_uso 'par'    -> 1 par = 2 unidades
//  · unidades_por_paquete + costo (del paquete) -> costo por unidad

export interface InsumoBase {
  tipo_uso: string
  unidad?: string | null
  unidades_por_paquete: number | null
  costo: number | null
}

export const TIPOS_USO_INSUMO = [
  { id: 'unidad', label: 'Por unidad', ayuda: 'Etiquetas, cajitas, cierres…' },
  { id: 'par', label: 'Por pares', ayuda: 'Ojitos: 1 par = 2 unidades' },
  { id: 'peso', label: 'Por peso', ayuda: 'Relleno, fibra…' },
  { id: 'longitud', label: 'Por longitud', ayuda: 'Cinta, elástico…' },
]

export const UNIDADES_PESO = ['g', 'kg']
export const UNIDADES_LONGITUD = ['m', 'cm']

/// Unidades de medida disponibles según el tipo de uso.
export function unidadesDeTipo(tipoUso: string): string[] {
  if (tipoUso === 'peso') return UNIDADES_PESO
  if (tipoUso === 'longitud') return UNIDADES_LONGITUD
  return []
}

export function unidadPorDefecto(tipoUso: string): string | null {
  if (tipoUso === 'peso') return 'g'
  if (tipoUso === 'longitud') return 'm'
  return null
}

/// Cuántas unidades de la medida base representa 1 "pieza" que ingresa
/// el usuario. Solo los pares agrupan (1 par = 2 unidades).
export function unidadesPorPieza(tipoUso: string): number {
  return tipoUso === 'par' ? 2 : 1
}

/// Etiqueta de lo que el usuario escribe (par/unidad/g/m…).
export function etiquetaPieza(tipoUso: string, cantidad = 2, unidad?: string | null): string {
  if (tipoUso === 'par') return cantidad === 1 ? 'par' : 'pares'
  if (tipoUso === 'peso') return unidad || 'g'
  if (tipoUso === 'longitud') return unidad || 'm'
  return cantidad === 1 ? 'unidad' : 'unidades'
}

/// Etiqueta de la medida en la que se guarda el stock.
export function etiquetaBase(i: InsumoBase, cantidad = 2): string {
  if (i.tipo_uso === 'peso') return i.unidad || 'g'
  if (i.tipo_uso === 'longitud') return i.unidad || 'm'
  return cantidad === 1 ? 'unidad' : 'unidades'
}

/// ¿El insumo se cuenta en piezas (unidad/par) o se mide (peso/longitud)?
export function esMedible(tipoUso: string): boolean {
  return tipoUso === 'peso' || tipoUso === 'longitud'
}

/// Costo de UNA unidad suelta del insumo (costo del paquete prorrateado).
export function costoUnitarioInsumo(i: InsumoBase): number | null {
  if (i.costo == null) return null
  const porPaquete = Number(i.unidades_por_paquete)
  if (!porPaquete || Number.isNaN(porPaquete)) return null
  return i.costo / porPaquete
}

/// Expresa una cantidad (en la medida base) en todas las formas legibles:
/// unidades/pares para piezas, o g/m para medibles, más paquetes.
export function medidasInsumo(cantidadBase: number, i: InsumoBase): string[] {
  const partes: string[] = []

  if (esMedible(i.tipo_uso)) {
    partes.push(`${formatoNum(cantidadBase)} ${etiquetaBase(i)}`)
  } else {
    partes.push(`${formatoNum(cantidadBase)} ${cantidadBase === 1 ? 'unidad' : 'unidades'}`)
    if (i.tipo_uso === 'par') {
      const pares = cantidadBase / 2
      partes.push(`${formatoNum(pares)} ${pares === 1 ? 'par' : 'pares'}`)
    }
  }
  const porPaquete = Number(i.unidades_por_paquete)
  if (porPaquete > 0) {
    const paq = cantidadBase / porPaquete
    partes.push(`${formatoNum(paq)} ${paq === 1 ? 'paquete' : 'paquetes'}`)
  }
  return partes
}

export function formatoNum(n: number): string {
  const r = Math.round(n * 100) / 100
  return Number.isInteger(r) ? String(r) : String(r)
}

export interface GastoInsumo {
  id: string
  insumo_id: string
  proyecto_id: string | null
  cantidad: number
  tipo: string
  nota: string | null
  created_at: string
  insumo: {
    nombre: string
    tipo_uso: string
    costo: number | null
    unidades_por_paquete: number | null
  } | null
}

export const GASTO_INSUMO_SELECT =
  'id, insumo_id, proyecto_id, cantidad, tipo, nota, created_at, insumo:insumo_id(nombre, tipo_uso, costo, unidades_por_paquete)'

export function costoEstimadoInsumo(m: GastoInsumo): number | null {
  if (!m.insumo) return null
  const porUnidad = costoUnitarioInsumo(m.insumo)
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
