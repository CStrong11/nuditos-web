<script setup lang="ts">
const user = useSupabaseUser()
</script>

<template>
  <div class="min-h-screen">
    <header class="border-b border-borde bg-blanco">
      <div class="mx-auto flex max-w-3xl items-center gap-3 px-4 py-4">
        <NuxtLink :to="user ? '/perfil' : '/login'" class="text-texto2 hover:text-rosa">
          ← Volver
        </NuxtLink>
        <img src="/nuditos-logo.png" alt="" class="ml-auto h-8 w-auto">
        <span class="font-bold text-rosa">nuditos</span>
      </div>
    </header>

    <main class="legal mx-auto max-w-3xl px-4 py-8 pb-20">
      <slot />
    </main>

    <footer class="border-t border-borde px-4 py-6 text-center text-xs text-texto2/60">
      <div class="flex flex-wrap justify-center gap-x-4 gap-y-1">
        <NuxtLink to="/terminos" class="hover:text-rosa">Términos y Condiciones</NuxtLink>
        <NuxtLink to="/privacidad" class="hover:text-rosa">Política de Privacidad</NuxtLink>
        <NuxtLink to="/reembolsos" class="hover:text-rosa">Política de Reembolsos</NuxtLink>
      </div>
      <p class="mt-3">© 2026 nuditos</p>
    </footer>
  </div>
</template>

<style scoped>
.legal :deep(h1) {
  @apply mb-2 text-3xl font-bold text-rosa;
}
.legal :deep(.actualizado) {
  @apply mb-8 text-sm text-texto2;
}
.legal :deep(h2) {
  @apply mb-3 mt-8 border-b border-borde pb-2 text-xl font-bold text-texto;
}
.legal :deep(h3) {
  @apply mb-2 mt-5 font-semibold text-texto;
}
.legal :deep(p) {
  @apply mb-3 leading-relaxed text-texto;
}
.legal :deep(ul) {
  @apply mb-4 list-disc space-y-1.5 pl-6 text-texto;
}
.legal :deep(li) {
  @apply leading-relaxed;
}
.legal :deep(strong) {
  @apply font-semibold;
}
.legal :deep(.aviso) {
  @apply my-4 rounded-xl border border-borde bg-blanco p-4 text-sm;
}
.legal :deep(.dato) {
  @apply rounded bg-rosa-pastel px-1.5 py-0.5 font-medium text-rosa;
}
</style>
