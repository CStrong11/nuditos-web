<script setup lang="ts">
definePageMeta({ layout: false })

const route = useRoute()
const supabase = useSupabaseClient()
const user = useSupabaseUser()
const slug = route.params.slug as string

const { data: patron } = await useAsyncData(`patron-${slug}`, async () => {
  const { data, error } = await supabase
    .from('patrones')
    .select('id, slug, titulo, descripcion, precio, precio_descuento, estado, dificultad, thumbnail_path, fecha_lanzamiento')
    .eq('slug', slug)
    .in('estado', ['publicado', 'preventa'])
    .maybeSingle()
  if (error) throw error
  return data
})

useHead(() => ({ title: patron.value ? `${patron.value.titulo} — Nuditos` : 'Patrón — Nuditos' }))

function thumbUrl(path: string | null): string | null {
  if (!path) return null
  return supabase.storage.from('patrones-thumbs').getPublicUrl(path).data.publicUrl
}
const efectivo = computed(() => patron.value ? Number(patron.value.precio_descuento ?? patron.value.precio) : 0)

// --- Compra ---
const modalAbierto = ref(false)
const email = ref('')
const procesando = ref(false)
const errorCompra = ref<string | null>(null)

watchEffect(() => { if (user.value?.email) email.value = user.value.email })

const emailValido = computed(() => /.+@.+\..+/.test(email.value.trim()))

async function comprar() {
  if (!emailValido.value || !patron.value) return
  errorCompra.value = null
  procesando.value = true
  try {
    const { url } = await $fetch<{ url: string }>('/api/tienda/checkout', {
      method: 'POST',
      body: { patronId: patron.value.id, email: email.value.trim() },
    })
    window.location.href = url
  } catch (e: any) {
    errorCompra.value = e?.statusMessage || 'No se pudo iniciar el pago. Intenta de nuevo.'
    procesando.value = false
  }
}
</script>

<template>
  <TiendaShell>
    <div v-if="!patron" class="rounded-2xl border border-borde bg-blanco p-12 text-center text-texto2">
      No encontramos este patrón.
      <NuxtLink to="/tienda-de-patrones" class="mt-3 block font-semibold text-rosa">← Ver la tienda</NuxtLink>
    </div>

    <template v-else>
      <NuxtLink to="/tienda-de-patrones" class="text-sm text-texto2 hover:text-rosa">← Tienda</NuxtLink>

      <div class="mt-3 grid gap-6 md:grid-cols-2">
        <!-- Imagen -->
        <div class="relative aspect-square overflow-hidden rounded-3xl border border-borde bg-blanco">
          <img v-if="thumbUrl(patron.thumbnail_path)" :src="thumbUrl(patron.thumbnail_path)!" :alt="patron.titulo" class="h-full w-full object-cover">
          <div v-else class="flex h-full w-full items-center justify-center text-6xl">🧶</div>
          <span v-if="patron.estado === 'preventa'" class="absolute left-3 top-3 rounded-full bg-rosa px-3 py-1 text-xs font-semibold text-white">
            Preventa
          </span>
        </div>

        <!-- Info -->
        <div>
          <h1 class="text-2xl font-bold text-texto sm:text-3xl">{{ patron.titulo }}</h1>
          <p v-if="patron.dificultad" class="mt-1 text-sm capitalize text-texto2">Nivel: {{ patron.dificultad }}</p>

          <div class="mt-4 flex items-baseline gap-2">
            <span class="text-3xl font-bold text-rosa">${{ efectivo.toFixed(2) }}</span>
            <span v-if="patron.precio_descuento" class="text-lg text-texto2 line-through">${{ Number(patron.precio).toFixed(2) }}</span>
            <span class="text-sm text-texto2">USD</span>
          </div>

          <p v-if="patron.estado === 'preventa' && patron.fecha_lanzamiento" class="mt-3 rounded-xl bg-rosa-pastel px-4 py-2 text-sm text-rosa">
            🗓️ Preventa — recibirás tu PDF por correo el <strong>{{ patron.fecha_lanzamiento }}</strong>.
          </p>

          <p v-if="patron.descripcion" class="mt-4 whitespace-pre-line text-sm leading-relaxed text-texto2">{{ patron.descripcion }}</p>

          <button
            class="mt-6 w-full rounded-2xl bg-rosa py-3.5 font-semibold text-white transition hover:opacity-90 sm:w-auto sm:px-10"
            @click="modalAbierto = true"
          >
            {{ patron.estado === 'preventa' ? 'Reservar en preventa' : 'Comprar patrón' }}
          </button>

          <p class="mt-3 text-xs text-texto2">
            📩 El PDF llega a tu correo. No necesitas crear cuenta. Pago seguro con tarjeta.
          </p>
        </div>
      </div>
    </template>

    <!-- Modal de compra -->
    <div v-if="modalAbierto" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" @click.self="modalAbierto = false">
      <div class="w-full max-w-sm rounded-3xl bg-blanco p-6">
        <h2 class="text-lg font-bold text-texto">¿A qué correo enviamos tu patrón?</h2>
        <p class="mt-1 text-sm text-texto2">Ahí recibirás el enlace de descarga del PDF.</p>
        <input
          v-model="email"
          type="email"
          inputmode="email"
          autocapitalize="none"
          placeholder="tucorreo@ejemplo.com"
          class="mt-4 w-full rounded-xl border border-borde bg-crema px-4 py-3 outline-none focus:border-rosa"
          @keyup.enter="comprar"
        >
        <p v-if="errorCompra" class="mt-2 text-sm text-rosa">{{ errorCompra }}</p>
        <div class="mt-4 flex gap-2">
          <button class="flex-1 rounded-2xl border border-borde py-3 font-semibold text-texto2" @click="modalAbierto = false">
            Cancelar
          </button>
          <button
            class="flex-1 rounded-2xl bg-rosa py-3 font-semibold text-white disabled:opacity-40"
            :disabled="!emailValido || procesando"
            @click="comprar"
          >
            {{ procesando ? 'Un momento…' : 'Ir a pagar' }}
          </button>
        </div>
      </div>
    </div>
  </TiendaShell>
</template>
