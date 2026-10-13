<script setup lang="ts">
// Lista de patrones del panel admin. Se renderiza en la raíz del host admin
// (admin.nuditoscol.com) desde pages/index.vue.
const supabase = useSupabaseClient()

const { data: patrones } = await useAsyncData('admin-patrones', async () => {
  const { data, error } = await supabase
    .from('patrones')
    .select('*')
    .order('creado_en', { ascending: false })
  if (error) throw error
  return data ?? []
})

const { data: compras } = await useAsyncData('admin-ventas', async () => {
  const { data, error } = await supabase
    .from('compras_patron')
    .select('patron_id, monto, estado')
  if (error) throw error
  return data ?? []
})

const ventasPorPatron = computed(() => {
  const mapa: Record<string, { n: number; total: number }> = {}
  for (const c of compras.value ?? []) {
    if (c.estado === 'reembolsada') continue
    const m = (mapa[c.patron_id] ??= { n: 0, total: 0 })
    m.n += 1
    m.total += Number(c.monto) || 0
  }
  return mapa
})

const totales = computed(() => {
  let n = 0, total = 0
  for (const v of Object.values(ventasPorPatron.value)) { n += v.n; total += v.total }
  return { n, total }
})

function thumbUrl(path: string | null): string | null {
  if (!path) return null
  return supabase.storage.from('patrones-thumbs').getPublicUrl(path).data.publicUrl
}

const BADGE: Record<string, string> = {
  borrador: 'bg-crema text-texto2',
  publicado: 'bg-verde-bg text-verde-text',
  preventa: 'bg-rosa-pastel text-rosa',
  archivado: 'bg-crema text-texto2/60',
}

function precioMostrado(p: any): string {
  const efectivo = p.precio_descuento ?? p.precio
  return `$${Number(efectivo).toFixed(2)}`
}
</script>

<template>
  <AdminShell>
    <div class="mb-6 flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-texto">Tienda de patrones</h1>
        <p class="mt-0.5 text-sm text-texto2">
          {{ totales.n }} {{ totales.n === 1 ? 'venta' : 'ventas' }} · ${{ totales.total.toFixed(2) }} USD
        </p>
      </div>
      <NuxtLink
        to="/patron/nuevo"
        class="rounded-2xl bg-rosa px-4 py-2.5 text-sm font-semibold text-white"
      >
        + Nuevo patrón
      </NuxtLink>
    </div>

    <div v-if="!patrones?.length" class="rounded-2xl border border-dashed border-borde bg-blanco p-10 text-center">
      <p class="text-texto2">Aún no hay patrones.</p>
      <NuxtLink to="/patron/nuevo" class="mt-3 inline-block font-semibold text-rosa">
        Sube el primero →
      </NuxtLink>
    </div>

    <div v-else class="grid gap-3 sm:grid-cols-2">
      <NuxtLink
        v-for="p in patrones"
        :key="p.id"
        :to="`/patron/${p.id}`"
        class="flex gap-3 rounded-2xl border border-borde bg-blanco p-3 transition hover:border-rosa"
      >
        <div class="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-crema">
          <img v-if="thumbUrl(p.thumbnail_path)" :src="thumbUrl(p.thumbnail_path)!" class="h-full w-full object-cover" alt="">
          <div v-else class="flex h-full w-full items-center justify-center text-2xl">🧶</div>
        </div>
        <div class="min-w-0 flex-1">
          <div class="flex items-start justify-between gap-2">
            <p class="truncate font-semibold text-texto">{{ p.titulo }}</p>
            <span class="shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize" :class="BADGE[p.estado]">
              {{ p.estado }}
            </span>
          </div>
          <p class="mt-1 text-sm">
            <span class="font-semibold text-rosa">{{ precioMostrado(p) }}</span>
            <span v-if="p.precio_descuento" class="ml-1 text-xs text-texto2 line-through">${{ Number(p.precio).toFixed(2) }}</span>
          </p>
          <p class="mt-1 text-xs text-texto2">
            {{ ventasPorPatron[p.id]?.n ?? 0 }} {{ (ventasPorPatron[p.id]?.n ?? 0) === 1 ? 'venta' : 'ventas' }}
            <template v-if="p.estado === 'preventa' && p.fecha_lanzamiento">· lanza {{ p.fecha_lanzamiento }}</template>
          </p>
        </div>
      </NuxtLink>
    </div>
  </AdminShell>
</template>
