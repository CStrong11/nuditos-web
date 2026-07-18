<script setup lang="ts">
const route = useRoute()
const supabase = useSupabaseClient()
const insumoID = route.params.id as string

const { data, status, refresh } = await useAsyncData(`insumo-${insumoID}`, async () => {
  const [insumoRes, movsRes] = await Promise.all([
    supabase.from('insumos').select('*').eq('id', insumoID).single(),
    supabase
      .from('movimientos_insumo')
      .select('*, proyecto:proyecto_id(nombre)')
      .eq('insumo_id', insumoID)
      .order('created_at', { ascending: false }),
  ])
  if (insumoRes.error) throw insumoRes.error
  return { insumo: insumoRes.data as any, movimientos: (movsRes.data ?? []) as any[] }
})

const insumo = computed(() => data.value?.insumo)
const movimientos = computed(() => data.value?.movimientos ?? [])

const factorPieza = computed(() => unidadesPorPieza(insumo.value?.tipo_uso ?? 'unidad'))
const porPaquete = computed(() => Number(insumo.value?.unidades_por_paquete) || 0)

const stockBajo = computed(() => {
  const i = insumo.value
  if (!i) return false
  const min = Number(i.cantidad_minima)
  if (!min || Number.isNaN(min)) return false
  return Number(i.cantidad_actual) <= min
})

const porcentaje = computed(() => {
  const i = insumo.value
  if (!i) return null
  const ini = Number(i.cantidad_inicial)
  if (!ini) return null
  return Math.max(0, Math.min(100, (Number(i.cantidad_actual) / ini) * 100))
})

const costoUnitario = computed(() => insumo.value ? costoUnitarioInsumo(insumo.value) : null)

// --- Usar / Reponer ---
type Modo = 'pieza' | 'unidad' | 'paquete'
const modal = ref<'usar' | 'reponer' | null>(null)
const modo = ref<Modo>('pieza')
const cantidad = ref(1)
const nota = ref('')
const proyectoID = ref('')
const procesando = ref(false)
const error = ref<string | null>(null)

const modosDisponibles = computed<Modo[]>(() => {
  const modos: Modo[] = ['pieza']
  // Si es por pares, permitir también unidades sueltas
  if (factorPieza.value > 1) modos.push('unidad')
  if (porPaquete.value > 0) modos.push('paquete')
  return modos
})

function etiquetaModo(m: Modo): string {
  if (m === 'paquete') return 'paquetes'
  if (m === 'unidad') return 'unidades'
  return etiquetaPieza(insumo.value?.tipo_uso ?? 'unidad', 2, insumo.value?.unidad)
}

/// Lo ingresado convertido a UNIDADES sueltas (lo que se manda al RPC).
const cantidadUnidades = computed(() => {
  const n = Number(cantidad.value) || 0
  if (modo.value === 'paquete') return n * porPaquete.value
  if (modo.value === 'unidad') return n
  return n * factorPieza.value
})

const stockInsuficiente = computed(() =>
  modal.value === 'usar' && !!insumo.value && cantidadUnidades.value > Number(insumo.value.cantidad_actual),
)

const { data: proyectos } = await useAsyncData('proyectos-select-insumo', async () => {
  const { data: d } = await supabase.from('proyectos').select('id, nombre').order('nombre')
  return (d ?? []) as any[]
})

function abrirModal(tipo: 'usar' | 'reponer') {
  cantidad.value = 1
  nota.value = ''
  proyectoID.value = ''
  error.value = null
  modo.value = 'pieza'
  modal.value = tipo
}

onMounted(() => {
  const accion = route.query.accion
  if (accion === 'usar' || accion === 'reponer') abrirModal(accion)
})

async function confirmarModal() {
  error.value = null
  procesando.value = true
  try {
    if (modal.value === 'usar') {
      const { error: e } = await supabase.rpc('usar_insumo', {
        p_insumo_id: insumoID,
        p_cantidad: cantidadUnidades.value,
        p_proyecto_id: proyectoID.value || null,
        p_nota: nota.value || null,
      })
      if (e) throw e
    } else {
      const { error: e } = await supabase.rpc('reponer_insumo', {
        p_insumo_id: insumoID,
        p_cantidad: cantidadUnidades.value,
        p_nota: nota.value || null,
      })
      if (e) throw e
    }
    modal.value = null
    await refresh()
    await refreshNuxtData('insumos')
  } catch (e: any) {
    error.value = e.message ?? 'No se pudo registrar'
  } finally {
    procesando.value = false
  }
}

// --- Eliminar ---
const modalEliminar = ref(false)
const eliminando = ref(false)
const errorEliminar = ref<string | null>(null)

async function eliminar() {
  errorEliminar.value = null
  eliminando.value = true
  const { error: e } = await supabase.from('insumos').delete().eq('id', insumoID)
  eliminando.value = false
  if (e) { errorEliminar.value = e.message; return }
  modalEliminar.value = false
  await refreshNuxtData('insumos')
  navigateTo('/insumos')
}

const tipoLabel: Record<string, string> = {
  uso: 'Uso', reposicion: 'Reposición', ajuste: 'Ajuste', inicial: 'Inicial',
}

