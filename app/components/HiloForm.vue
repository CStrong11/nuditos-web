<script setup lang="ts">
const props = defineProps<{
  hilo?: any // fila existente de `hilos` al editar
}>()

const supabase = useSupabaseClient()
const user = useSupabaseUser()

const editando = computed(() => !!props.hilo)

const form = reactive({
  nombre: props.hilo?.nombre ?? '',
  marca: props.hilo?.marca ?? '',
  color: props.hilo?.color ?? '',
  lote: props.hilo?.lote ?? '',
  composicion: props.hilo?.composicion ?? '',
  grosor: props.hilo?.grosor ?? 3,
  aguja_recomendada: props.hilo?.aguja_recomendada ?? '',
  tipo_medida: props.hilo?.tipo_medida ?? 'peso',
  unidad: props.hilo?.unidad ?? 'g',
  cantidad: 0,
  cantidad_minima: props.hilo?.cantidad_minima ?? null,
  costo: props.hilo?.costo ?? null,
  peso_por_ovillo: props.hilo?.peso_por_ovillo ?? null,
  metros_por_ovillo: props.hilo?.metros_por_ovillo ?? null,
  descripcion: props.hilo?.descripcion ?? '',
})

const archivoFoto = ref<File | null>(null)
const previewFoto = ref<string | null>(props.hilo?.imagen_url ?? null)
const guardando = ref(false)
const error = ref<string | null>(null)

const unidades = computed(() =>
  form.tipo_medida === 'peso' ? ['g', 'kg', 'oz', 'lb'] : ['m', 'yd'],
)

watch(() => form.tipo_medida, (t) => {
  form.unidad = t === 'peso' ? 'g' : 'm'
})

// --- Stock mínimo en la unidad del hilo u ovillos ---
// cantidad_minima siempre se guarda en la unidad (g/m); la UI permite
// ingresarlo en ovillos y lo convierte usando el peso/metros por ovillo.
const minimoUnidad = ref<'unidad' | 'ovillo'>('unidad')

const factorOvillo = computed(() => {
  if (form.unidad === 'g') return Number(form.peso_por_ovillo) || 0
  if (form.unidad === 'm') return Number(form.metros_por_ovillo) || 0
  return 0
})
const puedeOvillos = computed(() => factorOvillo.value > 0)

// Si se quita el dato de ovillo, volver a la unidad.
watch(puedeOvillos, (ok) => { if (!ok) minimoUnidad.value = 'unidad' })

const minimoMostrado = computed<number | null>({
  get() {
    const min = form.cantidad_minima
    if (min == null || min === ('' as any)) return null
    if (minimoUnidad.value === 'ovillo' && factorOvillo.value > 0) {
      return Math.round((Number(min) / factorOvillo.value) * 100) / 100
    }
    return Number(min)
  },
  set(v) {
    if (v == null || (v as any) === '') { form.cantidad_minima = null; return }
    form.cantidad_minima = minimoUnidad.value === 'ovillo' && factorOvillo.value > 0
      ? Number(v) * factorOvillo.value
      : Number(v)
  },
})

function elegirFoto(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  archivoFoto.value = file
  previewFoto.value = URL.createObjectURL(file)
}

// --- Etiquetas ---
const etiquetas = ref<{ id: string, nombre: string }[]>([])
const tagsSeleccionados = ref<Set<string>>(new Set())
const nuevaEtiqueta = ref('')

onMounted(async () => {
  const { data } = await supabase.from('etiquetas').select('id, nombre').order('nombre')
  etiquetas.value = (data ?? []) as any[]
  if (props.hilo) {
    const { data: vinculadas } = await supabase
      .from('hilo_etiquetas')
      .select('etiqueta_id')
      .eq('hilo_id', props.hilo.id)
    tagsSeleccionados.value = new Set((vinculadas ?? []).map((v: any) => v.etiqueta_id))
  }
})

function toggleTag(id: string) {
  const s = new Set(tagsSeleccionados.value)
  s.has(id) ? s.delete(id) : s.add(id)
  tagsSeleccionados.value = s
}

