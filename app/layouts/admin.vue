<script setup lang="ts">
const supabase = useSupabaseClient()
const route = useRoute()

async function salir() {
  await supabase.auth.signOut()
  navigateTo('/login')
}

function activa(to: string): boolean {
  return to === '/admin' ? route.path === '/admin' : route.path.startsWith(to)
}
</script>

<template>
  <div class="min-h-screen bg-crema pb-16">
    <header class="sticky top-0 z-30 border-b border-borde bg-blanco/90 backdrop-blur">
      <div class="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
        <NuxtLink to="/admin" class="flex items-baseline gap-2">
          <span class="text-xl font-bold text-rosa">nuditos</span>
          <span class="rounded-full bg-rosa-pastel px-2 py-0.5 text-xs font-semibold text-rosa">admin</span>
        </NuxtLink>
        <nav class="flex items-center gap-1 text-sm">
          <NuxtLink
            to="/admin"
            class="rounded-xl px-3 py-1.5 font-medium transition"
            :class="activa('/admin') ? 'bg-rosa-pastel text-rosa' : 'text-texto2 hover:text-rosa'"
          >
            Patrones
          </NuxtLink>
          <a
            href="/tienda"
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
