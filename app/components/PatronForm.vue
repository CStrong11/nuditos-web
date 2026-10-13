<script setup lang="ts">
const props = defineProps<{
  patron?: any // fila existente de `patrones` al editar
}>()

const supabase = useSupabaseClient()
const user = useSupabaseUser()

const editando = computed(() => !!props.patron)

const form = reactive({
  titulo: props.patron?.titulo ?? '',
  descripcion: props.patron?.descripcion ?? '',
  precio: props.patron?.precio ?? null as number | null,
  precio_descuento: props.patron?.precio_descuento ?? null as number | null,
  estado: props.patron?.estado ?? 'borrador',
  fecha_lanzamiento: props.patron?.fecha_lanzamiento ?? '',
  dificultad: props.patron?.dificultad ?? '',
  destacado: props.patron?.destacado ?? false,
})

const conDescuento = ref(props.patron?.precio_descuento != null)

const archivoThumb = ref<File | null>(null)
const previewThumb = ref<string | null>(
  props.patron?.thumbnail_path ? thumbUrl(props.patron.thumbnail_path) : null,
)
const archivoPdf = ref<File | null>(null)
const pdfActual = ref<string | null>(props.patron?.pdf_path ?? null)

const guardando = ref(false)
const error = ref<string | null>(null)

const ESTADOS = [
  { id: 'borrador', label: 'Borrador', ayuda: 'Solo tú lo ves' },
  { id: 'publicado', label: 'Publicado', ayuda: 'A la venta ya' },
  { id: 'preventa', label: 'Preventa', ayuda: 'Se entrega al lanzar' },
  { id: 'archivado', label: 'Archivado', ayuda: 'Fuera de la tienda' },
]
const DIFICULTADES = ['principiante', 'intermedio', 'avanzado']

function thumbUrl(path: string): string {
  return supabase.storage.from('patrones-thumbs').getPublicUrl(path).data.publicUrl
}

function slugify(texto: string): string {
  return texto
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '') // quita acentos
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'patron'
}

/// Devuelve un slug único probando base, base-2, base-3…
async function slugUnico(base: string): Promise<string> {
  for (let i = 1; i <= 50; i++) {
    const intento = i === 1 ? base : `${base}-${i}`
    const { data } = await supabase.from('patrones').select('id').eq('slug', intento).maybeSingle()
    if (!data) return intento
  }
  return `${base}-${Date.now()}`
}

function elegirThumb(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  archivoThumb.value = file
  previewThumb.value = URL.createObjectURL(file)
}

function elegirPdf(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  archivoPdf.value = file
}

const tieneThumb = computed(() => !!archivoThumb.value || !!props.patron?.thumbnail_path)
const tienePdf = computed(() => !!archivoPdf.value || !!pdfActual.value)
const esVisible = computed(() => form.estado === 'publicado' || form.estado === 'preventa')

