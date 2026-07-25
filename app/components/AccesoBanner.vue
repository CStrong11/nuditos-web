<script setup lang="ts">
const { tieneAcceso, esVitalicia, enTrial, diasTrialRestantes } = useSuscripcion()

// Mostrar cuando: no hay acceso (modo lectura) o el trial está por terminar.
const mostrar = computed(() => {
  if (esVitalicia.value) return false
  if (!tieneAcceso.value) return true
  return enTrial.value && (diasTrialRestantes.value ?? 99) <= 7
})

const modoLectura = computed(() => !tieneAcceso.value)
</script>

<template>
  <NuxtLink
    v-if="mostrar"
    to="/plan"
    class="mx-auto flex max-w-3xl items-center gap-2 px-4 py-2 text-sm"
    :class="modoLectura ? 'text-poco-text' : 'text-texto'"
  >
    <div
      class="flex w-full items-center gap-2 rounded-xl px-3 py-2"
      :class="modoLectura ? 'bg-poco-bg' : 'bg-rosa-pastel'"
    >
      <span>{{ modoLectura ? '🔒' : '⏳' }}</span>
      <span class="flex-1 font-medium">
        <template v-if="modoLectura">
          Tu acceso terminó — modo solo lectura. Suscríbete para seguir editando.
        </template>
        <template v-else>
          Prueba gratis: te queda{{ diasTrialRestantes === 1 ? '' : 'n' }}
          {{ diasTrialRestantes }} día{{ diasTrialRestantes === 1 ? '' : 's' }}.
        </template>
      </span>
      <span class="shrink-0 rounded-lg bg-rosa px-2.5 py-1 text-xs font-semibold text-white">
        Ver planes
      </span>
    </div>
  </NuxtLink>
</template>
