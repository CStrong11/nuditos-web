<script setup lang="ts">
const props = defineProps<{
  insumo?: any // fila existente de `insumos` al editar
}>()

const supabase = useSupabaseClient()
const user = useSupabaseUser()

const editando = computed(() => !!props.insumo)

const form = reactive({
  nombre: props.insumo?.nombre ?? '',
  marca: props.insumo?.marca ?? '',
  color: props.insumo?.color ?? '',
  descripcion: props.insumo?.descripcion ?? '',
  tipo_uso: props.insumo?.tipo_uso ?? 'unidad',
  unidad: props.insumo?.unidad ?? null,
  // cantidad inicial: se ingresa en piezas (unidades o pares) o en paquetes
  cantidad: 0,
  cantidad_minima: props.insumo?.cantidad_minima ?? null,
  unidades_por_paquete: props.insumo?.unidades_por_paquete ?? null,
  costo: props.insumo?.costo ?? null,
})

const archivoFoto = ref<File | null>(null)
const previewFoto = ref<string | null>(props.insumo?.imagen_url ?? null)
const guardando = ref(false)
const error = ref<string | null>(null)

function elegirFoto(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  archivoFoto.value = file
  previewFoto.value = URL.createObjectURL(file)
}

// Al cambiar el tipo de uso, ajustar la unidad de medida
watch(() => form.tipo_uso, (t) => {
  form.unidad = unidadPorDefecto(t)
  if (!esMedible(t)) minimoUnidad.value = 'pieza'
})

const unidadesDisponibles = computed(() => unidadesDeTipo(form.tipo_uso))
const medible = computed(() => esMedible(form.tipo_uso))

// --- Precio: por paquete o por unidad ---
// Al editar, deducir el modo de los datos guardados.
const precioModo = ref<'paquete' | 'unidad'>(
  Number(props.insumo?.unidades_por_paquete) > 0
    ? 'paquete'
    : (props.insumo?.costo != null ? 'unidad' : 'paquete'),
)
// En modo "por unidad" no hay paquete: se limpia para que no aparezca en los
// selectores de cantidad ni afecte el costo.
watch(precioModo, (m) => { if (m === 'unidad') form.unidades_por_paquete = null })

/// Etiqueta de la unidad base para el precio unitario.
const etiquetaUnidadPrecio = computed(() => {
  if (form.tipo_uso === 'peso') return form.unidad || 'g'
  if (form.tipo_uso === 'longitud') return form.unidad || 'm'
  return 'unidad'
})

// --- Cantidad inicial: en piezas o en paquetes ---
const modoCantidad = ref<'pieza' | 'paquete'>('pieza')
const factorPieza = computed(() => unidadesPorPieza(form.tipo_uso))
const porPaquete = computed(() => Number(form.unidades_por_paquete) || 0)
const puedePaquete = computed(() => porPaquete.value > 0)

watch(puedePaquete, (ok) => { if (!ok) modoCantidad.value = 'pieza' })

/// Cantidad inicial convertida a UNIDADES sueltas (lo que se guarda).
const cantidadUnidades = computed(() => {
  const n = Number(form.cantidad) || 0
  return modoCantidad.value === 'paquete' && porPaquete.value > 0
    ? n * porPaquete.value
    : n * factorPieza.value
})

// --- Stock mínimo: en piezas o unidades ---
const minimoUnidad = ref<'pieza' | 'unidad'>('pieza')
const minimoMostrado = computed<number | null>({
  get() {
    const min = form.cantidad_minima
    if (min == null || (min as any) === '') return null
    return minimoUnidad.value === 'pieza'
      ? Math.round((Number(min) / factorPieza.value) * 100) / 100
      : Number(min)
  },
  set(v) {
    if (v == null || (v as any) === '') { form.cantidad_minima = null; return }
    form.cantidad_minima = minimoUnidad.value === 'pieza'
      ? Number(v) * factorPieza.value
      : Number(v)
  },
})