async function guardar() {
  error.value = null

  // Validaciones
  if (!form.titulo.trim()) { error.value = 'Ponle un título al patrón'; return }
  if (!form.precio || form.precio <= 0) { error.value = 'El precio debe ser mayor a 0'; return }
  if (conDescuento.value) {
    if (!form.precio_descuento || form.precio_descuento <= 0) { error.value = 'El precio con descuento debe ser mayor a 0'; return }
    if (form.precio_descuento >= form.precio) { error.value = 'El descuento debe ser menor al precio normal'; return }
  }
  if (form.estado === 'preventa' && !form.fecha_lanzamiento) {
    error.value = 'La preventa necesita una fecha de lanzamiento'; return
  }
  if (esVisible.value && (!tieneThumb.value || !tienePdf.value)) {
    error.value = 'Para publicar/preventa necesitas subir el thumbnail y el PDF'; return
  }

  guardando.value = true
  try {
    const uid = userID(user.value)
    const payload: Record<string, any> = {
      titulo: form.titulo.trim(),
      descripcion: form.descripcion?.trim() || null,
      precio: form.precio,
      precio_descuento: conDescuento.value ? form.precio_descuento : null,
      estado: form.estado,
      fecha_lanzamiento: form.estado === 'preventa' ? form.fecha_lanzamiento : null,
      dificultad: form.dificultad || null,
      destacado: form.destacado,
    }

    let patronId: string
    if (editando.value) {
      const { error: e1 } = await supabase.from('patrones').update(payload).eq('id', props.patron.id)
      if (e1) throw e1
      patronId = props.patron.id
    } else {
      payload.slug = await slugUnico(slugify(form.titulo))
      payload.creado_por = uid
      const { data, error: e1 } = await supabase.from('patrones').insert(payload).select('id').single()
      if (e1) throw e1
      patronId = (data as any).id
    }

    // Subir thumbnail (bucket público)
    if (archivoThumb.value) {
      const ext = (archivoThumb.value.name.split('.').pop() || 'jpg').toLowerCase()
      const path = `${patronId}/thumb.${ext}`
      const { error: e2 } = await supabase.storage
        .from('patrones-thumbs')
        .upload(path, archivoThumb.value, { contentType: archivoThumb.value.type || 'image/jpeg', upsert: true })
      if (e2) throw e2
      await supabase.from('patrones').update({ thumbnail_path: path }).eq('id', patronId)
    }

    // Subir PDF (bucket PRIVADO)
    if (archivoPdf.value) {
      const path = `${patronId}/patron.pdf`
      const { error: e3 } = await supabase.storage
        .from('patrones-pdf')
        .upload(path, archivoPdf.value, { contentType: 'application/pdf', upsert: true })
      if (e3) throw e3
      await supabase.from('patrones').update({ pdf_path: path }).eq('id', patronId)
    }

    await refreshNuxtData('admin-patrones')
    navigateTo('/')
  } catch (e: any) {
    error.value = e.message ?? 'No se pudo guardar'
  } finally {
    guardando.value = false
  }
}
</script>

