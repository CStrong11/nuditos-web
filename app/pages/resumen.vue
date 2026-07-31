<script setup lang="ts">
const supabase = useSupabaseClient()

// Vista principal: consumo de hilos vs. gasto en proyectos
const vista = ref<'hilos' | 'proyectos'>('hilos')
// Sub-pestañas del lado hilos
const tab = ref<'general' | 'porHilo' | 'insumos'>('general')

// ---------- Filtro de período (afecta consumo y gasto, NO el stock) ----------
// Sin opción "Todo": las consultas SIEMPRE se acotan por fecha en el servidor
// para no traer historiales enormes. Personalizado admite máx. 6 meses.
type PeriodoId = 'mes' | 'mesPasado' | 'tresMeses' | 'custom'
const periodo = ref<PeriodoId>('mes')
const customDesde = ref('')
const customHasta = ref('')

const MAX_MESES = 6

const periodos: { id: PeriodoId, label: string }[] = [
  { id: 'mes', label: 'Este mes' },
  { id: 'mesPasado', label: 'Mes pasado' },
  { id: 'tresMeses', label: 'Últimos 3 meses' },
  { id: 'custom', label: 'Personalizado' },
]

// Rango solicitado [desde, hasta) — hasta es exclusivo
const rango = computed<{ desde: Date | null, hasta: Date | null }>(() => {
  const now = new Date()
  const y = now.getFullYear()
  const m = now.getMonth()
  switch (periodo.value) {
    case 'mes':
      return { desde: new Date(y, m, 1), hasta: new Date(y, m + 1, 1) }
    case 'mesPasado':
      return { desde: new Date(y, m - 1, 1), hasta: new Date(y, m, 1) }
    case 'tresMeses':
      return { desde: new Date(y, m - 2, 1), hasta: new Date(y, m + 1, 1) }
    case 'custom': {
      const desde = customDesde.value ? new Date(`${customDesde.value}T00:00:00`) : null
      // hasta inclusivo del día elegido -> exclusivo del día siguiente
      const hasta = customHasta.value
        ? new Date(new Date(`${customHasta.value}T00:00:00`).getTime() + 864e5)
        : null
      return { desde, hasta }
    }
    default:
      return { desde: null, hasta: null }
  }
})

// El rango personalizado no puede superar los 6 meses
const rangoExcedido = computed(() => {
  if (periodo.value !== 'custom') return false
  const { desde, hasta } = rango.value
  if (!desde || !hasta) return false
  const tope = new Date(desde.getFullYear(), desde.getMonth() + MAX_MESES, desde.getDate())
  return hasta.getTime() > tope.getTime()
})

// Rango que efectivamente se consulta (nulo => no se consulta nada)
const rangoEfectivo = computed<{ desde: Date | null, hasta: Date | null }>(() => {
  if (rangoExcedido.value) return { desde: null, hasta: null }
  return rango.value
})

// Clave primitiva para disparar el refetch solo cuando el rango cambia de verdad
const rangoKey = computed(() => {
  const { desde, hasta } = rangoEfectivo.value
  return `${desde?.getTime() ?? ''}_${hasta?.getTime() ?? ''}`
})

const etiquetaPeriodo = computed(() => {
  const p = periodos.find(x => x.id === periodo.value)
  if (periodo.value !== 'custom') return p?.label ?? ''
  if (customDesde.value && customHasta.value) return `${customDesde.value} → ${customHasta.value}`
  return 'Personalizado'
})

// ---------- Stock / catálogos (una sola vez, no dependen del período) ----------
const { data: base, status: statusBase } = await useAsyncData('resumen-base', async () => {
  const [hilosRes, resumenRes, insumosRes, proyectosRes] = await Promise.all([
    supabase.from('hilos').select('id, nombre, unidad, cantidad_actual, peso_por_ovillo, metros_por_ovillo').order('nombre'),
    supabase.from('resumen_hilos').select('id, stock_bajo'),
    supabase.from('insumos').select('*').order('nombre'),
    supabase.from('proyectos').select('id, nombre, estado').order('nombre'),
  ])
  const resumen = (resumenRes.data ?? []) as any[]
  return {
    hilos: (hilosRes.data ?? []) as any[],
    stockBajoIds: new Set(resumen.filter(r => r.stock_bajo).map(r => r.id)) as Set<string>,
    insumos: (insumosRes.data ?? []) as any[],
    proyectos: (proyectosRes.data ?? []) as any[],
  }
})

