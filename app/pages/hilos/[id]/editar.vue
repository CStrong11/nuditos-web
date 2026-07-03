<script setup lang="ts">
const route = useRoute()
const supabase = useSupabaseClient()
const hiloID = route.params.id as string

const { data: hilo, status } = await useAsyncData(`hilo-editar-${hiloID}`, async () => {
  const { data, error } = await supabase.from('hilos').select('*').eq('id', hiloID).single()
  if (error) throw error
  return data as any
})
</script>

<template>
  <main class="mx-auto max-w-2xl px-4 py-8">
    <header class="mb-6 flex items-center gap-3">
      <NuxtLink :to="`/hilos/${hiloID}`" class="text-texto2">←</NuxtLink>
      <h1 class="text-xl font-bold">Editar hilo</h1>
    </header>
    <p v-if="status === 'pending'" class="py-12 text-center text-texto2">Cargando…</p>
    <HiloForm v-else-if="hilo" :hilo="hilo" />
  </main>
</template>
