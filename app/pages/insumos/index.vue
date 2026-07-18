<script setup lang="ts">
const supabase = useSupabaseClient()
const busqueda = ref('')

// Al visitar la sección, la novedad deja de anunciarse
const { marcarVista } = useNovedadInsumos()
onMounted(marcarVista)

const { data: insumos, status } = await useAsyncData('insumos', async () => {
  const { data, error } = await supabase.from('insumos').select('*').order('nombre')
  if (error) throw error
  return (data ?? []) as any[]
})

const filtrados = computed(() => {
  const q = busqueda.value.trim().toLowerCase()
  if (!q) return insumos.value ?? []
  return (insumos.value ?? []).filter(i =>
    i.nombre.toLowerCase().includes(q) || i.marca?.toLowerCase().includes(q),
  )
})

function stockBajo(i: any): boolean {
  const min = Number(i.cantidad_minima)
  if (!min || Number.isNaN(min)) return false
  return Number(i.cantidad_actual) <= min
}

function porcentaje(i: any): number {
  const ini = Number(i.cantidad_inicial)
  if (!ini) return 0
  return Math.max(0, Math.min(100, (Number(i.cantidad_actual) / ini) * 100))
}

/// Resumen corto: "12 pares · 24 unidades", "250 g" o "30 unidades"
function resumenCantidad(i: any): string {
  const c = Number(i.cantidad_actual)
  if (esMedible(i.tipo_uso)) return `${formatoNum(c)} ${etiquetaBase(i)}`
  const partes: string[] = []
  if (i.tipo_uso === 'par') partes.push(`${formatoNum(c / 2)} ${c / 2 === 1 ? 'par' : 'pares'}`)
  partes.push(`${formatoNum(c)} ${c === 1 ? 'unidad' : 'unidades'}`)
  return partes.join(' · ')
}
</script>

<template>
  <main class="mx-auto max-w-3xl px-4 py-8">
    <header class="mb-6 flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-rosa">Insumos</h1>
        <p class="text-sm text-texto2">{{ filtrados.length }} insumos</p>
      </div>
      <NuxtLink
        to="/insumos/nuevo"
        class="rounded-xl bg-rosa px-4 py-2 text-sm font-semibold text-white"
      >
        + Nuevo insumo
      </NuxtLink>
    </header>

    <input
      v-model="busqueda"
      type="search"
      placeholder="Buscar por nombre o marca…"
      class="mb-6 w-full rounded-2xl border border-borde bg-blanco px-4 py-3 outline-none placeholder:text-texto2/70 focus:border-rosa"
    >

    <p v-if="status === 'pending'" class="py-12 text-center text-texto2">Cargando…</p>

    <div v-else-if="!filtrados.length" class="py-12 text-center">
      <p class="text-texto2">No hay insumos aún</p>
      <p class="mt-1 text-sm text-texto2/70">
        Ojitos de seguridad, etiquetas, cajitas, rellenos…
      </p>
    </div>

    <ul v-else class="space-y-3">
      <li v-for="insumo in filtrados" :key="insumo.id">
        <NuxtLink
          :to="`/insumos/${insumo.id}`"
          class="block rounded-2xl border border-borde bg-blanco p-4 transition hover:border-rosa"
        >
          <div class="flex items-center gap-4">
            <div class="relative shrink-0">
              <img
                v-if="insumo.imagen_url"
                :src="insumo.imagen_url"
                :alt="insumo.nombre"
                class="h-12 w-12 rounded-xl object-cover"
              >
              <div
                v-else
                class="flex h-12 w-12 items-center justify-center rounded-xl text-lg"
                :style="{ backgroundColor: insumo.color ?? '#D6E6F2' }"
              >
                🧷
              </div>
              <span
                v-if="stockBajo(insumo)"
                class="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full border-2 border-blanco bg-poco-text text-[11px] font-bold text-white shadow"
                title="Stock bajo"
              >
                !
              </span>
            </div>

            <div class="min-w-0 flex-1">
              <p class="truncate font-semibold">{{ insumo.nombre }}</p>
              <p class="text-sm" :class="stockBajo(insumo) ? 'font-medium text-poco-text' : 'text-texto2'">
                {{ insumo.marca ?? 'Sin marca' }} · {{ resumenCantidad(insumo) }}
              </p>
            </div>

            <span
              v-if="stockBajo(insumo)"
              class="hidden shrink-0 rounded-lg bg-poco-bg px-2 py-1 text-xs font-semibold text-poco-text sm:block"
            >
              Stock bajo
            </span>

            <div class="flex shrink-0 flex-col gap-1.5">
              <button
                class="rounded-lg bg-durazno-bg px-3 py-1 text-xs font-semibold text-durazno-text"
                @click.prevent.stop="navigateTo(`/insumos/${insumo.id}?accion=usar`)"
              >
                − usar
              </button>
              <button
                class="rounded-lg bg-verde-bg px-3 py-1 text-xs font-semibold text-verde-text"
                @click.prevent.stop="navigateTo(`/insumos/${insumo.id}?accion=reponer`)"
              >
                + reponer
              </button>
            </div>
          </div>

          <div class="mt-3 h-2 overflow-hidden rounded-full bg-crema">
            <div
              class="h-full rounded-full"
              :class="stockBajo(insumo) ? 'bg-poco-text' : 'bg-verde-text'"
              :style="{ width: `${porcentaje(insumo)}%` }"
            />
          </div>
        </NuxtLink>
      </li>
    </ul>
  </main>
</template>
