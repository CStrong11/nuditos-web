<script setup lang="ts">
definePageMeta({ layout: false })
useHead({ title: '¡Gracias por tu compra! — Nuditos' })
</script>

<template>
  <TiendaShell>
    <div class="mx-auto max-w-md py-10 text-center">
      <div class="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-verde-bg text-3xl">✅</div>
      <h1 class="mt-5 text-2xl font-bold text-texto">¡Gracias por tu compra!</h1>
      <p class="mt-2 text-sm text-texto2">
        Te enviamos un correo con tu patrón. Revisa tu bandeja de entrada (y la carpeta de spam, por si acaso).
        Si es una preventa, te llegará el día del lanzamiento. 💛
      </p>
      <NuxtLink
        to="/tienda-de-patrones"
        class="mt-6 inline-block rounded-2xl bg-rosa px-6 py-3 font-semibold text-white transition hover:opacity-90"
      >
        Seguir viendo patrones
      </NuxtLink>
    </div>
  </TiendaShell>
</template>
