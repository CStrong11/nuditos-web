<script setup lang="ts">
definePageMeta({ layout: 'admin' })
useHead({ title: 'Acceso restringido — Admin Nuditos' })

const appUrl = computed(() => {
  if (import.meta.server) return 'https://app.nuditoscol.com'
  return location.hostname.endsWith('nuditoscol.com')
    ? 'https://app.nuditoscol.com'
    : '/inicio'
})
</script>

<template>
  <div class="mx-auto max-w-md pt-10 text-center">
    <div class="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-crema text-3xl">
      🔒
    </div>
    <h1 class="mt-5 text-2xl font-bold text-texto">Acceso restringido</h1>
    <p class="mt-2 text-sm text-texto2">
      Este panel es solo para las administradoras de la tienda. Si crees que deberías
      tener acceso, pídele a Nuditos que active tu cuenta.
    </p>
    <a
      :href="appUrl"
      class="mt-6 inline-block rounded-2xl bg-rosa px-6 py-3 font-semibold text-white transition hover:opacity-90"
    >
      Ir a la app
    </a>
  </div>
</template>
