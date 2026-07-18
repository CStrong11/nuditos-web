<script setup lang="ts">
const tabs = [
  { to: '/', label: 'Hilos', icon: '🧶' },
  { to: '/insumos', label: 'Insumos', icon: '🧷', novedad: true },
  { to: '/proyectos', label: 'Proyectos', icon: '🧺' },
  { to: '/resumen', label: 'Resumen', icon: '📊' },
  { to: '/perfil', label: 'Perfil', icon: '👤' },
]

const route = useRoute()
const user = useSupabaseUser()
const { vista, comprobar } = useNovedadInsumos()

onMounted(comprobar)

function activa(to: string): boolean {
  if (to === '/') return route.path === '/' || route.path.startsWith('/hilos')
  return route.path.startsWith(to)
}
</script>

<template>
  <div class="pb-24">
    <slot />

    <!-- Aviso flotante de novedad (solo con sesión iniciada) -->
    <NovedadToast v-if="user" />

    <nav class="fixed inset-x-0 bottom-0 z-50 border-t border-borde bg-blanco/90 backdrop-blur">
      <div class="mx-auto flex max-w-3xl justify-around">
        <NuxtLink
          v-for="tab in tabs"
          :key="tab.to"
          :to="tab.to"
          class="relative flex flex-1 flex-col items-center gap-0.5 px-1 py-2.5 text-[11px] font-medium sm:text-xs"
          :class="activa(tab.to) ? 'text-rosa' : 'text-texto2'"
        >
          <span class="relative">
            <span class="text-xl" :class="activa(tab.to) ? '' : 'grayscale opacity-60'">{{ tab.icon }}</span>
            <span
              v-if="tab.novedad && !vista"
              class="absolute -right-5 -top-1 rounded-full bg-rosa px-1.5 py-px text-[9px] font-bold uppercase leading-tight text-white shadow"
            >
              new
            </span>
          </span>
          {{ tab.label }}
        </NuxtLink>
      </div>
    </nav>
  </div>
</template>
