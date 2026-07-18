<script setup lang="ts">
const { vista, marcarVista } = useNovedadInsumos()

function verInsumos() {
  marcarVista()
  navigateTo('/insumos')
}
</script>

<template>
  <Transition
    enter-active-class="transition duration-300 ease-out"
    enter-from-class="translate-y-4 opacity-0"
    leave-active-class="transition duration-200 ease-in"
    leave-to-class="translate-y-4 opacity-0"
  >
    <div
      v-if="!vista"
      class="fixed inset-x-3 bottom-24 z-40 mx-auto max-w-sm rounded-2xl border border-borde bg-blanco p-4 shadow-lg sm:right-4 sm:left-auto"
    >
      <div class="flex items-start gap-3">
        <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-rosa-pastel text-lg">
          🧷
        </span>
        <div class="min-w-0 flex-1">
          <p class="text-sm font-bold">¡Nueva sección: Insumos!</p>
          <p class="mt-0.5 text-xs text-texto2">
            Lleva el inventario de ojitos, etiquetas, rellenos y más — y suma su costo a tus proyectos.
          </p>
          <div class="mt-3 flex gap-2">
            <button
              class="rounded-xl bg-rosa px-3 py-1.5 text-xs font-semibold text-white"
              @click="verInsumos"
            >
              Ver Insumos
            </button>
            <button
              class="rounded-xl border border-borde px-3 py-1.5 text-xs font-medium text-texto2"
              @click="marcarVista"
            >
              Ahora no
            </button>
          </div>
        </div>
        <button
          class="shrink-0 text-texto2/60 hover:text-texto"
          aria-label="Cerrar aviso"
          @click="marcarVista"
        >
          ✕
        </button>
      </div>
    </div>
  </Transition>
</template>