const costoUnitario = computed(() => costoUnitarioInsumo({
  tipo_uso: form.tipo_uso,
  unidad: form.unidad,
  unidades_por_paquete: precioModo.value === 'paquete' ? form.unidades_por_paquete : null,
  costo: form.costo,
}))

async function guardar() {
  error.value = null
  guardando.value = true
  try {
    const uid = userID(user.value)
    const payload: Record<string, any> = {
      nombre: form.nombre,
      marca: form.marca || null,
      color: form.color || null,
      descripcion: form.descripcion || null,
      tipo_uso: form.tipo_uso,
      unidad: medible.value ? (form.unidad || unidadPorDefecto(form.tipo_uso)) : null,
      cantidad_minima: form.cantidad_minima || null,
      // En modo "por unidad" no se guarda paquete; el costo es el precio unitario.
      unidades_por_paquete: precioModo.value === 'paquete' ? (form.unidades_por_paquete || null) : null,
      costo: form.costo || null,
    }

    let insumoID: string
    if (editando.value) {
      const { error: e1 } = await supabase.from('insumos').update(payload).eq('id', props.insumo.id)
      if (e1) throw e1
      insumoID = props.insumo.id
    } else {
      payload.user_id = uid
      payload.cantidad_actual = cantidadUnidades.value
      payload.cantidad_inicial = cantidadUnidades.value
      const { data, error: e1 } = await supabase.from('insumos').insert(payload).select('id').single()
      if (e1) throw e1
      insumoID = (data as any).id

      // Movimiento inicial para que quede en el historial
      if (cantidadUnidades.value > 0) {
        await supabase.from('movimientos_insumo').insert({
          user_id: uid,
          insumo_id: insumoID,
          cantidad: cantidadUnidades.value,
          tipo: 'inicial',
        })
      }
    }

    // La foto es opcional: si falla, no se pierde el insumo ya guardado
    // (si no, reintentar crearía duplicados).
    if (archivoFoto.value) {
      try {
        const url = await subirImagen(supabase, 'insumos', uid, insumoID, archivoFoto.value)
        const { error: e2 } = await supabase.from('insumos').update({ imagen_url: url }).eq('id', insumoID)
        if (e2) throw e2
      } catch (fotoErr: any) {
        console.warn('No se pudo subir la foto del insumo:', fotoErr)
      }
    }

    await refreshNuxtData('insumos')
    navigateTo(`/insumos/${insumoID}`)
  } catch (e: any) {
    error.value = e.message ?? 'No se pudo guardar'
  } finally {
    guardando.value = false
  }
}
</script>

