<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'admin' })
useHead({ title: 'Nuevo patrón — Admin Nuditos' })
</script>

<template>
  <div class="mx-auto max-w-xl">
    <div class="mb-5">
      <NuxtLink to="/admin" class="text-sm text-texto2 hover:text-rosa">← Volver</NuxtLink>
      <h1 class="mt-1 text-2xl font-bold text-texto">Nuevo patrón</h1>
    </div>
    <PatronForm />
  </div>
</template>