// ---------- Movimientos del período (acotados por fecha en el servidor) ----------
const { data: movs, status: statusMovs } = await useAsyncData('resumen-movs', async () => {
  const { desde, hasta } = rangoEfectivo.value
  if (!desde || !hasta) return { movHilo: [] as GastoMovimiento[], movInsumo: [] as GastoInsumo[] }
  const desdeISO = desde.toISOString()
  const hastaISO = hasta.toISOString()
  const [movHiloRes, movInsumoRes] = await Promise.all([
    supabase.from('movimientos_hilo').select(GASTO_SELECT)
      .eq('tipo', 'uso').gte('created_at', desdeISO).lt('created_at', hastaISO),
    supabase.from('movimientos_insumo').select(GASTO_INSUMO_SELECT)
      .eq('tipo', 'uso').gte('created_at', desdeISO).lt('created_at', hastaISO),
  ])
  return {
    movHilo: (movHiloRes.data ?? []) as unknown as GastoMovimiento[],
    movInsumo: (movInsumoRes.data ?? []) as unknown as GastoInsumo[],
  }
}, { watch: [rangoKey] })

// Los movimientos ya vienen acotados por el query; se usan tal cual
const movHiloFiltrado = computed(() => movs.value?.movHilo ?? [])
const movInsumoFiltrado = computed(() => movs.value?.movInsumo ?? [])

// ===================== STOCK (siempre actual, sin filtrar) =====================
const totalHilos = computed(() => base.value?.hilos.length ?? 0)
const stockBajoHilos = computed(() => base.value?.stockBajoIds.size ?? 0)
const totalInsumos = computed(() => base.value?.insumos.length ?? 0)
const insumosStockBajo = computed(() =>
  (base.value?.insumos ?? []).filter((i) => {
    const min = Number(i.cantidad_minima)
    return !!min && Number(i.cantidad_actual) <= min
  }).length,
)
const ovillos = computed(() => {
  let total = 0
  let sinDato = 0
  for (const h of base.value?.hilos ?? []) {
    const ov = ovillosDe(h.cantidad_actual, h.unidad, h.peso_por_ovillo, h.metros_por_ovillo)
    if (ov != null) total += ov
    else sinDato++
  }
  return { total, sinDato }
})

// ===================== HILOS: consumo del período =====================
interface HiloResumen {
  id: string
  nombre: string
  unidad: string
  stock: string[]
  consumo: string[] | null
  stockBajo: boolean
}

const porHilo = computed<HiloResumen[]>(() => {
  const consumoPorId: Record<string, number> = {}
  for (const m of movHiloFiltrado.value) {
    consumoPorId[m.hilo_id] = (consumoPorId[m.hilo_id] ?? 0) + Math.abs(m.cantidad)
  }
  return (base.value?.hilos ?? []).map((h) => {
    const consumoTotal = consumoPorId[h.id] ?? 0
    return {
      id: h.id,
      nombre: h.nombre,
      unidad: h.unidad,
      stock: medidasDe(h.cantidad_actual, h.unidad, h.peso_por_ovillo, h.metros_por_ovillo),
      consumo: consumoTotal > 0
        ? medidasDe(consumoTotal, h.unidad, h.peso_por_ovillo, h.metros_por_ovillo)
        : null,
      stockBajo: base.value!.stockBajoIds.has(h.id),
    }
  })
})

