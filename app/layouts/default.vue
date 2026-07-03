<script setup lang="ts">
const tabs = [
  { to: '/', label: 'Hilos', icon: '🧶' },
  { to: '/proyectos', label: 'Proyectos', icon: '🧺' },
  { to: '/resumen', label: 'Resumen', icon: '📊' },
  { to: '/perfil', label: 'Perfil', icon: '👤' },
]

const route = useRoute()

function activa(to: string): boolean {
  if (to === '/') return route.path === '/' || route.path.startsWith('/hilos')
  return route.path.startsWith(to)
}
</script>

<template>
  <div class="pb-24">
    <slot />

    <nav class="fixed inset-x-0 bottom-0 border-t border-borde bg-white/90 backdrop-blur">
      <div class="mx-auto flex max-w-3xl justify-around">
        <NuxtLink
          v-for="tab in tabs"
          :key="tab.to"
          :to="tab.to"
          class="flex flex-col items-center gap-0.5 px-6 py-2.5 text-xs font-medium"
          :class="activa(tab.to) ? 'text-rosa' : 'text-texto2'"
        >
          <span class="text-xl" :class="activa(tab.to) ? '' : 'grayscale opacity-60'">{{ tab.icon }}</span>
          {{ tab.label }}
        </NuxtLink>
      </div>
    </nav>
  </div>
</template>
