<script setup lang="ts">
const route = useRoute()
const supabase = useSupabaseClient()
const hiloID = route.params.id as string

const { data, status, refresh } = await useAsyncData(`hilo-${hiloID}`, async () => {
  const [hiloRes, movsRes, resumenRes] = await Promise.all([
    supabase.from('hilos').select('*').eq('id', hiloID).single(),
    supabase
      .from('movimientos_hilo')
      .select('*, proyecto:proyecto_id(nombre)')
      .eq('hilo_id', hiloID)
      .order('created_at', { ascending: false }),
    // La cantidad_inicial solo la expone la vista resumen_hilos (como en iOS).
    supabase.from('resumen_hilos').select('cantidad_inicial').eq('id', hiloID).maybeSingle(),
  ])
  if (hiloRes.error) throw hiloRes.error
  return {
    hilo: hiloRes.data as any,
    movimientos: (movsRes.data ?? []) as any[],
    cantidadInicial: (resumenRes.data as any)?.cantidad_inicial ?? null,
  }
})

const hilo = computed(() => data.value?.hilo)
const movimientos = computed(() => data.value?.movimientos ?? [])
const cantidadInicial = computed(() => data.value?.cantidadInicial)

const porcentaje = computed(() => {
  if (!cantidadInicial.value || !hilo.value) return null
  return Math.max(0, Math.min(100, (hilo.value.cantidad_actual / cantidadInicial.value) * 100))
})

// Stock bajo: comparación numérica explícita (los numeric de Postgres pueden
// llegar como string). Se marca cuando hay un mínimo definido > 0.
const stockBajo = computed(() => {
  const h = hilo.value
  if (!h) return false
  const min = Number(h.cantidad_minima)
  if (!min || Number.isNaN(min)) return false
  return Number(h.cantidad_actual) <= min
})

// --- Usar / Reponer ---
const modal = ref<'usar' | 'reponer' | null>(null)
const cantidad = ref(1)
const nota = ref('')
const proyectoID = ref('')
const procesando = ref(false)
const error = ref<string | null>(null)

// Modo de unidad al usar: la propia del hilo, la alterna (g↔m) u ovillos
// completos — mismas reglas de conversión que la app iOS.
type ModoUso = 'unidad' | 'alterna' | 'ovillo'
const modo = ref<ModoUso>('unidad')

const modosDisponibles = computed<ModoUso[]>(() => {
  const h = hilo.value
  if (!h) return ['unidad']
  const modos: ModoUso[] = ['unidad']
  const esGM = h.unidad === 'g' || h.unidad === 'm'
  if (esGM && h.peso_por_ovillo > 0 && h.metros_por_ovillo > 0) modos.push('alterna')
  if ((h.unidad === 'g' && h.peso_por_ovillo > 0) || (h.unidad === 'm' && h.metros_por_ovillo > 0)) {
    modos.push('ovillo')
  }
  return modos
})

function etiquetaModo(m: ModoUso): string {
  const h = hilo.value
  if (m === 'unidad') return h?.unidad || 'unidad'
  if (m === 'alterna') return h?.unidad === 'g' ? 'm' : 'g'
  return 'ovillos'
}

const cantidadConvertida = computed(() => {
  const h = hilo.value
  if (!h || modo.value === 'unidad') return cantidad.value
  if (modo.value === 'alterna') {
    if (!h.peso_por_ovillo || !h.metros_por_ovillo) return cantidad.value
    return h.unidad === 'g'
      ? cantidad.value * (h.peso_por_ovillo / h.metros_por_ovillo)
      : cantidad.value * (h.metros_por_ovillo / h.peso_por_ovillo)
  }
  return h.unidad === 'g' ? cantidad.value * h.peso_por_ovillo : cantidad.value * h.metros_por_ovillo
})

const stockInsuficiente = computed(() =>
  modal.value === 'usar' && !!hilo.value && cantidadConvertida.value > hilo.value.cantidad_actual,
)

watch(modo, (m) => {
  // "1 ovillo completo" como punto de partida natural.
  if (m === 'ovillo') cantidad.value = 1
})

const { data: proyectos } = await useAsyncData('proyectos-select', async () => {
  const { data: d } = await supabase.from('proyectos').select('id, nombre').order('nombre')
  return (d ?? []) as any[]
})