// Insumos: stock actual + consumo/gasto del período
const porInsumo = computed(() => {
  const usadoPorInsumo: Record<string, number> = {}
  for (const m of movInsumoFiltrado.value) {
    usadoPorInsumo[m.insumo_id] = (usadoPorInsumo[m.insumo_id] ?? 0) + Math.abs(Number(m.cantidad))
  }
  return (base.value?.insumos ?? []).map((i) => {
    const usado = usadoPorInsumo[i.id] ?? 0
    const min = Number(i.cantidad_minima)
    return {
      id: i.id,
      nombre: i.nombre,
      stock: medidasInsumo(Number(i.cantidad_actual), i),
      consumo: usado > 0 ? medidasInsumo(usado, i) : null,
      valorUsado: (costoUnitarioInsumo(i) ?? 0) * usado,
      stockBajo: !!min && Number(i.cantidad_actual) <= min,
    }
  })
})

// Consumo mensual (hilo) dentro del período
const consumoMensual = computed(() => {
  const porMes: Record<string, { total: number, unidad: string }> = {}
  for (const m of movHiloFiltrado.value) {
    const d = new Date(m.created_at)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    if (!porMes[key]) porMes[key] = { total: 0, unidad: m.hilo?.unidad ?? '' }
    porMes[key].total += Math.abs(m.cantidad)
  }
  return Object.entries(porMes)
    .map(([mes, v]) => ({ mes, consumo_total: v.total, unidad: v.unidad }))
    .sort((a, b) => b.mes.localeCompare(a.mes))
})
const maxMensual = computed(() => Math.max(1, ...consumoMensual.value.map(m => m.consumo_total)))

// ===================== PROYECTOS: gasto del período =====================
interface ProyectoResumen {
  id: string
  nombre: string
  estado: string
  gastoHilos: number
  gastoInsumos: number
  gastoTotal: number
  consumoHilo: number
  unidadHilo: string
  numMovimientos: number
  numHilos: number
  tieneSinCosto: boolean
}

const porProyecto = computed<ProyectoResumen[]>(() => {
  type Acc = {
    gastoHilos: number, gastoInsumos: number, consumoHilo: number,
    unidad: string, hilos: Set<string>, movs: number, sinCosto: boolean
  }
  const mapa: Record<string, Acc> = {}
  const ensure = (id: string): Acc =>
    (mapa[id] ??= { gastoHilos: 0, gastoInsumos: 0, consumoHilo: 0, unidad: '', hilos: new Set(), movs: 0, sinCosto: false })

  for (const m of movHiloFiltrado.value) {
    if (!m.proyecto_id) continue
    const a = ensure(m.proyecto_id)
    const c = costoEstimado(m)
    if (c != null) a.gastoHilos += c
    else a.sinCosto = true
    a.consumoHilo += Math.abs(m.cantidad)
    if (m.hilo?.unidad) a.unidad = m.hilo.unidad
    a.hilos.add(m.hilo_id)
    a.movs++
  }
  for (const m of movInsumoFiltrado.value) {
    if (!m.proyecto_id) continue
    const a = ensure(m.proyecto_id)
    const c = costoEstimadoInsumo(m)
    if (c != null) a.gastoInsumos += c
    else a.sinCosto = true
    a.movs++
  }

  return Object.entries(mapa).map(([id, a]) => {
    const p = (base.value?.proyectos ?? []).find(x => x.id === id)
    return {
      id,
      nombre: p?.nombre ?? 'Proyecto',
      estado: p?.estado ?? 'en_progreso',
      gastoHilos: a.gastoHilos,
      gastoInsumos: a.gastoInsumos,
      gastoTotal: a.gastoHilos + a.gastoInsumos,
      consumoHilo: a.consumoHilo,
      unidadHilo: a.unidad,
      numMovimientos: a.movs,
      numHilos: a.hilos.size,
      tieneSinCosto: a.sinCosto,
    }
  }).sort((x, y) => y.gastoTotal - x.gastoTotal)
})

const maxGastoProyecto = computed(() => Math.max(1, ...porProyecto.value.map(p => p.gastoTotal)))

// Gasto sin proyecto asignado (movimientos sueltos del período)
const gastoSinProyecto = computed(() => {
  let s = 0
  for (const m of movHiloFiltrado.value) {
    if (m.proyecto_id) continue
    const c = costoEstimado(m); if (c != null) s += c
  }
  for (const m of movInsumoFiltrado.value) {
    if (m.proyecto_id) continue
    const c = costoEstimadoInsumo(m); if (c != null) s += c
  }
  return s
})

