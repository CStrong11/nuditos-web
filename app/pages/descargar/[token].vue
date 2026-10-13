<script setup lang="ts">
definePageMeta({ layout: false })
useHead({ title: 'Descargar patrón — Nuditos' })

const route = useRoute()
const token = route.params.token as string

const cargando = ref(true)
const resultado = ref<any>(null)
const error = ref<string | null>(null)

async function pedir() {
  cargando.value = true
  error.value = null
  try {
    resultado.value = await $fetch('/api/tienda/descarga', { method: 'POST', body: { token } })
    // Si está disponible, dispara la descarga automáticamente.
    if (resultado.value?.disponible && import.meta.client) {
      window.location.href = resultado.value.url
    }
  } catch (e: any) {
    error.value = e?.statusMessage || 'No encontramos esta descarga. Revisa el enlace.'
  } finally {
    cargando.value = false
  }
}

onMounted(pedir)
</script>

<template>
  <main class="flex min-h-screen items-center justify-center bg-crema px-4">
    <div class="w-full max-w-sm rounded-3xl border border-borde bg-blanco p-8 text-center">
      <div class="text-2xl font-bold text-rosa">nuditos</div>

      <template v-if="cargando">
        <p class="mt-6 text-sm text-texto2">Preparando tu descarga…</p>
      </template>

      <template v-else-if="error">
        <div class="mx-auto mt-5 flex h-14 w-14 items-center justify-center rounded-full bg-crema text-2xl">⚠️</div>
        <p class="mt-4 text-sm text-texto2">{{ error }}</p>
      </template>

      <!-- Preventa aún no disponible -->
      <template v-else-if="resultado && !resultado.disponible && resultado.motivo === 'preventa'">
        <div class="mx-auto mt-5 flex h-14 w-14 items-center justify-center rounded-full bg-rosa-pastel text-2xl">⏳</div>
        <h1 class="mt-4 text-lg font-bold text-texto">Aún no está disponible</h1>
        <p class="mt-2 text-sm text-texto2">
          Este patrón es de preventa. Te enviaremos el PDF por correo el
          <strong class="text-rosa">{{ resultado.fecha }}</strong>, el día de su lanzamiento.
        </p>
      </template>

      <!-- No disponible (reembolso / expirado) -->
      <template v-else-if="resultado && !resultado.disponible">
        <div class="mx-auto mt-5 flex h-14 w-14 items-center justify-center rounded-full bg-crema text-2xl">🔒</div>
        <p class="mt-4 text-sm text-texto2">{{ resultado.motivo }}</p>
      </template>

      <!-- Listo -->
      <template v-else-if="resultado?.disponible">
        <div class="mx-auto mt-5 flex h-14 w-14 items-center justify-center rounded-full bg-verde-bg text-2xl">✅</div>
        <h1 class="mt-4 text-lg font-bold text-texto">¡Tu patrón está listo!</h1>
        <p class="mt-2 text-sm text-texto2">La descarga debería empezar sola. ¿No pasó nada?</p>
        <a :href="resultado.url" class="mt-4 inline-block rounded-2xl bg-rosa px-6 py-3 font-semibold text-white">
          Descargar {{ resultado.titulo }}
        </a>
      </template>
    </div>
  </main>
</template>
