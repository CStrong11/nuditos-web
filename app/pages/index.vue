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

const { data: hilos, status } = await useAsyncData('resumen_hilos', async () => {
  const { data, error } = await supabase
    .from('resumen_hilos')
    .select('*')
    .order('nombre')
  if (error) throw error
  return (data ?? []) as ResumenHilo[]
})

const hilosFiltrados = computed(() => {
  const q = busqueda.value.trim().toLowerCase()
  if (!q) return hilos.value ?? []
  return (hilos.value ?? []).filter(h =>
    h.nombre.toLowerCase().includes(q) || h.marca?.toLowerCase().includes(q),
  )
})

function porcentaje(h: ResumenHilo): number {
  if (!h.cantidad_inicial) return 0
  return Math.max(0, Math.min(100, (h.cantidad / h.cantidad_inicial) * 100))
}
</script>

<template>
  <main class="mx-auto max-w-3xl px-4 py-8">
    <header class="mb-6 flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-rosa">nuditos</h1>
        <p class="text-sm text-texto2">{{ hilosFiltrados.length }} hilos</p>
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
      class="mb-6 w-full rounded-2xl border border-borde bg-white px-4 py-3 outline-none placeholder:text-texto2/70 focus:border-rosa"
    >

    <p v-if="status === 'pending'" class="py-12 text-center text-texto2">Cargando…</p>

    <p v-else-if="!hilosFiltrados.length" class="py-12 text-center text-texto2">
      No hay hilos aún
    </p>

    <ul v-else class="space-y-3">
      <li v-for="hilo in hilosFiltrados" :key="hilo.id">
        <NuxtLink
          :to="`/hilos/${hilo.id}`"
          class="block rounded-2xl border border-borde bg-white p-4 transition hover:border-rosa"
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
                {{ hilo.marca ?? 'Sin marca' }} · {{ hilo.cantidad.toFixed(1) }} {{ hilo.unidad }}
              </p>
            </div>

            <span
              v-if="hilo.stock_bajo"
              class="shrink-0 rounded-lg bg-poco-bg px-2 py-1 text-xs font-semibold text-poco-text"
            >
              Stock bajo
            </span>
          </div>

          <div class="mt-3 h-2 overflow-hidden rounded-full bg-crema">
            <div
              class="h-full rounded-full"
              :class="hilo.stock_bajo ? 'bg-poco-text' : 'bg-verde-text'"
              :style="{ width: `${porcentaje(hilo)}%` }"
            />
          </div>
        </NuxtLink>
      </li>
    </ul>
  </main>
</template>
