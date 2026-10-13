<script setup lang="ts">
// Marco del panel admin. Se usa en la raíz del host admin y en /patron/*.
// No es un layout de Nuxt para no tener que alternar layout por host.
const supabase = useSupabaseClient()

// La tienda pública (donde compran las tejedoras) vive en www.
const tiendaUrl = computed(() => {
  if (import.meta.server) return 'https://www.nuditoscol.com/tienda-de-patrones'
  return location.hostname.endsWith('nuditoscol.com')
    ? 'https://www.nuditoscol.com/tienda-de-patrones'
    : '/tienda-de-patrones'
})

async function salir() {
  await supabase.auth.signOut()
  navigateTo('/login')
}
</script>

<template>
  <div class="min-h-screen bg-crema pb-16">
    <header class="sticky top-0 z-30 border-b border-borde bg-blanco/90 backdrop-blur">
      <div class="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
        <NuxtLink to="/" class="flex items-baseline gap-2">
          <span class="text-xl font-bold text-rosa">nuditos</span>
          <span class="rounded-full bg-rosa-pastel px-2 py-0.5 text-xs font-semibold text-rosa">admin</span>
        </NuxtLink>
        <nav class="flex items-center gap-1 text-sm">
          <NuxtLink
            to="/"
            class="rounded-xl px-3 py-1.5 font-medium text-texto2 transition hover:text-rosa"
          >
            Patrones
          </NuxtLink>
          <a
            :href="tiendaUrl"
            target="_blank"
            class="rounded-xl px-3 py-1.5 font-medium text-texto2 transition hover:text-rosa"
          >
            Ver tienda ↗
          </a>
          <button
            class="rounded-xl px-3 py-1.5 font-medium text-texto2 transition hover:text-rosa"
            @click="salir"
          >
            Salir
          </button>
        </nav>
      </div>
    </header>

    <main class="mx-auto max-w-4xl px-4 py-6">
      <slot />
    </main>
  </div>
</template>