async function crearEtiqueta() {
  const nombre = nuevaEtiqueta.value.trim()
  if (!nombre) return
  const { data, error: e } = await supabase
    .from('etiquetas')
    .insert({ nombre, user_id: userID(user.value) })
    .select('id, nombre')
    .single()
  if (e) { error.value = e.message; return }
  etiquetas.value.push(data as any)
  toggleTag((data as any).id)
  nuevaEtiqueta.value = ''
}

async function guardarEtiquetas(hiloID: string) {
  // Igual que iOS: desvincular todo y volver a vincular la selección.
  await supabase.from('hilo_etiquetas').delete().eq('hilo_id', hiloID)
  if (tagsSeleccionados.value.size) {
    const filas = [...tagsSeleccionados.value].map(etiqueta_id => ({
      hilo_id: hiloID,
      etiqueta_id,
      user_id: userID(user.value),
    }))
    const { error: e } = await supabase.from('hilo_etiquetas').insert(filas)
    if (e) throw e
  }
}

async function guardar() {
  error.value = null
  guardando.value = true
  try {
    const uid = userID(user.value)
    const payload: Record<string, any> = {
      nombre: form.nombre,
      marca: form.marca || null,
      color: form.color || null,
      lote: form.lote || null,
      composicion: form.composicion || null,
      grosor: form.grosor,
      aguja_recomendada: form.aguja_recomendada || null,
      tipo_medida: form.tipo_medida,
      unidad: form.unidad,
      cantidad_minima: form.cantidad_minima || null,
      costo: form.costo || null,
      peso_por_ovillo: form.peso_por_ovillo || null,
      metros_por_ovillo: form.metros_por_ovillo || null,
      descripcion: form.descripcion || null,
    }

    let hiloID: string
    if (editando.value) {
      const { error: e1 } = await supabase.from('hilos').update(payload).eq('id', props.hilo.id)
      if (e1) throw e1
      hiloID = props.hilo.id
    } else {
      payload.user_id = uid
      payload.cantidad_actual = form.cantidad
      const { data, error: e1 } = await supabase.from('hilos').insert(payload).select('id').single()
      if (e1) throw e1
      hiloID = (data as any).id
    }

    if (archivoFoto.value) {
      const url = await subirImagen(supabase, 'hilos', uid, hiloID, archivoFoto.value)
      const { error: e2 } = await supabase.from('hilos').update({ imagen_url: url }).eq('id', hiloID)
      if (e2) throw e2
    }

    await guardarEtiquetas(hiloID)
    await refreshNuxtData('resumen_hilos')
    navigateTo(`/hilos/${hiloID}`)
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
      <input v-model="form.nombre" placeholder="Nombre (obligatorio)" class="campo">
      <input v-model="form.marca" placeholder="Marca" class="campo">
      <input v-model="form.color" placeholder="Color (hex, ej: #C06B86)" class="campo">
      <input v-model="form.lote" placeholder="Lote de tintura" class="campo">
      <input v-model="form.composicion" placeholder="Composición" class="campo sm:col-span-2">
    </div>

    <!-- Medida -->
    <div class="rounded-2xl border border-borde bg-blanco p-4">
      <p class="mb-3 font-semibold">Medida</p>
      <div class="mb-3 flex gap-2">
        <button
          v-for="t in ['peso', 'longitud']" :key="t" type="button"
          class="flex-1 rounded-xl border py-2 text-sm font-medium capitalize"
          :class="form.tipo_medida === t ? 'border-rosa bg-rosa-pastel text-rosa' : 'border-borde text-texto2'"
          @click="form.tipo_medida = t"
        >
          {{ t }}
        </button>
      </div>
      <div class="mb-3 flex gap-2">
        <button
          v-for="u in unidades" :key="u" type="button"
          class="flex-1 rounded-xl border py-2 text-sm font-medium"
          :class="form.unidad === u ? 'border-rosa bg-rosa-pastel text-rosa' : 'border-borde text-texto2'"
          @click="form.unidad = u"
        >
          {{ u }}
        </button>
      </div>
      <label v-if="!editando" class="mb-3 block text-sm text-texto2">
        Cantidad inicial
        <input v-model.number="form.cantidad" type="number" min="0" step="any" class="campo mt-1">
      </label>
      <p v-else class="mb-3 text-xs text-texto2">
        La cantidad actual se gestiona con usar/reponer
      </p>

      <div class="text-sm text-texto2">
        <div class="mb-1 flex items-center justify-between">
          <span>Stock mínimo</span>
          <div v-if="puedeOvillos" class="flex gap-1">
            <button
              type="button"
              class="rounded-lg px-2 py-0.5 text-xs font-medium"
              :class="minimoUnidad === 'unidad' ? 'bg-rosa text-white' : 'text-texto2'"
              @click="minimoUnidad = 'unidad'"
            >
              {{ form.unidad }}
            </button>
            <button
              type="button"
              class="rounded-lg px-2 py-0.5 text-xs font-medium"
              :class="minimoUnidad === 'ovillo' ? 'bg-rosa text-white' : 'text-texto2'"
              @click="minimoUnidad = 'ovillo'"
            >
              ovillos
            </button>
          </div>
        </div>
        <input
          v-model.number="minimoMostrado"
          type="number" min="0" step="any"
          class="campo"
          :placeholder="minimoUnidad === 'ovillo' ? 'ej. 1 ovillo' : `ej. 20 ${form.unidad}`"
        >
        <p v-if="minimoUnidad === 'ovillo' && form.cantidad_minima" class="mt-1 text-xs text-texto2/70">
          = {{ Number(form.cantidad_minima).toFixed(1) }} {{ form.unidad }}
        </p>
      </div>
    </div>

    <!-- Detalles -->
    <div class="rounded-2xl border border-borde bg-blanco p-4">
      <p class="mb-3 font-semibold">Detalles</p>
      <div class="grid gap-3 sm:grid-cols-2">
        <label class="text-sm text-texto2">
          Grosor
          <select v-model.number="form.grosor" class="campo mt-1">
            <option v-for="(label, i) in GROSOR_LABELS" :key="i" :value="i">{{ label }}</option>
          </select>
        </label>
        <label class="text-sm text-texto2">
          Aguja recomendada
          <input v-model="form.aguja_recomendada" placeholder="ej: 4.0 mm" class="campo mt-1">
        </label>
        <label class="text-sm text-texto2">
          Costo (por ovillo)
          <input v-model.number="form.costo" type="number" min="0" step="any" class="campo mt-1">
        </label>
        <label class="text-sm text-texto2">
          Peso por ovillo (g)
          <input v-model.number="form.peso_por_ovillo" type="number" min="0" step="any" class="campo mt-1">
        </label>
        <label class="text-sm text-texto2">
          Metros por ovillo (m)
          <input v-model.number="form.metros_por_ovillo" type="number" min="0" step="any" class="campo mt-1">
        </label>
        <label class="text-sm text-texto2 sm:col-span-2">
          Descripción
          <textarea v-model="form.descripcion" rows="2" class="campo mt-1" />
        </label>
      </div>
    </div>

    <!-- Etiquetas -->
    <div class="rounded-2xl border border-borde bg-blanco p-4">
      <p class="mb-3 font-semibold">Etiquetas</p>

      <div class="mb-3 flex gap-2">
        <input
          v-model="nuevaEtiqueta"
          placeholder="Nueva etiqueta"
          class="campo flex-1"
          @keydown.enter.prevent="crearEtiqueta"
        >
        <button
          type="button"
          class="rounded-xl bg-rosa px-4 font-bold text-white"
          @click="crearEtiqueta"
        >
          +
        </button>
      </div>

      <p v-if="!etiquetas.length" class="text-sm text-texto2">No hay etiquetas aún</p>
      <div v-else class="flex flex-wrap gap-2">
        <button
          v-for="tag in etiquetas" :key="tag.id"
          type="button"
          class="rounded-xl border px-3 py-1 text-sm font-medium"
          :class="tagsSeleccionados.has(tag.id)
            ? 'border-rosa bg-rosa text-white'
            : 'border-borde bg-blanco text-texto'"
          @click="toggleTag(tag.id)"
        >
          {{ tag.nombre }}
        </button>
      </div>
    </div>

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