function abrirModal(tipo: 'usar' | 'reponer') {
  cantidad.value = 1
  nota.value = ''
  proyectoID.value = ''
  error.value = null
  modo.value = 'unidad'
  modal.value = tipo
}

// Los botones rápidos de la lista llegan con ?accion=usar|reponer
onMounted(() => {
  const accion = route.query.accion
  if (accion === 'usar' || accion === 'reponer') abrirModal(accion)
})

async function confirmarModal() {
  error.value = null
  procesando.value = true
  try {
    // Mismos RPCs y convención de parámetros que la app iOS.
    if (modal.value === 'usar') {
      const { error: e } = await supabase.rpc('usar_hilo', {
        p_hilo_id: hiloID,
        // null (no ''): Postgres no puede castear '' a uuid
        p_proyecto_id: proyectoID.value || null,
        p_cantidad: String(cantidadConvertida.value),
        p_nota: nota.value || '',
      })
      if (e) throw e
    } else {
      // También convertida: se puede reponer en g/m/ovillos indistintamente.
      const { error: e } = await supabase.rpc('reponer_hilo', {
        p_hilo_id: hiloID,
        p_cantidad: String(cantidadConvertida.value),
        p_nota: nota.value || '',
      })
      if (e) throw e
    }
    modal.value = null
    await refresh()
    await refreshNuxtData('resumen_hilos')
  } catch (e: any) {
    error.value = e.message ?? 'No se pudo registrar'
  } finally {
    procesando.value = false
  }
}

const modalEliminar = ref(false)
const eliminando = ref(false)
const errorEliminar = ref<string | null>(null)

async function eliminar() {
  errorEliminar.value = null
  eliminando.value = true
  const { error: e } = await supabase.from('hilos').delete().eq('id', hiloID)
  eliminando.value = false
  if (e) {
    errorEliminar.value = e.message
    return
  }
  modalEliminar.value = false
  await refreshNuxtData('resumen_hilos')
  navigateTo('/')
}

const tipoLabel: Record<string, string> = {
  uso: 'Uso', reposicion: 'Reposición', ajuste: 'Ajuste', inicial: 'Inicial',
}
</script>

