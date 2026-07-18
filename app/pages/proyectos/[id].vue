<script setup lang="ts">
const route = useRoute()
const supabase = useSupabaseClient()
const proyectoID = route.params.id as string

const tab = ref<'movimientos' | 'porHilo' | 'insumos'>('movimientos')

const { data, status, refresh } = await useAsyncData(`proyecto-${proyectoID}`, async () => {
  const [proyectoRes, consumoRes, gastosRes, gastosInsumoRes] = await Promise.all([
    supabase.from('proyectos').select('*').eq('id', proyectoID).single(),
    supabase.from('consumo_por_proyecto').select('*').eq('proyecto_id', proyectoID).maybeSingle(),
    supabase
      .from('movimientos_hilo')
      .select(GASTO_SELECT)
      .eq('proyecto_id', proyectoID)
      .eq('tipo', 'uso')
      .order('created_at', { ascending: false }),
    supabase
      .from('movimientos_insumo')
      .select(GASTO_INSUMO_SELECT)
      .eq('proyecto_id', proyectoID)
      .eq('tipo', 'uso')
      .order('created_at', { ascending: false }),
  ])
  if (proyectoRes.error) throw proyectoRes.error
  return {
    proyecto: proyectoRes.data as any,
    consumo: consumoRes.data as any,
    gastos: (gastosRes.data ?? []) as unknown as GastoMovimiento[],
    gastosInsumo: (gastosInsumoRes.data ?? []) as unknown as GastoInsumo[],
  }
})

const proyecto = computed(() => data.value?.proyecto)
const gastos = computed(() => data.value?.gastos ?? [])
const gastosInsumo = computed(() => data.value?.gastosInsumo ?? [])

const gastoHilos = computed(() =>
  gastos.value.reduce((sum, m) => sum + (costoEstimado(m) ?? 0), 0),
)
const gastoInsumos = computed(() =>
  gastosInsumo.value.reduce((sum, m) => sum + (costoEstimadoInsumo(m) ?? 0), 0),
)
const gastoTotal = computed(() => gastoHilos.value + gastoInsumos.value)

const haySinCosto = computed(() =>
  gastos.value.some(m => costoEstimado(m) == null)
  || gastosInsumo.value.some(m => costoEstimadoInsumo(m) == null),
)

interface ResumenHiloGasto {
  id: string
  nombre: string
  unidad: string
  cantidadTotal: number
  costoTotal: number
  usos: number
  tieneSinCosto: boolean
}

const gastosPorHilo = computed<ResumenHiloGasto[]>(() => {
  const grupos: Record<string, GastoMovimiento[]> = {}
  for (const m of gastos.value) (grupos[m.hilo_id] ??= []).push(m)
  return Object.entries(grupos)
    .map(([id, movs]) => ({
      id,
      nombre: movs[0]?.hilo?.nombre ?? 'Hilo',
      unidad: movs[0]?.hilo?.unidad ?? '',
      cantidadTotal: movs.reduce((s, m) => s + Math.abs(m.cantidad), 0),
      costoTotal: movs.reduce((s, m) => s + (costoEstimado(m) ?? 0), 0),
      usos: movs.length,
      tieneSinCosto: movs.some(m => costoEstimado(m) == null),
    }))
    .sort((a, b) => b.costoTotal - a.costoTotal)
})

const estadoLabel: Record<string, string> = {
  en_progreso: 'En progreso', pausado: 'Pausado', terminado: 'Terminado',
}

// --- Editar ---
const modalEditar = ref(false)
const edicion = reactive({ nombre: '', descripcion: '', estado: 'en_progreso' })
const guardando = ref(false)
const errorEdicion = ref<string | null>(null)

function abrirEditar() {
  edicion.nombre = proyecto.value.nombre
  edicion.descripcion = proyecto.value.descripcion ?? ''
  edicion.estado = proyecto.value.estado ?? 'en_progreso'
  errorEdicion.value = null
  modalEditar.value = true
}