const gastoEnProyectos = computed(() => porProyecto.value.reduce((s, p) => s + p.gastoTotal, 0))
const gastoGlobal = computed(() => gastoEnProyectos.value + gastoSinProyecto.value)
const proyectoTop = computed(() => porProyecto.value[0] ?? null)

// Gasto mensual (hilos + insumos) dentro del período
const gastoMensual = computed(() => {
  const porMes: Record<string, number> = {}
  const suma = (iso: string, c: number | null) => {
    if (c == null) return
    const d = new Date(iso)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    porMes[key] = (porMes[key] ?? 0) + c
  }
  for (const m of movHiloFiltrado.value) suma(m.created_at, costoEstimado(m))
  for (const m of movInsumoFiltrado.value) suma(m.created_at, costoEstimadoInsumo(m))
  return Object.entries(porMes)
    .map(([mes, total]) => ({ mes, total }))
    .sort((a, b) => b.mes.localeCompare(a.mes))
})
const maxGastoMensual = computed(() => Math.max(1, ...gastoMensual.value.map(m => m.total)))

const estadoLabel: Record<string, string> = {
  en_progreso: 'En progreso', pausado: 'Pausado', terminado: 'Terminado',
}

function nombreMes(mes: string): string {
  const d = new Date(`${mes}-01T00:00:00`)
  if (Number.isNaN(d.getTime())) return mes
  return d.toLocaleDateString('es-CL', { month: 'short', year: 'numeric' })
}
</script>