<template>
  <main class="mx-auto max-w-2xl px-4 py-8">
    <header class="mb-6 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <NuxtLink to="/" class="text-texto2">←</NuxtLink>
        <h1 class="text-xl font-bold">Detalle</h1>
      </div>
      <div class="flex gap-2">
        <NuxtLink
          :to="`/hilos/${hiloID}/editar`"
          class="rounded-xl border border-borde bg-blanco px-3 py-1.5 text-sm"
        >
          Editar
        </NuxtLink>
        <button
          class="rounded-xl bg-poco-bg px-3 py-1.5 text-sm font-medium text-poco-text"
          @click="errorEliminar = null; modalEliminar = true"
        >
          Eliminar
        </button>
      </div>
    </header>

    <p v-if="status === 'pending'" class="py-12 text-center text-texto2">Cargando…</p>

    <template v-else-if="hilo">
      <!-- Card principal -->
      <section class="rounded-2xl border border-borde bg-blanco p-5 text-center">
        <img
          v-if="hilo.imagen_url"
          :src="hilo.imagen_url"
          class="mb-4 h-44 w-full rounded-2xl object-cover"
          alt=""
        >
        <div
          v-else
          class="mb-4 h-44 w-full rounded-2xl"
          :style="{ backgroundColor: hilo.color ?? '#D6E6F2' }"
        />

        <h2 class="text-2xl font-bold">{{ hilo.nombre }}</h2>
        <p v-if="hilo.marca" class="text-rosa">{{ hilo.marca }}</p>

        <p class="mt-4 text-4xl font-bold">
          {{ hilo.cantidad_actual.toFixed(1) }} {{ hilo.unidad }}
        </p>

        <p
          v-if="ovillosDe(hilo.cantidad_actual, hilo.unidad, hilo.peso_por_ovillo, hilo.metros_por_ovillo) != null"
          class="mt-1 text-sm font-medium text-rosa"
        >
          ≈ {{ formatoOvillos(ovillosDe(hilo.cantidad_actual, hilo.unidad, hilo.peso_por_ovillo, hilo.metros_por_ovillo)!) }}
        </p>

        <template v-if="cantidadInicial">
          <p class="mt-1 text-sm text-texto2">
            de {{ cantidadInicial.toFixed(1) }} {{ hilo.unidad }}
          </p>
          <div class="mx-6 mt-3 h-2 overflow-hidden rounded-full bg-crema">
            <div
              class="h-full rounded-full"
              :class="(porcentaje ?? 100) < 30 ? 'bg-poco-text' : 'bg-verde-text'"
              :style="{ width: `${porcentaje}%` }"
            />
          </div>
        </template>

        <p
          v-if="stockBajo"
          class="mx-auto mt-3 flex w-fit items-center gap-1.5 rounded-full bg-poco-bg px-3 py-1.5 text-sm font-semibold text-poco-text"
        >
          <span class="text-base">⚠️</span> Stock bajo — considera reponer
        </p>

        <div class="mt-5 flex gap-3">
          <button
            class="flex-1 rounded-2xl bg-durazno-bg py-3 font-semibold text-durazno-text"
            @click="abrirModal('usar')"
          >
            ✂️ Usar
          </button>
          <button
            class="flex-1 rounded-2xl bg-verde-bg py-3 font-semibold text-verde-text"
            @click="abrirModal('reponer')"
          >
            ＋ Reponer
          </button>
        </div>
      </section>

      <!-- Detalles -->
      <section class="mt-6">
        <h3 class="mb-3 font-bold">Detalles</h3>
        <div class="grid grid-cols-2 gap-3">
          <div v-if="hilo.color" class="celda"><span>Color</span>{{ hilo.color }}</div>
          <div v-if="hilo.lote" class="celda"><span>Lote</span>{{ hilo.lote }}</div>
          <div v-if="hilo.composicion" class="celda"><span>Composición</span>{{ hilo.composicion }}</div>
          <div v-if="hilo.grosor != null" class="celda"><span>Grosor</span>{{ GROSOR_LABELS[hilo.grosor] }}</div>
          <div v-if="hilo.aguja_recomendada" class="celda"><span>Aguja</span>{{ hilo.aguja_recomendada }}</div>
          <div v-if="hilo.costo" class="celda"><span>Costo</span>{{ dinero(hilo.costo) }}</div>
          <div v-if="hilo.peso_por_ovillo" class="celda"><span>Peso/ovillo</span>{{ hilo.peso_por_ovillo }} g</div>
          <div v-if="hilo.metros_por_ovillo" class="celda"><span>Metros/ovillo</span>{{ hilo.metros_por_ovillo }} m</div>
          <div v-if="hilo.descripcion" class="celda col-span-2"><span>Descripción</span>{{ hilo.descripcion }}</div>
        </div>
      </section>

      <!-- Historial -->
      <section class="mt-6">
        <h3 class="mb-3 font-bold">Historial</h3>
        <p v-if="!movimientos.length" class="py-6 text-center text-sm text-texto2">
          Sin movimientos registrados
        </p>
        <ul v-else class="space-y-2">
          <li
            v-for="mov in movimientos"
            :key="mov.id"
            class="flex items-center gap-3 rounded-2xl border border-borde bg-blanco p-3"
          >
            <span
              class="flex h-9 w-9 items-center justify-center rounded-full text-sm"
              :class="mov.tipo === 'uso' ? 'bg-durazno-bg' : 'bg-verde-bg'"
            >
              {{ mov.tipo === 'uso' ? '✂️' : '＋' }}
            </span>
            <div class="min-w-0 flex-1">
              <p class="text-sm font-medium">
                {{ tipoLabel[mov.tipo] ?? mov.tipo }}
                <span :class="mov.tipo === 'uso' ? 'text-durazno-text' : 'text-verde-text'" class="font-bold">
                  {{ mov.tipo === 'uso' ? '−' : '+' }}{{ Math.abs(mov.cantidad).toFixed(1) }}
                </span>
              </p>
              <p v-if="mov.proyecto?.nombre" class="text-xs text-texto2">{{ mov.proyecto.nombre }}</p>
              <p v-if="mov.nota" class="text-xs text-texto2/70">{{ mov.nota }}</p>
            </div>
            <time class="shrink-0 text-xs text-texto2/60">
              {{ new Date(mov.created_at).toLocaleDateString('es-CL') }}
            </time>
          </li>
        </ul>
      </section>
    </template>

    <!-- Modal usar / reponer -->
    <div
      v-if="modal"
      class="fixed inset-0 z-50 flex items-end justify-center bg-black/30 sm:items-center"
      @click.self="modal = null"
    >
      <div class="w-full max-w-md rounded-t-3xl bg-crema p-6 sm:rounded-3xl">
        <h3 class="text-center text-lg font-bold">
          {{ modal === 'usar' ? '✂️ Usar hilo' : '＋ Reponer hilo' }}
        </h3>
        <p class="mb-4 mt-1 text-center text-xs text-texto2">
          {{ modal === 'usar'
            ? 'Ingresa cuánto hilo usaste, no lo que te queda'
            : 'Ingresa cuánto hilo agregaste al inventario' }}
        </p>

        <!-- Selector de unidad (usar y reponer, si hay datos de ovillo) -->
        <div v-if="modosDisponibles.length > 1" class="mb-3 flex gap-2">
          <button
            v-for="m in modosDisponibles" :key="m"
            class="flex-1 rounded-xl border py-2 text-sm font-medium"
            :class="modo === m ? 'border-rosa bg-rosa-pastel text-rosa' : 'border-borde bg-blanco text-texto2'"
            @click="modo = m"
          >
            {{ etiquetaModo(m) }}
          </button>
        </div>

        <label class="mb-1 block text-sm text-texto2">
          {{ modal === 'usar' ? 'Cantidad que usaste' : 'Cantidad que agregaste' }} ({{ etiquetaModo(modo) }})
          <input
            v-model.number="cantidad"
            type="number" min="0" step="any"
            :placeholder="modal === 'usar'
              ? `Ingresa el hilo que utilizaste (en ${etiquetaModo(modo)})`
              : `Ingresa el hilo que agregaste (en ${etiquetaModo(modo)})`"
            class="mt-1 w-full rounded-xl border border-borde bg-blanco px-3 py-2.5 outline-none placeholder:text-texto2/60 focus:border-rosa"
          >
        </label>

        <p v-if="modo !== 'unidad'" class="mb-2 text-center text-xs text-texto2">
          ≈ {{ cantidadConvertida.toFixed(1) }} {{ hilo?.unidad }}
        </p>
        <p v-if="stockInsuficiente" class="mb-2 text-xs text-poco-text">
          No tienes suficiente cantidad. Disponible: {{ hilo?.cantidad_actual.toFixed(1) }} {{ hilo?.unidad }}
        </p>
        <div class="mb-2" />

        <label v-if="modal === 'usar' && proyectos?.length" class="mb-3 block text-sm text-texto2">
          Proyecto (opcional)
          <select
            v-model="proyectoID"
            class="mt-1 w-full rounded-xl border border-borde bg-blanco px-3 py-2.5 outline-none focus:border-rosa"
          >
            <option value="">Sin proyecto</option>
            <option v-for="p in proyectos" :key="p.id" :value="p.id">{{ p.nombre }}</option>
          </select>
        </label>

        <label class="mb-4 block text-sm text-texto2">
          Nota (opcional)
          <input
            v-model="nota"
            class="mt-1 w-full rounded-xl border border-borde bg-blanco px-3 py-2.5 outline-none focus:border-rosa"
          >
        </label>

        <p v-if="error" class="mb-3 rounded-xl bg-rosa-pastel px-4 py-2 text-sm text-rosa">{{ error }}</p>

        <div class="flex gap-3">
          <button class="flex-1 rounded-2xl border border-borde bg-blanco py-3" @click="modal = null">
            Cancelar
          </button>
          <button
            :disabled="procesando || cantidad <= 0 || stockInsuficiente"
            class="flex-1 rounded-2xl py-3 font-semibold text-white disabled:opacity-40"
            :class="modal === 'usar' ? 'bg-durazno-text' : 'bg-verde-text'"
            @click="confirmarModal"
          >
            {{ procesando ? 'Registrando…' : stockInsuficiente ? 'Stock insuficiente' : 'Confirmar' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Confirmación de eliminación -->
    <ConfirmModal
      :abierto="modalEliminar"
      titulo="¿Eliminar hilo?"
      mensaje="Esta acción no se puede deshacer. Se perderá el historial de movimientos."
      :procesando="eliminando"
      :error="errorEliminar"
      @confirmar="eliminar"
      @cancelar="modalEliminar = false"
    />
  </main>
</template>

<style scoped>
.celda {
  @apply rounded-2xl border border-borde bg-blanco p-3 text-sm font-medium;
}
.celda span {
  @apply block text-xs font-normal text-texto2;
}
</style>