async function guardarEdicion() {
  errorEdicion.value = null
  guardando.value = true
  const { error } = await supabase.from('proyectos').update({
    nombre: edicion.nombre,
    descripcion: edicion.descripcion || null,
    estado: edicion.estado,
  }).eq('id', proyectoID)
  guardando.value = false
  if (error) {
    errorEdicion.value = error.message
    return
  }
  modalEditar.value = false
  await refresh()
  await refreshNuxtData('proyectos')
}

// --- Eliminar ---
const modalEliminar = ref(false)
const eliminando = ref(false)
const errorEliminar = ref<string | null>(null)

async function eliminar() {
  errorEliminar.value = null
  eliminando.value = true
  const { error } = await supabase.from('proyectos').delete().eq('id', proyectoID)
  eliminando.value = false
  if (error) {
    errorEliminar.value = error.message
    return
  }
  modalEliminar.value = false
  await refreshNuxtData('proyectos')
  navigateTo('/proyectos')
}
</script>

<template>
  <main class="mx-auto max-w-2xl px-4 py-8">
    <header class="mb-6 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <NuxtLink to="/proyectos" class="text-texto2">←</NuxtLink>
        <h1 class="text-xl font-bold">Detalle</h1>
      </div>
      <div class="flex gap-2">
        <button class="rounded-xl border border-borde bg-blanco px-3 py-1.5 text-sm" @click="abrirEditar">
          Editar
        </button>
        <button
          class="rounded-xl bg-poco-bg px-3 py-1.5 text-sm font-medium text-poco-text"
          @click="errorEliminar = null; modalEliminar = true"
        >
          Eliminar
        </button>
      </div>
    </header>

    <p v-if="status === 'pending'" class="py-12 text-center text-texto2">Cargando…</p>

    <template v-else-if="proyecto">
      <!-- Cabecera -->
      <section class="rounded-2xl border border-borde bg-blanco p-5 text-center">
        <img
          v-if="proyecto.imagen_url"
          :src="proyecto.imagen_url"
          class="mb-4 h-44 w-full rounded-2xl object-cover"
          alt=""
        >
        <h2 class="text-2xl font-bold">{{ proyecto.nombre }}</h2>
        <p v-if="proyecto.descripcion" class="mt-1 text-sm text-texto2">{{ proyecto.descripcion }}</p>
        <span class="mt-3 inline-block rounded-lg bg-rosa-pastel px-3 py-1 text-xs font-semibold text-rosa">
          {{ estadoLabel[proyecto.estado ?? 'en_progreso'] }}
        </span>
      </section>

      <!-- Consumo -->
      <section v-if="data?.consumo" class="mt-4 rounded-2xl border border-borde bg-blanco p-5 text-center">
        <h3 class="font-bold">Consumo total</h3>
        <p class="mt-1 text-3xl font-bold text-rosa">
          {{ data.consumo.consumo_total.toFixed(1) }} {{ data.consumo.unidad ?? '' }}
        </p>
        <p v-if="data.consumo.num_hilos" class="mt-1 text-sm text-texto2">
          {{ data.consumo.num_hilos }} hilos distintos usados
        </p>
      </section>

      <!-- Gasto -->
      <section v-if="gastos.length || gastosInsumo.length" class="mt-4 rounded-2xl border border-borde bg-blanco p-5 text-center">
        <h3 class="font-bold">Gasto total estimado</h3>
        <p class="mt-1 text-3xl font-bold text-verde-text">{{ dinero(gastoTotal) }}</p>
        <p v-if="gastoHilos > 0 && gastoInsumos > 0" class="mt-1 text-xs text-texto2">
          Hilos {{ dinero(gastoHilos) }} · Insumos {{ dinero(gastoInsumos) }}
        </p>
        <p v-if="haySinCosto" class="mt-1 text-xs text-texto2">
          No incluye usos sin costo definido
        </p>
      </section>

      <!-- Detalle de gastos -->
      <section v-if="gastos.length || gastosInsumo.length" class="mt-6">
        <h3 class="mb-3 font-bold">Detalle de gastos</h3>

        <div class="mb-4 flex rounded-xl border border-borde bg-blanco p-1">
          <button
            class="flex-1 rounded-lg py-2 text-sm font-medium"
            :class="tab === 'movimientos' ? 'bg-rosa-pastel text-rosa' : 'text-texto2'"
            @click="tab = 'movimientos'"
          >
            Movimientos
          </button>
          <button
            class="flex-1 rounded-lg py-2 text-sm font-medium"
            :class="tab === 'porHilo' ? 'bg-rosa-pastel text-rosa' : 'text-texto2'"
            @click="tab = 'porHilo'"
          >
            Por hilo
          </button>
          <button
            v-if="gastosInsumo.length"
            class="flex-1 rounded-lg py-2 text-sm font-medium"
            :class="tab === 'insumos' ? 'bg-rosa-pastel text-rosa' : 'text-texto2'"
            @click="tab = 'insumos'"
          >
            Insumos
          </button>
        </div>

        <!-- Insumos usados -->
        <ul v-if="tab === 'insumos'" class="space-y-2">
          <li
            v-for="mov in gastosInsumo" :key="mov.id"
            class="flex items-center gap-3 rounded-2xl border border-borde bg-blanco p-3"
          >
            <span class="flex h-9 w-9 items-center justify-center rounded-full bg-celeste text-sm">🧷</span>
            <div class="min-w-0 flex-1">
              <p class="truncate text-sm font-medium">{{ mov.insumo?.nombre ?? 'Insumo' }}</p>
              <p class="text-xs text-texto2">
                <template v-if="mov.insumo?.tipo_uso === 'par'">
                  {{ formatoNum(Math.abs(mov.cantidad) / 2) }}
                  {{ Math.abs(mov.cantidad) / 2 === 1 ? 'par' : 'pares' }}
                  ({{ formatoNum(Math.abs(mov.cantidad)) }} u.)
                </template>
                <template v-else>
                  {{ formatoNum(Math.abs(mov.cantidad)) }}
                  {{ Math.abs(mov.cantidad) === 1 ? 'unidad' : 'unidades' }}
                </template>
              </p>
              <p v-if="mov.nota" class="text-xs text-texto2/70">{{ mov.nota }}</p>
            </div>
            <div class="shrink-0 text-right">
              <p v-if="costoEstimadoInsumo(mov) != null" class="text-sm font-bold text-verde-text">
                {{ dinero(costoEstimadoInsumo(mov)!) }}
              </p>
              <p v-else class="text-xs text-texto2/60">sin costo</p>
              <time class="text-xs text-texto2/60">
                {{ new Date(mov.created_at).toLocaleDateString('es-CL') }}
              </time>
            </div>
          </li>
        </ul>

        <!-- Por movimiento -->
        <ul v-if="tab === 'movimientos'" class="space-y-2">
          <li
            v-for="mov in gastos" :key="mov.id"
            class="flex items-center gap-3 rounded-2xl border border-borde bg-blanco p-3"
          >
            <span class="flex h-9 w-9 items-center justify-center rounded-full bg-durazno-bg text-sm">✂️</span>
            <div class="min-w-0 flex-1">
              <p class="truncate text-sm font-medium">{{ mov.hilo?.nombre ?? 'Hilo' }}</p>
              <p class="text-xs text-texto2">
                {{ Math.abs(mov.cantidad).toFixed(1) }} {{ mov.hilo?.unidad ?? '' }}
              </p>
              <p v-if="mov.nota" class="text-xs text-texto2/70">{{ mov.nota }}</p>
            </div>
            <div class="shrink-0 text-right">
              <p v-if="costoEstimado(mov) != null" class="text-sm font-bold text-verde-text">
                {{ dinero(costoEstimado(mov)!) }}
              </p>
              <p v-else class="text-xs text-texto2/60">sin costo</p>
              <time class="text-xs text-texto2/60">
                {{ new Date(mov.created_at).toLocaleDateString('es-CL') }}
              </time>
            </div>
          </li>
        </ul>

        <!-- Por hilo -->
        <ul v-else class="space-y-2">
          <li
            v-for="r in gastosPorHilo" :key="r.id"
            class="flex items-center gap-3 rounded-2xl border border-borde bg-blanco p-3"
          >
            <span class="flex h-9 w-9 items-center justify-center rounded-full bg-celeste text-sm">🧶</span>
            <div class="min-w-0 flex-1">
              <p class="truncate text-sm font-medium">{{ r.nombre }}</p>
              <p class="text-xs text-texto2">
                {{ r.cantidadTotal.toFixed(1) }} {{ r.unidad }} en {{ r.usos }} {{ r.usos === 1 ? 'uso' : 'usos' }}
              </p>
            </div>
            <div class="shrink-0 text-right">
              <p v-if="r.costoTotal > 0" class="text-sm font-bold text-verde-text">{{ dinero(r.costoTotal) }}</p>
              <p v-else class="text-xs text-texto2/60">sin costo</p>
              <p v-if="r.tieneSinCosto && r.costoTotal > 0" class="text-xs text-texto2/60">parcial</p>
            </div>
          </li>
        </ul>
      </section>
    </template>

    <!-- Modal editar -->
    <div
      v-if="modalEditar"
      class="fixed inset-0 z-50 flex items-end justify-center bg-black/30 sm:items-center"
      @click.self="modalEditar = false"
    >
      <div class="w-full max-w-md rounded-t-3xl bg-crema p-6 sm:rounded-3xl">
        <h3 class="mb-4 text-center text-lg font-bold">Editar proyecto</h3>

        <input
          v-model="edicion.nombre"
          placeholder="Nombre"
          class="mb-3 w-full rounded-xl border border-borde bg-blanco px-3 py-2.5 outline-none focus:border-rosa"
        >
        <textarea
          v-model="edicion.descripcion"
          placeholder="Descripción"
          rows="2"
          class="mb-3 w-full rounded-xl border border-borde bg-blanco px-3 py-2.5 outline-none focus:border-rosa"
        />
        <div class="mb-4 flex gap-2">
          <button
            v-for="(label, id) in estadoLabel" :key="id"
            class="flex-1 rounded-xl border py-2 text-xs font-medium"
            :class="edicion.estado === id ? 'border-rosa bg-rosa-pastel text-rosa' : 'border-borde bg-blanco text-texto2'"
            @click="edicion.estado = id"
          >
            {{ label }}
          </button>
        </div>

        <p v-if="errorEdicion" class="mb-3 rounded-xl bg-poco-bg px-4 py-2 text-sm text-poco-text">
          {{ errorEdicion }}
        </p>

        <div class="flex gap-3">
          <button class="flex-1 rounded-2xl border border-borde bg-blanco py-3" @click="modalEditar = false">
            Cancelar
          </button>
          <button
            :disabled="!edicion.nombre || guardando"
            class="flex-1 rounded-2xl bg-rosa py-3 font-semibold text-white disabled:opacity-40"
            @click="guardarEdicion"
          >
            {{ guardando ? 'Guardando…' : 'Guardar' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Confirmación de eliminación -->
    <ConfirmModal
      :abierto="modalEliminar"
      titulo="¿Eliminar proyecto?"
      mensaje="Esta acción no se puede deshacer."
      :procesando="eliminando"
      :error="errorEliminar"
      @confirmar="eliminar"
      @cancelar="modalEliminar = false"
    />
  </main>
</template>
