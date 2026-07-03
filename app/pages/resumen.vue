<script setup lang="ts">
const supabase = useSupabaseClient()

const { data, status } = await useAsyncData('resumen-stats', async () => {
  const [mensualRes, porProyectoRes, hilosRes] = await Promise.all([
    supabase.from('consumo_mensual').select('*').order('mes', { ascending: false }),
    supabase.from('consumo_por_proyecto').select('*').order('consumo_total', { ascending: false }),
    supabase.from('resumen_hilos').select('id, stock_bajo'),
  ])
  const hilos = (hilosRes.data ?? []) as any[]
  return {
    mensual: (mensualRes.data ?? []) as any[],
    porProyecto: (porProyectoRes.data ?? []) as any[],
    totalHilos: hilos.length,
    stockBajo: hilos.filter(h => h.stock_bajo).length,
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
      <!-- Totales -->
      <div class="mb-6 grid grid-cols-2 gap-3">
        <div class="rounded-2xl border border-borde bg-white p-4 text-center">
          <p class="text-3xl font-bold text-rosa">{{ data.totalHilos }}</p>
          <p class="text-xs text-texto2">hilos en inventario</p>
        </div>
        <div class="rounded-2xl border border-borde bg-white p-4 text-center">
          <p class="text-3xl font-bold" :class="data.stockBajo ? 'text-poco-text' : 'text-verde-text'">
            {{ data.stockBajo }}
          </p>
          <p class="text-xs text-texto2">con stock bajo</p>
        </div>
      </div>

      <!-- Consumo mensual -->
      <section class="mb-6 rounded-2xl border border-borde bg-white p-5">
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
      <section class="rounded-2xl border border-borde bg-white p-5">
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
  </main>
</template>
