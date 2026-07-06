<script setup lang="ts">
const supabase = useSupabaseClient()

const tab = ref<'general' | 'porHilo'>('general')

interface HiloResumen {
  id: string
  nombre: string
  unidad: string
  stock: string[]
  consumo: string[] | null
  stockBajo: boolean
}

const { data, status } = await useAsyncData('resumen-stats', async () => {
  const [mensualRes, porProyectoRes, resumenRes, hilosRes] = await Promise.all([
    supabase.from('consumo_mensual').select('*').order('mes', { ascending: false }),
    supabase.from('consumo_por_proyecto').select('*').order('consumo_total', { ascending: false }),
    supabase.from('resumen_hilos').select('id, stock_bajo, consumo_total'),
    supabase.from('hilos').select('id, nombre, unidad, cantidad_actual, peso_por_ovillo, metros_por_ovillo').order('nombre'),
  ])
  const resumen = (resumenRes.data ?? []) as any[]
  const hilos = (hilosRes.data ?? []) as any[]
  const resumenPorID = new Map(resumen.map(r => [r.id, r]))

  // Total en unidades de ovillo (solo hilos con dato de ovillo cargado)
  let totalOvillos = 0
  let hilosSinDatoOvillo = 0
  for (const h of hilos) {
    const ov = ovillosDe(h.cantidad_actual, h.unidad, h.peso_por_ovillo, h.metros_por_ovillo)
    if (ov != null) totalOvillos += ov
    else hilosSinDatoOvillo++
  }

  // Detalle por hilo: stock y consumo en todas las medidas computables
  const porHilo: HiloResumen[] = hilos.map((h) => {
    const r = resumenPorID.get(h.id)
    const consumoTotal = r?.consumo_total ?? 0
    return {
      id: h.id,
      nombre: h.nombre,
      unidad: h.unidad,
      stock: medidasDe(h.cantidad_actual, h.unidad, h.peso_por_ovillo, h.metros_por_ovillo),
      consumo: consumoTotal > 0
        ? medidasDe(consumoTotal, h.unidad, h.peso_por_ovillo, h.metros_por_ovillo)
        : null,
      stockBajo: !!r?.stock_bajo,
    }
  })

  return {
    mensual: (mensualRes.data ?? []) as any[],
    porProyecto: (porProyectoRes.data ?? []) as any[],
    totalHilos: resumen.length,
    stockBajo: resumen.filter(h => h.stock_bajo).length,
    totalOvillos,
    hilosSinDatoOvillo,
    porHilo,
  }
})

const maxMensual = computed(() =>
  Math.max(1, ...(data.value?.mensual ?? []).map(m => m.consumo_total)),
)
const maxProyecto = computed(() =>
  Math.max(1, ...(data.value?.porProyecto ?? []).map(p => p.consumo_total)),
)

function nombreMes(mes: string): string {
  // `mes` viene como fecha/período del backend, ej "2026-07-01"
  const d = new Date(mes)
  if (Number.isNaN(d.getTime())) return mes
  return d.toLocaleDateString('es-CL', { month: 'short', year: 'numeric' })
}
</script>

<template>
  <main class="mx-auto max-w-3xl px-4 py-8">
    <header class="mb-6">
      <h1 class="text-2xl font-bold text-rosa">Resumen</h1>
      <p class="text-sm text-texto2">tu consumo de hilos</p>
    </header>

    <p v-if="status === 'pending'" class="py-12 text-center text-texto2">Cargando…</p>

    <template v-else-if="data">
      <!-- Pestañas -->
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
      </div>

      <!-- ===== Pestaña: Por hilo ===== -->
      <template v-if="tab === 'porHilo'">
        <p v-if="!data.porHilo.length" class="py-12 text-center text-texto2">
          No hay hilos aún
        </p>
        <ul v-else class="space-y-3">
          <li
            v-for="h in data.porHilo" :key="h.id"
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
              <p v-else class="text-xs text-texto2/60">Sin consumo registrado</p>
            </div>
          </li>
        </ul>
      </template>

      <!-- ===== Pestaña: General ===== -->
      <template v-else>
      <!-- Totales -->
      <div class="mb-6 grid grid-cols-3 gap-3">
        <div class="rounded-2xl border border-borde bg-blanco p-4 text-center">
          <p class="text-3xl font-bold text-rosa">{{ data.totalHilos }}</p>
          <p class="text-xs text-texto2">hilos distintos</p>
        </div>
        <div class="rounded-2xl border border-borde bg-blanco p-4 text-center">
          <p class="text-3xl font-bold text-rosa">
            {{ Number.isInteger(Math.round(data.totalOvillos * 10) / 10) ? Math.round(data.totalOvillos) : data.totalOvillos.toFixed(1) }}
          </p>
          <p class="text-xs text-texto2">ovillos en total</p>
          <p v-if="data.hilosSinDatoOvillo" class="mt-0.5 text-[10px] text-texto2/60">
            sin contar {{ data.hilosSinDatoOvillo }} sin dato de ovillo
          </p>
        </div>
        <div class="rounded-2xl border border-borde bg-blanco p-4 text-center">
          <p class="text-3xl font-bold" :class="data.stockBajo ? 'text-poco-text' : 'text-verde-text'">
            {{ data.stockBajo }}
          </p>
          <p class="text-xs text-texto2">con stock bajo</p>
        </div>
      </div>

      <!-- Consumo mensual -->
      <section class="mb-6 rounded-2xl border border-borde bg-blanco p-5">
        <h2 class="mb-4 font-bold">Consumo mensual</h2>
        <p v-if="!data.mensual.length" class="py-4 text-center text-sm text-texto2">
          Sin consumo registrado aún
        </p>
        <ul v-else class="space-y-3">
          <li v-for="m in data.mensual" :key="m.mes">
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

      <!-- Consumo por proyecto -->
      <section class="rounded-2xl border border-borde bg-blanco p-5">
        <h2 class="mb-4 font-bold">Consumo por proyecto</h2>
        <p v-if="!data.porProyecto.length" class="py-4 text-center text-sm text-texto2">
          Sin proyectos con consumo
        </p>
        <ul v-else class="space-y-3">
          <li v-for="p in data.porProyecto" :key="p.proyecto_id">
            <div class="mb-1 flex justify-between text-sm">
              <NuxtLink :to="`/proyectos/${p.proyecto_id}`" class="truncate text-texto2 hover:text-rosa">
                {{ p.proyecto_nombre }}
              </NuxtLink>
              <span class="ml-3 shrink-0 font-semibold">
                {{ p.consumo_total.toFixed(1) }} {{ p.unidad ?? '' }}
              </span>
            </div>
            <div class="h-3 overflow-hidden rounded-full bg-crema">
              <div
                class="h-full rounded-full bg-verde-text"
                :style="{ width: `${(p.consumo_total / maxProyecto) * 100}%` }"
              />
            </div>
          </li>
        </ul>
      </section>
      </template>
    </template>
  </main>
</template>
