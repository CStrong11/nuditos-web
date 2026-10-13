<script setup lang="ts">
// Marco público de la tienda de patrones (www). Cabecera simple de marca.
const inicioUrl = computed(() => {
  if (import.meta.server) return 'https://www.nuditoscol.com'
  return location.hostname.endsWith('nuditoscol.com') ? 'https://www.nuditoscol.com' : '/'
})
</script>

<template>
  <div class="min-h-screen bg-crema pb-16">
    <header class="sticky top-0 z-30 border-b border-borde bg-crema/90 backdrop-blur">
      <div class="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <a :href="inicioUrl" class="text-xl font-bold text-rosa">nuditos</a>
        <NuxtLink to="/tienda-de-patrones" class="text-sm font-medium text-texto2 transition hover:text-rosa">
          Tienda de patrones
        </NuxtLink>
      </div>
    </header>
    <main class="mx-auto max-w-5xl px-4 py-6">
      <slot />
    </main>
  </div>
</template>
