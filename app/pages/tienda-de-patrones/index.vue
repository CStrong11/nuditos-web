<script setup lang="ts">
definePageMeta({ layout: false })
useHead({
  title: 'Tienda de patrones — Nuditos',
  meta: [{ name: 'description', content: 'Patrones de tejido en PDF para crochet y amigurumi, listos para descargar.' }],
})

const supabase = useSupabaseClient()

const { data: patrones } = await useAsyncData('tienda-catalogo', async () => {
  const { data, error } = await supabase
    .from('patrones')
    .select('slug, titulo, precio, precio_descuento, estado, dificultad, thumbnail_path, fecha_lanzamiento, destacado, creado_en')
    .in('estado', ['publicado', 'preventa'])
    .order('destacado', { ascending: false })
    .order('creado_en', { ascending: false })
  if (error) throw error
  return data ?? []
})

function thumbUrl(path: string | null): string | null {
  if (!path) return null
  return supabase.storage.from('patrones-thumbs').getPublicUrl(path).data.publicUrl
}
function efectivo(p: any): number { return Number(p.precio_descuento ?? p.precio) }
</script>

<template>
  <TiendaShell>
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-texto sm:text-3xl">Tienda de patrones</h1>
      <p class="mt-1 text-texto2">Patrones en PDF listos para descargar. Págalo una vez, téjelo mil veces. 🧶</p>
    </div>

    <div v-if="!patrones?.length" class="rounded-2xl border border-dashed border-borde bg-blanco p-12 text-center text-texto2">
      Pronto tendremos patrones nuevos por aquí. ¡Vuelve prontito!
    </div>

    <div v-else class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      <NuxtLink
        v-for="p in patrones"
        :key="p.slug"
        :to="`/tienda-de-patrones/${p.slug}`"
        class="group overflow-hidden rounded-2xl border border-borde bg-blanco transition hover:border-rosa hover:shadow-sm"
      >
        <div class="relative aspect-square overflow-hidden bg-crema">
          <img v-if="thumbUrl(p.thumbnail_path)" :src="thumbUrl(p.thumbnail_path)!" :alt="p.titulo" class="h-full w-full object-cover transition group-hover:scale-105">
          <div v-else class="flex h-full w-full items-center justify-center text-4xl">🧶</div>
          <span v-if="p.estado === 'preventa'" class="absolute left-2 top-2 rounded-full bg-rosa px-2 py-0.5 text-[11px] font-semibold text-white">
            Preventa
          </span>
          <span v-else-if="p.precio_descuento" class="absolute left-2 top-2 rounded-full bg-verde-text px-2 py-0.5 text-[11px] font-semibold text-white">
            Oferta
          </span>
        </div>
        <div class="p-3">
          <p class="truncate text-sm font-semibold text-texto">{{ p.titulo }}</p>
          <p v-if="p.dificultad" class="mt-0.5 text-xs capitalize text-texto2">{{ p.dificultad }}</p>
          <p class="mt-1.5">
            <span class="font-bold text-rosa">${{ efectivo(p).toFixed(2) }}</span>
            <span v-if="p.precio_descuento" class="ml-1 text-xs text-texto2 line-through">${{ Number(p.precio).toFixed(2) }}</span>
            <span class="ml-0.5 text-[11px] text-texto2">USD</span>
          </p>
        </div>
      </NuxtLink>
    </div>
  </TiendaShell>
</template>
