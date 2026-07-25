// Definición de planes (solo presentación). Los variant_id de Lemon Squeezy
// viven en variables de entorno del servidor, no aquí.

export interface Plan {
  id: string
  nombre: string
  precio: number        // total a cobrar (USD)
  meses: number
  porMes: number        // equivalente mensual (USD)
  ahorro: number | null // % de descuento vs mensual
  destacado?: boolean
}

export const PLANES: Plan[] = [
  { id: 'mensual', nombre: 'Mensual', precio: 5, meses: 1, porMes: 5, ahorro: null },
  { id: 'trimestral', nombre: 'Trimestral', precio: 13, meses: 3, porMes: 4.33, ahorro: 13 },
  { id: 'semestral', nombre: 'Semestral', precio: 24, meses: 6, porMes: 4, ahorro: 20 },
  { id: 'anual', nombre: 'Anual', precio: 40, meses: 12, porMes: 3.33, ahorro: 33, destacado: true },
]

export function planPorId(id?: string | null): Plan | undefined {
  return PLANES.find(p => p.id === id)
}

export function nombrePlan(id?: string | null): string {
  return planPorId(id)?.nombre ?? '—'
}