<template>
  <form class="space-y-4" @submit.prevent="guardar">
    <!-- Foto -->
    <label class="block cursor-pointer">
      <span class="mb-2 block font-semibold">Foto</span>
      <div class="flex h-40 items-center justify-center overflow-hidden rounded-2xl border border-borde bg-blanco">
        <img v-if="previewFoto" :src="previewFoto" class="h-full w-full object-cover" alt="">
        <span v-else class="text-sm text-texto2">Agregar foto</span>
      </div>
      <input type="file" accept="image/*" class="hidden" @change="elegirFoto">
    </label>

    <div class="grid gap-3 sm:grid-cols-2">
      <input v-model="form.nombre" placeholder="Nombre (ej. Ojitos de seguridad 12mm)" class="campo sm:col-span-2">
      <input v-model="form.marca" placeholder="Marca (opcional)" class="campo">
      <input v-model="form.color" placeholder="Color (opcional)" class="campo">
    </div>

    <!-- Tipo de uso -->
    <div class="rounded-2xl border border-borde bg-blanco p-4">
      <p class="mb-1 font-semibold">¿Cómo se mide?</p>
      <p class="mb-3 text-xs text-texto2">
        Define cómo llevarás el inventario de este insumo.
      </p>
      <div class="grid grid-cols-2 gap-2">
        <button
          v-for="t in TIPOS_USO_INSUMO"
          :key="t.id" type="button"
          class="rounded-xl border px-2 py-2 text-sm font-medium"
          :class="form.tipo_uso === t.id ? 'border-rosa bg-rosa-pastel text-rosa' : 'border-borde text-texto2'"
          @click="form.tipo_uso = t.id"
        >
          {{ t.label }}
          <span class="mt-0.5 block text-[10px] font-normal opacity-70">{{ t.ayuda }}</span>
        </button>
      </div>

      <!-- Unidad de medida (solo peso / longitud) -->
      <div v-if="medible" class="mt-3">
        <p class="mb-1 text-sm text-texto2">Unidad de medida</p>
        <div class="flex gap-2">
          <button
            v-for="u in unidadesDisponibles" :key="u" type="button"
            class="flex-1 rounded-xl border py-2 text-sm font-medium"
            :class="form.unidad === u ? 'border-rosa bg-rosa-pastel text-rosa' : 'border-borde text-texto2'"
            @click="form.unidad = u"
          >
            {{ u }}
          </button>
        </div>
      </div>
    </div>

    <!-- Precio (opcional) -->
    <div class="rounded-2xl border border-borde bg-blanco p-4">
      <p class="mb-1 font-semibold">Precio <span class="text-xs font-normal text-texto2">(opcional)</span></p>
      <p class="mb-3 text-xs text-texto2">
        Para calcular cuánto aporta este insumo al costo de tus proyectos.
        Si no sabes el precio del paquete, ponlo por unidad.
      </p>

      <!-- Toggle: por paquete / por unidad -->
      <div class="mb-3 flex gap-2">
        <button
          type="button"
          class="flex-1 rounded-xl border py-2 text-sm font-medium"
          :class="precioModo === 'paquete' ? 'border-rosa bg-rosa-pastel text-rosa' : 'border-borde text-texto2'"
          @click="precioModo = 'paquete'"
        >
          Precio por paquete
        </button>
        <button
          type="button"
          class="flex-1 rounded-xl border py-2 text-sm font-medium"
          :class="precioModo === 'unidad' ? 'border-rosa bg-rosa-pastel text-rosa' : 'border-borde text-texto2'"
          @click="precioModo = 'unidad'"
        >
          Precio por {{ etiquetaUnidadPrecio }}
        </button>
      </div>

      <!-- Modo paquete: cuánto trae + precio del paquete -->
      <div v-if="precioModo === 'paquete'" class="grid gap-3 sm:grid-cols-2">
        <label class="text-sm text-texto2">
          {{ medible ? `Cuánto trae un paquete (${form.unidad || ''})` : 'Unidades por paquete' }}
          <input
            v-model.number="form.unidades_por_paquete"
            type="number" min="0" step="any"
            :placeholder="medible ? 'ej. 500' : 'ej. 50'"
            class="campo mt-1"
          >
        </label>
        <label class="text-sm text-texto2">
          Precio del paquete
          <input
            v-model.number="form.costo"
            type="number" min="0" step="any" placeholder="ej. 12000"
            class="campo mt-1"
          >
        </label>
      </div>

      <!-- Modo unidad: solo el precio unitario -->
      <label v-else class="block text-sm text-texto2">
        Precio por {{ etiquetaUnidadPrecio }}
        <input
          v-model.number="form.costo"
          type="number" min="0" step="any" placeholder="ej. 90"
          class="campo mt-1"
        >
        <span v-if="form.tipo_uso === 'par'" class="mt-1 block text-xs text-texto2/70">
          Es el precio de una sola unidad; el par cuesta el doble.
        </span>
      </label>

      <p v-if="costoUnitario != null" class="mt-2 text-xs text-texto2">
        Costo por {{ medible ? (form.unidad || '') : 'unidad' }}:
        <strong>{{ dinero(costoUnitario) }}</strong>
        <template v-if="form.tipo_uso === 'par'">
          · por par: <strong>{{ dinero(costoUnitario * 2) }}</strong>
        </template>
      </p>
    </div>

    <!-- Cantidad -->
    <div class="rounded-2xl border border-borde bg-blanco p-4">
      <p class="mb-3 font-semibold">Cantidad</p>

      <template v-if="!editando">
        <div class="mb-1 flex items-center justify-between">
          <span class="text-sm text-texto2">Cantidad inicial</span>
          <div v-if="puedePaquete" class="flex gap-1">
            <button
              type="button"
              class="rounded-lg px-2 py-0.5 text-xs font-medium"
              :class="modoCantidad === 'pieza' ? 'bg-rosa text-white' : 'text-texto2'"
              @click="modoCantidad = 'pieza'"
            >
              {{ etiquetaPieza(form.tipo_uso, 2, form.unidad) }}
            </button>
            <button
              type="button"
              class="rounded-lg px-2 py-0.5 text-xs font-medium"
              :class="modoCantidad === 'paquete' ? 'bg-rosa text-white' : 'text-texto2'"
              @click="modoCantidad = 'paquete'"
            >
              paquetes
            </button>
          </div>
        </div>
        <input
          v-model.number="form.cantidad"
          type="number" min="0" step="any"
          :placeholder="`Cuánto tienes (${modoCantidad === 'paquete' ? 'paquetes' : etiquetaPieza(form.tipo_uso, 2, form.unidad)})`"
          class="campo"
        >
        <p v-if="cantidadUnidades > 0" class="mt-1 text-xs text-texto2">
          = {{ formatoNum(cantidadUnidades) }} {{ etiquetaBase(form) }} en inventario
        </p>
      </template>
      <p v-else class="mb-3 text-xs text-texto2">
        La cantidad actual se gestiona con usar/reponer
      </p>

      <!-- Stock mínimo -->
      <div class="mt-4">
        <div class="mb-1 flex items-center justify-between">
          <span class="text-sm text-texto2">Stock mínimo</span>
          <div v-if="form.tipo_uso === 'par'" class="flex gap-1">
            <button
              type="button"
              class="rounded-lg px-2 py-0.5 text-xs font-medium"
              :class="minimoUnidad === 'pieza' ? 'bg-rosa text-white' : 'text-texto2'"
              @click="minimoUnidad = 'pieza'"
            >
              pares
            </button>
            <button
              type="button"
              class="rounded-lg px-2 py-0.5 text-xs font-medium"
              :class="minimoUnidad === 'unidad' ? 'bg-rosa text-white' : 'text-texto2'"
              @click="minimoUnidad = 'unidad'"
            >
              unidades
            </button>
          </div>
        </div>
        <input
          v-model.number="minimoMostrado"
          type="number" min="0" step="any"
          placeholder="Avísame cuando quede menos de…"
          class="campo"
        >
        <p v-if="form.tipo_uso === 'par' && form.cantidad_minima" class="mt-1 text-xs text-texto2/70">
          = {{ formatoNum(Number(form.cantidad_minima)) }} unidades
        </p>
        <p v-else-if="medible && form.cantidad_minima" class="mt-1 text-xs text-texto2/70">
          Avisar cuando quede menos de {{ formatoNum(Number(form.cantidad_minima)) }} {{ form.unidad }}
        </p>
      </div>
    </div>

    <label class="block text-sm text-texto2">
      Descripción <span class="text-xs">(opcional)</span>
      <textarea v-model="form.descripcion" rows="2" class="campo mt-1" />
    </label>

    <p v-if="error" class="rounded-xl bg-rosa-pastel px-4 py-2 text-sm text-rosa">{{ error }}</p>

    <button
      type="submit"
      :disabled="!form.nombre || guardando"
      class="w-full rounded-2xl bg-rosa py-3 font-semibold text-white disabled:opacity-40"
    >
      {{ guardando ? 'Guardando…' : (editando ? 'Guardar cambios' : 'Guardar') }}
    </button>
  </form>
</template>

<style scoped>
.campo {
  @apply w-full rounded-xl border border-borde bg-blanco px-3 py-2.5 text-texto outline-none placeholder:text-texto2/60 focus:border-rosa;
}
</style>
