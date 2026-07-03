<script setup lang="ts">
const supabase = useSupabaseClient()
const user = useSupabaseUser()

const filtro = ref<string | null>(null)
const filtros = [
  { id: null, label: 'Todos' },
  { id: 'en_progreso', label: 'En progreso' },
  { id: 'pausado', label: 'Pausados' },
  { id: 'terminado', label: 'Terminados' },
]

const { data, status, refresh } = await useAsyncData('proyectos', async () => {
  const [proyectosRes, consumoRes, gastosRes] = await Promise.all([
    supabase.from('proyectos').select('*').order('nombre'),
    supabase.from('consumo_por_proyecto').select('*'),
    supabase.from('movimientos_hilo').select(GASTO_SELECT).eq('tipo', 'uso').not('proyecto_id', 'is', null),
  ])
  if (proyectosRes.error) throw proyectosRes.error

  const gastoPorProyecto: Record<string, number> = {}
  for (const mov of (gastosRes.data ?? []) as unknown as GastoMovimiento[]) {
    const costo = costoEstimado(mov)
    if (costo != null && mov.proyecto_id) {
      gastoPorProyecto[mov.proyecto_id] = (gastoPorProyecto[mov.proyecto_id] ?? 0) + costo
    }
  }

  return {
    proyectos: (proyectosRes.data ?? []) as any[],
    consumo: (consumoRes.data ?? []) as any[],
    gastoPorProyecto,
  }
})

const proyectosFiltrados = computed(() => {
  const lista = data.value?.proyectos ?? []
  if (!filtro.value) return lista
  return lista.filter(p => (p.estado ?? 'en_progreso') === filtro.value)
})

function consumoDe(id: string) {
  return data.value?.consumo.find(c => c.proyecto_id === id)
}

const estadoLabel: Record<string, string> = {
  en_progreso: 'En progreso', pausado: 'Pausado', terminado: 'Terminado',
}

// --- Crear proyecto ---
const modalCrear = ref(false)
const nuevo = reactive({ nombre: '', descripcion: '', estado: 'en_progreso' })
const guardando = ref(false)
const error = ref<string | null>(null)

async function crearProyecto() {
  error.value = null
  guardando.value = true
  try {
    const { error: e } = await supabase.from('proyectos').insert({
      user_id: user.value!.id,
      nombre: nuevo.nombre,
      descripcion: nuevo.descripcion || null,
      estado: nuevo.estado,
    })
    if (e) throw e
    modalCrear.value = false
    nuevo.nombre = ''
    nuevo.descripcion = ''
    nuevo.estado = 'en_progreso'
    await refresh()
  } catch (e: any) {
    error.value = e.message
  } finally {
    guardando.value = false
  }
}
</script>

