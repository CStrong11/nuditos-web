<script setup lang="ts">
interface ResumenHilo {
  id: string
  nombre: string
  color: string | null
  marca: string | null
  cantidad: number
  unidad: string
  cantidad_inicial: number
  cantidad_minima: number | null
  etiquetas: string | null
  stock_bajo: boolean | null
  imagen_url: string | null
}

const supabase = useSupabaseClient()
const busqueda = ref('')
const tagsSeleccionados = ref<Set<string>>(new Set())

const { data: hilos, status } = await useAsyncData('resumen_hilos', async () => {
  const { data, error } = await supabase
    .from('resumen_hilos')
    .select('*')
    .order('nombre')
  if (error) throw error
  return (data ?? []) as ResumenHilo[]
})

const { data: etiquetas } = await useAsyncData('etiquetas', async () => {
  const { data } = await supabase.from('etiquetas').select('id, nombre').order('nombre')
  return (data ?? []) as { id: string, nombre: string }[]
})

// La vista resumen_hilos no expone los datos de ovillo; se traen aparte
// para mostrar el equivalente en ovillos de cada hilo.
const { data: datosOvillo } = await useAsyncData('hilos-ovillos', async () => {
  const { data } = await supabase.from('hilos').select('id, peso_por_ovillo, metros_por_ovillo')
  const mapa: Record<string, { peso: number | null, metros: number | null }> = {}
  for (const h of (data ?? []) as any[]) {
    mapa[h.id] = { peso: h.peso_por_ovillo, metros: h.metros_por_ovillo }
  }
  return mapa
})

function ovillosHilo(h: ResumenHilo): number | null {
  const d = datosOvillo.value?.[h.id]
  return d ? ovillosDe(h.cantidad, h.unidad, d.peso, d.metros) : null
}

// Stock bajo calculado en cliente (no depende del flag de la vista):
// hay mínimo definido > 0 y la cantidad es menor o igual.
function stockBajo(h: ResumenHilo): boolean {
  const min = Number(h.cantidad_minima)
  if (!min || Number.isNaN(min)) return !!h.stock_bajo
  return Number(h.cantidad) <= min
}

function toggleTag(id: string) {
  const s = new Set(tagsSeleccionados.value)
  s.has(id) ? s.delete(id) : s.add(id)
  tagsSeleccionados.value = s
}

const hilosFiltrados = computed(() => {
  const q = busqueda.value.trim().toLowerCase()
  const nombresSel = (etiquetas.value ?? [])
    .filter(t => tagsSeleccionados.value.has(t.id))
    .map(t => t.nombre)

  return (hilos.value ?? []).filter((h) => {
    const coincideBusqueda = !q
      || h.nombre.toLowerCase().includes(q)
      || h.marca?.toLowerCase().includes(q)

    const tagsHilo = h.etiquetas?.split(',').map(s => s.trim()) ?? []
    const coincideTags = !nombresSel.length || nombresSel.some(n => tagsHilo.includes(n))

    return coincideBusqueda && coincideTags
  })
})

function porcentaje(h: ResumenHilo): number {
  if (!h.cantidad_inicial) return 0
  return Math.max(0, Math.min(100, (h.cantidad / h.cantidad_inicial) * 100))
}
</script>

<template>
  <main class="mx-auto max-w-3xl px-4 py-8">
    <header class="mb-6 flex items-center justify-between">
      <div class="flex items-center gap-2">
        <img src="/nuditos-logo.png" alt="" class="h-10 w-auto">
        <div>
          <h1 class="text-2xl font-bold text-rosa">nuditos</h1>
          <p class="text-sm text-texto2">{{ hilosFiltrados.length }} hilos</p>
        </div>
      </div>
      <NuxtLink
        to="/hilos/nuevo"
        class="rounded-xl bg-rosa px-4 py-2 text-sm font-semibold text-white"
      >
        + Nuevo hilo
      </NuxtLink>
    </header>

    <input
      v-model="busqueda"
      type="search"
      placeholder="Buscar por nombre o marca…"
      class="mb-4 w-full rounded-2xl border border-borde bg-blanco px-4 py-3 outline-none placeholder:text-texto2/70 focus:border-rosa"
    >

    <!-- Filtro por etiquetas -->
    <div v-if="etiquetas?.length" class="mb-6 flex gap-2 overflow-x-auto">
      <button
        v-for="tag in etiquetas" :key="tag.id"
        class="shrink-0 rounded-xl border px-3 py-1 text-sm font-medium"
        :class="tagsSeleccionados.has(tag.id)
          ? 'border-rosa bg-rosa text-white'
          : 'border-borde bg-blanco text-texto'"
        @click="toggleTag(tag.id)"
      >
        {{ tag.nombre }}
      </button>
    </div>

    <p v-if="status === 'pending'" class="py-12 text-center text-texto2">Cargando…</p>

    <p v-else-if="!hilosFiltrados.length" class="py-12 text-center text-texto2">
      No hay hilos aún
    </p>

    <ul v-else class="space-y-3">
      <li v-for="hilo in hilosFiltrados" :key="hilo.id">
        <NuxtLink
          :to="`/hilos/${hilo.id}`"
          class="block rounded-2xl border border-borde bg-blanco p-4 transition hover:border-rosa"
        >
          <div class="flex items-center gap-4">
            <img
              v-if="hilo.imagen_url"
              :src="hilo.imagen_url"
              :alt="hilo.nombre"
              class="h-12 w-12 rounded-xl object-cover"
            >
            <div
              v-else
              class="h-12 w-12 rounded-xl"
              :style="{ backgroundColor: hilo.color ?? '#D6E6F2' }"
            />

            <div class="min-w-0 flex-1">
              <p class="truncate font-semibold">{{ hilo.nombre }}</p>
              <p class="text-sm text-texto2">
                {{ hilo.marca ?? 'Sin marca' }} · {{ hilo.cantidad.toFixed(1) }} {{ hilo.unidad }}<template v-if="ovillosHilo(hilo) != null"> · ≈ {{ formatoOvillos(ovillosHilo(hilo)!) }}</template>
              </p>
            </div>

            <span
              v-if="stockBajo(hilo)"
              class="shrink-0 rounded-lg bg-poco-bg px-2 py-1 text-xs font-semibold text-poco-text"
            >
              Stock bajo
            </span>

            <!-- Acciones rápidas (abren el modal en el detalle) -->
            <div class="flex shrink-0 flex-col gap-1.5">
              <button
                class="rounded-lg bg-durazno-bg px-3 py-1 text-xs font-semibold text-durazno-text"
                @click.prevent.stop="navigateTo(`/hilos/${hilo.id}?accion=usar`)"
              >
                − usar
              </button>
              <button
                class="rounded-lg bg-verde-bg px-3 py-1 text-xs font-semibold text-verde-text"
                @click.prevent.stop="navigateTo(`/hilos/${hilo.id}?accion=reponer`)"
              >
                + reponer
              </button>
            </div>
          </div>

          <div class="mt-3 h-2 overflow-hidden rounded-full bg-crema">
            <div
              class="h-full rounded-full"
              :class="stockBajo(hilo) ? 'bg-poco-text' : 'bg-verde-text'"
              :style="{ width: `${porcentaje(hilo)}%` }"
            />
          </div>
        </NuxtLink>
      </li>
    </ul>
  </main>
</template>
