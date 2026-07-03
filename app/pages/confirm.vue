<script setup lang="ts">
// Página de aterrizaje del OAuth: el módulo de Supabase procesa el callback
// y cuando la sesión está lista redirigimos al inicio.
const user = useSupabaseUser()

watch(user, (u) => {
  if (u) navigateTo('/')
}, { immediate: true })
</script>

<template>
  <main class="flex min-h-screen items-center justify-center">
    <p class="text-texto2">Conectando…</p>
  </main>
</template>
