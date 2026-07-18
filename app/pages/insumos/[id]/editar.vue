<script setup lang="ts">
const route = useRoute()
const supabase = useSupabaseClient()
const insumoID = route.params.id as string

const { data: insumo, status } = await useAsyncData(`insumo-editar-${insumoID}`, async () => {
  const { data, error } = await supabase.from('insumos').select('*').eq('id', insumoID).single()
  if (error) throw error
  return data as any
})
</script>

<template>
  <main class="mx-auto max-w-2xl px-4 py-8">
    <header class="mb-6 flex items-center gap-3">
      <NuxtLink :to="`/insumos/${insumoID}`" class="text-texto2">←</NuxtLink>
      <h1 class="text-xl font-bold">Editar insumo</h1>
    </header>
    <p v-if="status === 'pending'" class="py-12 text-center text-texto2">Cargando…</p>
    <InsumoForm v-else-if="insumo" :insumo="insumo" />
  </main>
</template>
