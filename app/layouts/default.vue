<script setup lang="ts">
const tabs = [
  { to: '/', label: 'Hilos', icon: '🧶', tourId: 'nav-hilos' },
  { to: '/insumos', label: 'Insumos', icon: '🧷', tourId: 'nav-insumos' },
  { to: '/proyectos', label: 'Proyectos', icon: '🧺', tourId: 'nav-proyectos' },
  { to: '/resumen', label: 'Resumen', icon: '📊', tourId: 'nav-resumen' },
  { to: '/perfil', label: 'Perfil', icon: '👤', tourId: 'nav-perfil' },
]

const route = useRoute()
const user = useSupabaseUser()
const { cargar: cargarSuscripcion } = useSuscripcion()

onMounted(() => {
  cargarSuscripcion()
})

function activa(to: string): boolean {
  if (to === '/') return route.path === '/' || route.path.startsWith('/hilos')
  return route.path.startsWith(to)
}
</script>

<template>
  <div class="pb-24">
    <!-- Aviso de trial / modo solo lectura -->
    <AccesoBanner v-if="user" class="pt-3" />

    <!-- Aviso para definir el valor por hora -->
    <ValorHoraBanner v-if="user" />

    <slot />

    <nav class="fixed inset-x-0 bottom-0 z-30 border-t border-borde bg-blanco/90 backdrop-blur">
      <div class="mx-auto flex max-w-3xl justify-around">
        <NuxtLink
          v-for="tab in tabs"
          :key="tab.to"
          :to="tab.to"
          :data-tour="tab.tourId"
          class="relative flex flex-1 flex-col items-center gap-0.5 px-1 py-2.5 text-[11px] font-medium sm:text-xs"
          :class="activa(tab.to) ? 'text-rosa' : 'text-texto2'"
        >
          <span class="relative">
            <span class="text-xl" :class="activa(tab.to) ? '' : 'grayscale opacity-60'">{{ tab.icon }}</span>
          </span>
          {{ tab.label }}
        </NuxtLink>
      </div>
    </nav>
  </div>
</template>
