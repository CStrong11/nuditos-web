<script setup lang="ts">
definePageMeta({ layout: false })

const route = useRoute()
const supabase = useSupabaseClient()
const id = route.params.id as string

const { data: patron, error: cargaError } = await useAsyncData(`admin-patron-${id}`, async () => {
  const { data, error } = await supabase.from('patrones').select('*').eq('id', id).maybeSingle()
  if (error) throw error
  return data
})

useHead({ title: () => (patron.value ? `${patron.value.titulo} — Admin` : 'Patrón — Admin') })

const borrando = ref(false)
const confirmar = ref(false)
const errorBorrar = ref<string | null>(null)

async function eliminar() {
  errorBorrar.value = null
  borrando.value = true
  try {
    const { error } = await supabase.from('patrones').delete().eq('id', id)
    if (error) {
      errorBorrar.value = 'Este patrón ya tiene ventas, no se puede borrar. Cámbialo a "Archivado" para sacarlo de la tienda.'
      confirmar.value = false
      return
    }
    if (patron.value?.thumbnail_path) {
      await supabase.storage.from('patrones-thumbs').remove([patron.value.thumbnail_path])
    }
    if (patron.value?.pdf_path) {
      await supabase.storage.from('patrones-pdf').remove([patron.value.pdf_path])
    }
    await refreshNuxtData('admin-patrones')
    navigateTo('/')
  } finally {
    borrando.value = false
  }
}
</script>

<template>
  <AdminShell>
    <div class="mx-auto max-w-xl">
      <div class="mb-5">
        <NuxtLink to="/" class="text-sm text-texto2 hover:text-rosa">← Volver</NuxtLink>
        <h1 class="mt-1 text-2xl font-bold text-texto">Editar patrón</h1>
      </div>

      <div v-if="cargaError || !patron" class="rounded-2xl border border-borde bg-blanco p-8 text-center text-texto2">
        No se encontró el patrón.
      </div>

      <template v-else>
        <PatronForm :patron="patron" />

        <!-- Zona peligrosa -->
        <div class="mt-8 rounded-2xl border border-borde bg-blanco p-4">
          <p class="font-semibold text-texto">Eliminar patrón</p>
          <p class="mt-1 text-xs text-texto2">
            Se borra el patrón y sus archivos. Si ya tiene ventas, mejor archívalo.
          </p>
          <p v-if="errorBorrar" class="mt-2 rounded-xl bg-rosa-pastel px-3 py-2 text-sm text-rosa">{{ errorBorrar }}</p>

          <div v-if="!confirmar" class="mt-3">
            <button class="rounded-xl border border-rosa px-4 py-2 text-sm font-semibold text-rosa" @click="confirmar = true">
              Eliminar
            </button>
          </div>
          <div v-else class="mt-3 flex gap-2">
            <button class="rounded-xl border border-borde px-4 py-2 text-sm font-medium text-texto2" @click="confirmar = false">
              Cancelar
            </button>
            <button
              class="rounded-xl bg-rosa px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
              :disabled="borrando"
              @click="eliminar"
            >
              {{ borrando ? 'Eliminando…' : 'Sí, eliminar' }}
            </button>
          </div>
        </div>
      </template>
    </div>
  </AdminShell>
</template>