/// Muestra un movimiento en la medida más legible del insumo
function detalleMovimiento(mov: any): string {
  const c = Math.abs(Number(mov.cantidad))
  if (factorPieza.value > 1) {
    const p = c / 2
    return `${formatoNum(p)} ${p === 1 ? 'par' : 'pares'} (${formatoNum(c)} u.)`
  }
  return `${formatoNum(c)} ${etiquetaBase(insumo.value ?? { tipo_uso: 'unidad', unidad: null, unidades_por_paquete: null, costo: null }, c)}`
}
</script>

<template>
  <main class="mx-auto max-w-2xl px-4 py-8">
    <header class="mb-6 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <NuxtLink to="/insumos" class="text-texto2">←</NuxtLink>
        <h1 class="text-xl font-bold">Detalle</h1>
      </div>
      <div class="flex gap-2">
        <NuxtLink
          :to="`/insumos/${insumoID}/editar`"
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

    <template v-else-if="insumo">
      <section class="rounded-2xl border border-borde bg-blanco p-5 text-center">
        <img
          v-if="insumo.imagen_url"
          :src="insumo.imagen_url"
          class="mb-4 h-44 w-full rounded-2xl object-cover"
          alt=""
        >
        <div
          v-else
          class="mb-4 flex h-44 w-full items-center justify-center rounded-2xl text-5xl"
          :style="{ backgroundColor: insumo.color ?? '#D6E6F2' }"
        >
          🧷
        </div>

        <h2 class="text-2xl font-bold">{{ insumo.nombre }}</h2>
        <p v-if="insumo.marca" class="text-rosa">{{ insumo.marca }}</p>

        <!-- Cantidad principal: pares si aplica, si no la medida base -->
        <p class="mt-4 text-4xl font-bold">
          <template v-if="insumo.tipo_uso === 'par'">
            {{ formatoNum(Number(insumo.cantidad_actual) / 2) }}
            <span class="text-2xl">{{ Number(insumo.cantidad_actual) / 2 === 1 ? 'par' : 'pares' }}</span>
          </template>
          <template v-else>
            {{ formatoNum(Number(insumo.cantidad_actual)) }}
            <span class="text-2xl">{{ etiquetaBase(insumo, Number(insumo.cantidad_actual)) }}</span>
          </template>
        </p>

        <p class="mt-1 text-sm text-rosa">
          {{ medidasInsumo(Number(insumo.cantidad_actual), insumo).join(' · ') }}
        </p>

        <template v-if="porcentaje != null">
          <div class="mx-6 mt-3 h-2 overflow-hidden rounded-full bg-crema">
            <div
              class="h-full rounded-full"
              :class="stockBajo ? 'bg-poco-text' : 'bg-verde-text'"
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
          <div class="celda">
            <span>Se mide por</span>{{ TIPOS_USO_INSUMO.find(t => t.id === insumo.tipo_uso)?.label ?? 'Por unidad' }}
          </div>
          <div v-if="insumo.unidades_por_paquete" class="celda">
            <span>Por paquete</span>{{ formatoNum(Number(insumo.unidades_por_paquete)) }} {{ etiquetaBase(insumo) }}
          </div>
          <div v-if="insumo.costo" class="celda">
            <span>Precio del paquete</span>{{ dinero(Number(insumo.costo)) }}
          </div>
          <div v-if="costoUnitario != null" class="celda">
            <span>Costo por {{ insumo.tipo_uso === 'par' ? 'par' : etiquetaBase(insumo, 1) }}</span>
            {{ dinero(insumo.tipo_uso === 'par' ? costoUnitario * 2 : costoUnitario) }}
          </div>
          <div v-if="insumo.cantidad_minima" class="celda">
            <span>Stock mínimo</span>{{ formatoNum(Number(insumo.cantidad_minima)) }} {{ etiquetaBase(insumo) }}
          </div>
          <div v-if="insumo.color" class="celda"><span>Color</span>{{ insumo.color }}</div>
          <div v-if="insumo.descripcion" class="celda col-span-2">
            <span>Descripción</span>{{ insumo.descripcion }}
          </div>
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
                  {{ mov.tipo === 'uso' ? '−' : '+' }}{{ detalleMovimiento(mov) }}
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
          {{ modal === 'usar' ? '✂️ Usar insumo' : '＋ Reponer insumo' }}
        </h3>
        <p class="mb-4 mt-1 text-center text-xs text-texto2">
          {{ modal === 'usar'
            ? 'Ingresa cuánto usaste, no lo que te queda'
            : 'Ingresa cuánto agregaste al inventario' }}
        </p>

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
            class="mt-1 w-full rounded-xl border border-borde bg-blanco px-3 py-2.5 outline-none focus:border-rosa"
          >
        </label>

        <p v-if="modo !== 'unidad' && cantidadUnidades > 0" class="mb-2 text-center text-xs text-texto2">
          = {{ formatoNum(cantidadUnidades) }} {{ etiquetaBase(insumo!, cantidadUnidades) }}
          <template v-if="costoUnitario != null">
            · {{ dinero(cantidadUnidades * costoUnitario) }}
          </template>
        </p>
        <p v-if="stockInsuficiente" class="mb-2 text-xs text-poco-text">
          No tienes suficiente. Disponible: {{ formatoNum(Number(insumo?.cantidad_actual)) }} {{ etiquetaBase(insumo!) }}
        </p>

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

    <ConfirmModal
      :abierto="modalEliminar"
      titulo="¿Eliminar insumo?"
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