<template>
  <main class="mx-auto max-w-3xl px-4 py-8">
    <header class="mb-6 flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-rosa">Proyectos</h1>
        <p class="text-sm text-texto2">{{ proyectosFiltrados.length }} proyectos</p>
      </div>
      <button
        class="rounded-xl bg-rosa px-4 py-2 text-sm font-semibold text-white"
        @click="modalCrear = true"
      >
        + Nuevo
      </button>
    </header>

    <!-- Filtros -->
    <div class="mb-6 flex gap-2 overflow-x-auto">
      <button
        v-for="f in filtros" :key="f.label"
        class="shrink-0 rounded-xl border px-4 py-1.5 text-sm font-medium"
        :class="filtro === f.id ? 'border-rosa bg-rosa text-white' : 'border-borde bg-white text-texto'"
        @click="filtro = f.id"
      >
        {{ f.label }}
      </button>
    </div>

    <p v-if="status === 'pending'" class="py-12 text-center text-texto2">Cargando…</p>

    <p v-else-if="!proyectosFiltrados.length" class="py-12 text-center text-texto2">
      Sin proyectos en este estado
    </p>

    <ul v-else class="space-y-3">
      <li v-for="p in proyectosFiltrados" :key="p.id">
        <NuxtLink
          :to="`/proyectos/${p.id}`"
          class="block rounded-2xl border border-borde bg-white p-4 transition hover:border-rosa"
        >
          <div class="flex items-start gap-4">
            <div class="min-w-0 flex-1">
              <p class="font-semibold">{{ p.nombre }}</p>
              <p v-if="p.descripcion" class="truncate text-sm text-texto2">{{ p.descripcion }}</p>
              <span
                class="mt-2 inline-block rounded-lg px-2 py-0.5 text-xs font-semibold"
                :class="{
                  'bg-verde-bg text-verde-text': p.estado === 'terminado',
                  'bg-durazno-bg text-durazno-text': p.estado === 'pausado',
                  'bg-rosa-pastel text-rosa': !p.estado || p.estado === 'en_progreso',
                }"
              >
                {{ estadoLabel[p.estado ?? 'en_progreso'] }}
              </span>
            </div>

            <img
              v-if="p.imagen_url"
              :src="p.imagen_url"
              class="h-16 w-16 rounded-xl object-cover"
              alt=""
            >
          </div>

          <div class="mt-3 flex gap-6 text-sm">
            <div v-if="consumoDe(p.id)">
              <p class="font-bold">{{ consumoDe(p.id).consumo_total.toFixed(1) }} {{ consumoDe(p.id).unidad ?? '' }}</p>
              <p class="text-xs text-texto2">consumo total</p>
            </div>
            <div v-if="consumoDe(p.id)?.num_hilos">
              <p class="font-bold">{{ consumoDe(p.id).num_hilos }}</p>
              <p class="text-xs text-texto2">hilos usados</p>
            </div>
            <div v-if="data?.gastoPorProyecto[p.id]">
              <p class="font-bold text-verde-text">{{ dinero(data.gastoPorProyecto[p.id]) }}</p>
              <p class="text-xs text-texto2">gastado</p>
            </div>
          </div>
        </NuxtLink>
      </li>
    </ul>

    <!-- Modal crear -->
    <div
      v-if="modalCrear"
      class="fixed inset-0 z-50 flex items-end justify-center bg-black/30 sm:items-center"
      @click.self="modalCrear = false"
    >
      <div class="w-full max-w-md rounded-t-3xl bg-crema p-6 sm:rounded-3xl">
        <h3 class="mb-4 text-center text-lg font-bold">Nuevo proyecto</h3>

        <input
          v-model="nuevo.nombre"
          placeholder="Nombre"
          class="mb-3 w-full rounded-xl border border-borde bg-white px-3 py-2.5 outline-none focus:border-rosa"
        >
        <textarea
          v-model="nuevo.descripcion"
          placeholder="Descripción"
          rows="2"
          class="mb-3 w-full rounded-xl border border-borde bg-white px-3 py-2.5 outline-none focus:border-rosa"
        />
        <div class="mb-4 flex gap-2">
          <button
            v-for="(label, id) in estadoLabel" :key="id"
            class="flex-1 rounded-xl border py-2 text-xs font-medium"
            :class="nuevo.estado === id ? 'border-rosa bg-rosa-pastel text-rosa' : 'border-borde bg-white text-texto2'"
            @click="nuevo.estado = id"
          >
            {{ label }}
          </button>
        </div>

        <p v-if="error" class="mb-3 rounded-xl bg-rosa-pastel px-4 py-2 text-sm text-rosa">{{ error }}</p>

        <div class="flex gap-3">
          <button class="flex-1 rounded-2xl border border-borde bg-white py-3" @click="modalCrear = false">
            Cancelar
          </button>
          <button
            :disabled="!nuevo.nombre || guardando"
            class="flex-1 rounded-2xl bg-rosa py-3 font-semibold text-white disabled:opacity-40"
            @click="crearProyecto"
          >
            {{ guardando ? 'Creando…' : 'Crear' }}
          </button>
        </div>
      </div>
    </div>
  </main>
</template>