<template>
  <main class="mx-auto max-w-3xl px-4 py-8">
    <header class="mb-4">
      <h1 class="text-2xl font-bold text-rosa">Resumen</h1>
      <p class="text-sm text-texto2">
        {{ vista === 'hilos' ? 'tu consumo de hilos' : 'tu gasto en proyectos' }}
      </p>
    </header>

    <!-- Switch principal: Hilos / Proyectos -->
    <div class="mb-4 flex rounded-xl border border-borde bg-blanco p-1">
      <button
        class="flex-1 rounded-lg py-2 text-sm font-semibold"
        :class="vista === 'hilos' ? 'bg-rosa text-white' : 'text-texto2'"
        @click="vista = 'hilos'"
      >
        🧶 Hilos
      </button>
      <button
        class="flex-1 rounded-lg py-2 text-sm font-semibold"
        :class="vista === 'proyectos' ? 'bg-rosa text-white' : 'text-texto2'"
        @click="vista = 'proyectos'"
      >
        📋 Proyectos
      </button>
    </div>

    <!-- Filtro de período (para ambas vistas) -->
    <div class="mb-2 flex gap-2 overflow-x-auto pb-1">
      <button
        v-for="p in periodos" :key="p.id"
        class="shrink-0 rounded-xl border px-3 py-1.5 text-sm font-medium"
        :class="periodo === p.id ? 'border-rosa bg-rosa-pastel text-rosa' : 'border-borde bg-blanco text-texto2'"
        @click="periodo = p.id"
      >
        {{ p.label }}
      </button>
    </div>
    <div v-if="periodo === 'custom'" class="mb-2">
      <div class="flex items-center gap-2">
        <input
          v-model="customDesde" type="date"
          class="flex-1 rounded-xl border border-borde bg-blanco px-3 py-2 text-sm outline-none focus:border-rosa"
        >
        <span class="text-texto2">→</span>
        <input
          v-model="customHasta" type="date"
          class="flex-1 rounded-xl border border-borde bg-blanco px-3 py-2 text-sm outline-none focus:border-rosa"
        >
      </div>
      <p v-if="rangoExcedido" class="mt-2 rounded-xl bg-poco-bg px-3 py-2 text-xs text-poco-text">
        El rango no puede superar los 6 meses. Ajusta las fechas para ver los datos.
      </p>
      <p v-else class="mt-1.5 text-xs text-texto2/60">Máximo 6 meses.</p>
    </div>
    <div v-else class="mb-4" />

    <p v-if="statusBase === 'pending'" class="py-12 text-center text-texto2">Cargando…</p>

    <template v-else-if="base">
      <!-- Indicador sutil mientras se recargan los movimientos del período -->
      <p
        v-if="statusMovs === 'pending'"
        class="mb-3 text-center text-xs text-texto2/70"
      >
        Actualizando…
      </p>
      <!-- =================== VISTA: HILOS =================== -->
      <template v-if="vista === 'hilos'">
        <!-- Sub-pestañas -->
        <div class="mb-6 flex rounded-xl border border-borde bg-blanco p-1">
          <button
            class="flex-1 rounded-lg py-2 text-sm font-medium"
            :class="tab === 'general' ? 'bg-rosa-pastel text-rosa' : 'text-texto2'"
            @click="tab = 'general'"
          >
            General
          </button>
          <button
            class="flex-1 rounded-lg py-2 text-sm font-medium"
            :class="tab === 'porHilo' ? 'bg-rosa-pastel text-rosa' : 'text-texto2'"
            @click="tab = 'porHilo'"
          >
            Por hilo
          </button>
          <button
            class="flex-1 rounded-lg py-2 text-sm font-medium"
            :class="tab === 'insumos' ? 'bg-rosa-pastel text-rosa' : 'text-texto2'"
            @click="tab = 'insumos'"
          >
            Insumos
          </button>
        </div>

        <!-- ===== General ===== -->
        <template v-if="tab === 'general'">
          <!-- Totales (stock actual) -->
          <div class="mb-6 grid grid-cols-3 gap-3">
            <div class="rounded-2xl border border-borde bg-blanco p-4 text-center">
              <p class="text-3xl font-bold text-rosa">{{ totalHilos }}</p>
              <p class="text-xs text-texto2">hilos distintos</p>
            </div>
            <div class="rounded-2xl border border-borde bg-blanco p-4 text-center">
              <p class="text-3xl font-bold text-rosa">
                {{ Number.isInteger(Math.round(ovillos.total * 10) / 10) ? Math.round(ovillos.total) : ovillos.total.toFixed(1) }}
              </p>
              <p class="text-xs text-texto2">ovillos en total</p>
              <p v-if="ovillos.sinDato" class="mt-0.5 text-[10px] text-texto2/60">
                sin contar {{ ovillos.sinDato }} sin dato de ovillo
              </p>
            </div>
            <div class="rounded-2xl border border-borde bg-blanco p-4 text-center">
              <p class="text-3xl font-bold" :class="stockBajoHilos ? 'text-poco-text' : 'text-verde-text'">
                {{ stockBajoHilos }}
              </p>
              <p class="text-xs text-texto2">con stock bajo</p>
            </div>
          </div>

          <!-- Consumo mensual -->
          <section class="rounded-2xl border border-borde bg-blanco p-5">
            <div class="mb-4 flex items-baseline justify-between">
              <h2 class="font-bold">Consumo mensual</h2>
              <span class="text-xs text-texto2">{{ etiquetaPeriodo }}</span>
            </div>
            <p v-if="!consumoMensual.length" class="py-4 text-center text-sm text-texto2">
              Sin consumo en este período
            </p>
            <ul v-else class="space-y-3">
              <li v-for="m in consumoMensual" :key="m.mes">
                <div class="mb-1 flex justify-between text-sm">
                  <span class="capitalize text-texto2">{{ nombreMes(m.mes) }}</span>
                  <span class="font-semibold">{{ m.consumo_total.toFixed(1) }} {{ m.unidad ?? '' }}</span>
                </div>
                <div class="h-3 overflow-hidden rounded-full bg-crema">
                  <div
                    class="h-full rounded-full bg-rosa"
                    :style="{ width: `${(m.consumo_total / maxMensual) * 100}%` }"
                  />
                </div>
              </li>
            </ul>
          </section>
        </template>

        <!-- ===== Por hilo ===== -->
        <template v-if="tab === 'porHilo'">
          <p v-if="!porHilo.length" class="py-12 text-center text-texto2">
            No hay hilos aún
          </p>
          <ul v-else class="space-y-3">
            <li
              v-for="h in porHilo" :key="h.id"
              class="rounded-2xl border border-borde bg-blanco p-4"
            >
              <div class="flex items-center justify-between gap-3">
                <NuxtLink :to="`/hilos/${h.id}`" class="truncate font-semibold hover:text-rosa">
                  {{ h.nombre }}
                </NuxtLink>
                <span
                  v-if="h.stockBajo"
                  class="shrink-0 rounded-lg bg-poco-bg px-2 py-0.5 text-xs font-semibold text-poco-text"
                >
                  Stock bajo
                </span>
              </div>

              <div class="mt-2 grid gap-1 text-sm">
                <p>
                  <span class="text-texto2">En stock:</span>
                  <span class="font-medium"> {{ h.stock.join(' · ') }}</span>
                </p>
                <p v-if="h.consumo">
                  <span class="text-texto2">Consumido:</span>
                  <span class="font-medium text-durazno-text"> {{ h.consumo.join(' · ') }}</span>
                </p>
                <p v-else class="text-xs text-texto2/60">Sin consumo en este período</p>
              </div>
            </li>
          </ul>
        </template>

        <!-- ===== Insumos ===== -->
        <template v-if="tab === 'insumos'">
          <div class="mb-6 grid grid-cols-2 gap-3">
            <div class="rounded-2xl border border-borde bg-blanco p-4 text-center">
              <p class="text-3xl font-bold text-rosa">{{ totalInsumos }}</p>
              <p class="text-xs text-texto2">insumos distintos</p>
            </div>
            <div class="rounded-2xl border border-borde bg-blanco p-4 text-center">
              <p class="text-3xl font-bold" :class="insumosStockBajo ? 'text-poco-text' : 'text-verde-text'">
                {{ insumosStockBajo }}
              </p>
              <p class="text-xs text-texto2">con stock bajo</p>
            </div>
          </div>

          <p v-if="!porInsumo.length" class="py-12 text-center text-texto2">
            No hay insumos aún
          </p>
          <ul v-else class="space-y-3">
            <li
              v-for="i in porInsumo" :key="i.id"
              class="rounded-2xl border border-borde bg-blanco p-4"
            >
              <div class="flex items-center justify-between gap-3">
                <NuxtLink :to="`/insumos/${i.id}`" class="truncate font-semibold hover:text-rosa">
                  {{ i.nombre }}
                </NuxtLink>
                <span
                  v-if="i.stockBajo"
                  class="shrink-0 rounded-lg bg-poco-bg px-2 py-0.5 text-xs font-semibold text-poco-text"
                >
                  Stock bajo
                </span>
              </div>
              <div class="mt-2 grid gap-1 text-sm">
                <p>
                  <span class="text-texto2">En stock:</span>
                  <span class="font-medium"> {{ i.stock.join(' · ') }}</span>
                </p>
                <p v-if="i.consumo">
                  <span class="text-texto2">Consumido:</span>
                  <span class="font-medium text-durazno-text"> {{ i.consumo.join(' · ') }}</span>
                  <span v-if="i.valorUsado > 0" class="text-verde-text"> · {{ dinero(i.valorUsado) }}</span>
                </p>
                <p v-else class="text-xs text-texto2/60">Sin consumo en este período</p>
              </div>
            </li>
          </ul>
        </template>
      </template>

      <!-- =================== VISTA: PROYECTOS =================== -->
      <template v-else>
        <!-- KPIs de gasto -->
        <div class="mb-6 grid grid-cols-2 gap-3">
          <div class="col-span-2 rounded-2xl border border-borde bg-blanco p-5 text-center">
            <p class="text-xs text-texto2">Gastado en el período</p>
            <p class="mt-1 text-4xl font-bold text-verde-text">{{ dinero(gastoGlobal) }}</p>
            <p v-if="gastoSinProyecto > 0" class="mt-1 text-xs text-texto2">
              incluye {{ dinero(gastoSinProyecto) }} sin proyecto asignado
            </p>
          </div>
          <div class="rounded-2xl border border-borde bg-blanco p-4 text-center">
            <p class="text-3xl font-bold text-rosa">{{ porProyecto.length }}</p>
            <p class="text-xs text-texto2">proyectos con gasto</p>
          </div>
          <div class="rounded-2xl border border-borde bg-blanco p-4 text-center">
            <p class="truncate text-lg font-bold text-rosa">{{ proyectoTop ? proyectoTop.nombre : '—' }}</p>
            <p class="text-xs text-texto2">
              {{ proyectoTop ? `el más caro · ${dinero(proyectoTop.gastoTotal)}` : 'sin gasto aún' }}
            </p>
          </div>
        </div>

        <!-- Gasto mensual -->
        <section class="mb-6 rounded-2xl border border-borde bg-blanco p-5">
          <div class="mb-4 flex items-baseline justify-between">
            <h2 class="font-bold">Gasto mensual</h2>
            <span class="text-xs text-texto2">{{ etiquetaPeriodo }}</span>
          </div>
          <p v-if="!gastoMensual.length" class="py-4 text-center text-sm text-texto2">
            Sin gasto en este período
          </p>
          <ul v-else class="space-y-3">
            <li v-for="m in gastoMensual" :key="m.mes">
              <div class="mb-1 flex justify-between text-sm">
                <span class="capitalize text-texto2">{{ nombreMes(m.mes) }}</span>
                <span class="font-semibold text-verde-text">{{ dinero(m.total) }}</span>
              </div>
              <div class="h-3 overflow-hidden rounded-full bg-crema">
                <div
                  class="h-full rounded-full bg-verde-text"
                  :style="{ width: `${(m.total / maxGastoMensual) * 100}%` }"
                />
              </div>
            </li>
          </ul>
        </section>

        <!-- Por proyecto -->
        <section>
          <h2 class="mb-3 font-bold">Por proyecto</h2>
          <p v-if="!porProyecto.length" class="py-12 text-center text-texto2">
            Sin gasto en proyectos en este período
          </p>
          <ul v-else class="space-y-3">
            <li
              v-for="p in porProyecto" :key="p.id"
              class="rounded-2xl border border-borde bg-blanco p-4"
            >
              <div class="flex items-center justify-between gap-3">
                <NuxtLink :to="`/proyectos/${p.id}`" class="truncate font-semibold hover:text-rosa">
                  {{ p.nombre }}
                </NuxtLink>
                <span class="shrink-0 text-lg font-bold text-verde-text">{{ dinero(p.gastoTotal) }}</span>
              </div>

              <!-- Barra de gasto relativo -->
              <div class="mt-2 h-2 overflow-hidden rounded-full bg-crema">
                <div
                  class="h-full rounded-full bg-verde-text"
                  :style="{ width: `${(p.gastoTotal / maxGastoProyecto) * 100}%` }"
                />
              </div>

              <div class="mt-2 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-texto2">
                <span v-if="p.gastoHilos > 0 && p.gastoInsumos > 0">
                  Hilos {{ dinero(p.gastoHilos) }} · Insumos {{ dinero(p.gastoInsumos) }}
                </span>
                <span v-if="p.consumoHilo > 0">
                  {{ p.consumoHilo.toFixed(1) }} {{ p.unidadHilo }} · {{ p.numHilos }} {{ p.numHilos === 1 ? 'hilo' : 'hilos' }}
                </span>
                <span>{{ p.numMovimientos }} {{ p.numMovimientos === 1 ? 'movimiento' : 'movimientos' }}</span>
                <span v-if="p.tieneSinCosto" class="text-texto2/60">· no incluye usos sin costo</span>
              </div>
            </li>
          </ul>

          <p v-if="gastoSinProyecto > 0" class="mt-4 rounded-2xl border border-dashed border-borde bg-blanco/50 p-4 text-center text-sm text-texto2">
            Sin proyecto asignado: <span class="font-semibold text-verde-text">{{ dinero(gastoSinProyecto) }}</span>
          </p>
        </section>
      </template>
    </template>
  </main>
</template>
