<script setup lang="ts">
defineProps<{
  abierto: boolean
  titulo: string
  mensaje?: string
  confirmarTexto?: string
  procesando?: boolean
  error?: string | null
}>()

defineEmits<{ confirmar: [], cancelar: [] }>()
</script>

<template>
  <div
    v-if="abierto"
    class="fixed inset-0 z-50 flex items-end justify-center bg-black/30 sm:items-center"
    @click.self="$emit('cancelar')"
  >
    <div class="w-full max-w-sm rounded-t-3xl bg-crema p-6 sm:rounded-3xl">
      <h3 class="text-center text-lg font-bold">{{ titulo }}</h3>
      <p v-if="mensaje" class="mt-2 text-center text-sm text-texto2">{{ mensaje }}</p>

      <p v-if="error" class="mt-3 rounded-xl bg-poco-bg px-4 py-2 text-sm text-poco-text">
        {{ error }}
      </p>

      <div class="mt-5 flex gap-3">
        <button
          class="flex-1 rounded-2xl border border-borde bg-blanco py-3"
          @click="$emit('cancelar')"
        >
          Cancelar
        </button>
        <button
          :disabled="procesando"
          class="flex-1 rounded-2xl bg-poco-text py-3 font-semibold text-white disabled:opacity-40"
          @click="$emit('confirmar')"
        >
          {{ procesando ? 'Un momento…' : (confirmarTexto ?? 'Eliminar') }}
        </button>
      </div>
    </div>
  </div>
</template>