<template>
  <form class="space-y-5" @submit.prevent="guardar">
    <!-- Thumbnail -->
    <label class="block cursor-pointer">
      <span class="mb-2 block font-semibold">Thumbnail <span class="text-xs font-normal text-texto2">(portada del patrón)</span></span>
      <div class="flex aspect-[4/3] max-w-xs items-center justify-center overflow-hidden rounded-2xl border border-borde bg-blanco">
        <img v-if="previewThumb" :src="previewThumb" class="h-full w-full object-cover" alt="">
        <span v-else class="text-sm text-texto2">Agregar imagen</span>
      </div>
      <input type="file" accept="image/*" class="hidden" @change="elegirThumb">
    </label>

    <!-- Datos básicos -->
    <div class="space-y-3">
      <input v-model="form.titulo" placeholder="Título (ej. Amigurumi Conejito Primavera)" class="campo">
      <textarea v-model="form.descripcion" rows="3" placeholder="Descripción: qué incluye, nivel, materiales sugeridos…" class="campo" />
    </div>

    <!-- Precio -->
    <div class="rounded-2xl border border-borde bg-blanco p-4">
      <p class="mb-3 font-semibold">Precio <span class="text-xs font-normal text-texto2">(USD)</span></p>
      <label class="block text-sm text-texto2">
        Precio normal
        <div class="relative mt-1">
          <span class="absolute left-3 top-1/2 -translate-y-1/2 text-texto2">$</span>
          <input v-model.number="form.precio" type="number" min="0" step="0.01" placeholder="5.00" class="campo pl-7">
        </div>
      </label>

      <label class="mt-3 flex items-center gap-2 text-sm">
        <input v-model="conDescuento" type="checkbox" class="h-4 w-4 accent-rosa">
        <span class="font-medium">Aplicar descuento</span>
      </label>
      <label v-if="conDescuento" class="mt-2 block text-sm text-texto2">
        Precio con descuento
        <div class="relative mt-1">
          <span class="absolute left-3 top-1/2 -translate-y-1/2 text-texto2">$</span>
          <input v-model.number="form.precio_descuento" type="number" min="0" step="0.01" placeholder="3.50" class="campo pl-7">
        </div>
      </label>
      <p v-if="conDescuento && form.precio && form.precio_descuento" class="mt-2 text-xs text-texto2">
        Se cobrará <strong class="text-rosa">${{ Number(form.precio_descuento).toFixed(2) }}</strong>
        (antes <span class="line-through">${{ Number(form.precio).toFixed(2) }}</span>)
      </p>
    </div>

    <!-- Estado -->
    <div class="rounded-2xl border border-borde bg-blanco p-4">
      <p class="mb-3 font-semibold">Estado</p>
      <div class="grid grid-cols-2 gap-2">
        <button
          v-for="s in ESTADOS" :key="s.id" type="button"
          class="rounded-xl border px-2 py-2 text-sm font-medium"
          :class="form.estado === s.id ? 'border-rosa bg-rosa-pastel text-rosa' : 'border-borde text-texto2'"
          @click="form.estado = s.id"
        >
          {{ s.label }}
          <span class="mt-0.5 block text-[10px] font-normal opacity-70">{{ s.ayuda }}</span>
        </button>
      </div>

      <div v-if="form.estado === 'preventa'" class="mt-3">
        <label class="block text-sm text-texto2">
          Fecha de lanzamiento <span class="text-xs">(se entrega el PDF ese día)</span>
          <input v-model="form.fecha_lanzamiento" type="date" class="campo mt-1">
        </label>
      </div>
    </div>

    <!-- Dificultad + destacado -->
    <div class="rounded-2xl border border-borde bg-blanco p-4">
      <p class="mb-2 font-semibold">Dificultad <span class="text-xs font-normal text-texto2">(opcional)</span></p>
      <div class="flex gap-2">
        <button
          v-for="d in DIFICULTADES" :key="d" type="button"
          class="flex-1 rounded-xl border py-2 text-sm font-medium capitalize"
          :class="form.dificultad === d ? 'border-rosa bg-rosa-pastel text-rosa' : 'border-borde text-texto2'"
          @click="form.dificultad = form.dificultad === d ? '' : d"
        >
          {{ d }}
        </button>
      </div>

      <label class="mt-4 flex items-center gap-2 text-sm">
        <input v-model="form.destacado" type="checkbox" class="h-4 w-4 accent-rosa">
        <span class="font-medium">Destacar en la portada</span>
        <span class="text-xs text-texto2">(aparece en la sección de la landing)</span>
      </label>
    </div>

    <!-- PDF -->
    <div class="rounded-2xl border border-borde bg-blanco p-4">
      <p class="mb-1 font-semibold">Archivo PDF <span class="text-xs font-normal text-texto2">(lo que recibe la compradora)</span></p>
      <p class="mb-3 text-xs text-texto2">Se guarda privado; solo se entrega por correo tras la compra.</p>
      <label class="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-borde px-4 py-3 text-sm">
        <span class="rounded-lg bg-rosa-pastel px-3 py-1.5 font-medium text-rosa">Elegir PDF</span>
        <span class="text-texto2">
          <template v-if="archivoPdf">{{ archivoPdf.name }}</template>
          <template v-else-if="pdfActual">PDF cargado ✓ (elige otro para reemplazar)</template>
          <template v-else>Ningún archivo</template>
        </span>
        <input type="file" accept="application/pdf" class="hidden" @change="elegirPdf">
      </label>
    </div>

    <p v-if="error" class="rounded-xl bg-rosa-pastel px-4 py-2 text-sm text-rosa">{{ error }}</p>

    <div class="flex gap-3">
      <NuxtLink to="/" class="flex-1 rounded-2xl border border-borde py-3 text-center font-semibold text-texto2">
        Cancelar
      </NuxtLink>
      <button
        type="submit"
        :disabled="guardando"
        class="flex-1 rounded-2xl bg-rosa py-3 font-semibold text-white disabled:opacity-40"
      >
        {{ guardando ? 'Guardando…' : (editando ? 'Guardar cambios' : 'Crear patrón') }}
      </button>
    </div>
  </form>
</template>

<style scoped>
.campo {
  @apply w-full rounded-xl border border-borde bg-blanco px-3 py-2.5 text-texto outline-none placeholder:text-texto2/60 focus:border-rosa;
}
</style>
