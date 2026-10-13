<script setup lang="ts">
definePageMeta({ layout: false })
useHead({
  title: 'Tienda de Patrones de NuditosCol',
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

// --- Filtros ---
const busqueda = ref('')
const orden = ref<'recientes' | 'precio-asc' | 'precio-desc'>('recientes')
const soloPreventa = ref(false)
const soloOfertas = ref(false)

const filtrados = computed(() => {
  let lista = [...(patrones.value ?? [])]
  const q = busqueda.value.trim().toLowerCase()
  if (q) lista = lista.filter(p => p.titulo.toLowerCase().includes(q))
  if (soloPreventa.value) lista = lista.filter(p => p.estado === 'preventa')
  if (soloOfertas.value) lista = lista.filter(p => p.precio_descuento != null)

  if (orden.value === 'precio-asc') lista.sort((a, b) => efectivo(a) - efectivo(b))
  else if (orden.value === 'precio-desc') lista.sort((a, b) => efectivo(b) - efectivo(a))
  return lista
})

function limpiar() {
  busqueda.value = ''
  orden.value = 'recientes'
  soloPreventa.value = false
  soloOfertas.value = false
}

// Estilos inline reutilizados para los chips de filtro.
const chipOn = 'padding:11px 16px;border-radius:14px;border:1.5px solid #C06B86;background:#F6D7E0;color:#C06B86;font-size:14px;font-weight:800;cursor:pointer'
const chipOff = 'padding:11px 16px;border-radius:14px;border:1.5px solid #ECE3D6;background:#FDFAF5;color:#7d7368;font-size:14px;font-weight:700;cursor:pointer'
</script>

<template>
  <TiendaShell>
    <!-- Hero -->
    <section style="position:relative;overflow:hidden;text-align:center;padding:clamp(48px,7vw,84px) 22px 36px">
      <div style="position:absolute;top:18%;left:10%;font-size:clamp(34px,4vw,60px);color:#F0D3DD;pointer-events:none">🧶</div>
      <div style="position:absolute;top:26%;right:12%;font-size:clamp(28px,3.5vw,50px);color:#DCEDD8;pointer-events:none">✿</div>
      <div style="position:relative;max-width:720px;margin:0 auto">
        <span style="display:inline-block;padding:6px 14px;border-radius:999px;background:#F6D7E0;color:#C06B86;font-size:13px;font-weight:800">Tienda</span>
        <h1 style="margin:16px 0 0;font-family:'Baloo 2',Nunito,sans-serif;font-weight:800;font-size:clamp(34px,5.5vw,58px);line-height:1.04;letter-spacing:-.03em;color:#4A443D">
          Tienda de Patrones de NuditosCol
        </h1>
        <p style="margin:14px 0 0;font-size:18px;line-height:1.6;color:#7d7368">
          Patrones en PDF listos para descargar. Págalo una vez, téjelo mil veces. 🧶
        </p>
      </div>
    </section>

    <!-- Filtros -->
    <section style="max-width:1160px;margin:0 auto;padding:0 22px">
      <div style="background:#fff;border:1px solid #ECE3D6;border-radius:20px;padding:16px;display:flex;flex-wrap:wrap;gap:12px;align-items:center">
        <div style="position:relative;flex:1 1 240px;min-width:200px">
          <span style="position:absolute;left:14px;top:50%;transform:translateY(-50%);color:#B5A99B">🔍</span>
          <input
            v-model="busqueda"
            type="text"
            placeholder="Buscar por nombre…"
            style="width:100%;padding:11px 14px 11px 40px;border:1.5px solid #ECE3D6;border-radius:14px;font-size:15px;color:#4A443D;background:#FDFAF5;outline:none"
          >
        </div>

        <select
          v-model="orden"
          style="padding:11px 14px;border:1.5px solid #ECE3D6;border-radius:14px;font-size:15px;font-weight:600;color:#4A443D;background:#FDFAF5;outline:none;cursor:pointer"
        >
          <option value="recientes">Más recientes</option>
          <option value="precio-asc">Precio: menor a mayor</option>
          <option value="precio-desc">Precio: mayor a menor</option>
        </select>

        <button
          type="button"
          class="t-chip"
          :style="soloPreventa ? chipOn : chipOff"
          @click="soloPreventa = !soloPreventa"
        >
          Preventa
        </button>
        <button
          type="button"
          class="t-chip"
          :style="soloOfertas ? chipOn : chipOff"
          @click="soloOfertas = !soloOfertas"
        >
          Ofertas
        </button>

        <button
          v-if="busqueda || soloPreventa || soloOfertas || orden !== 'recientes'"
          type="button"
          style="padding:11px 14px;border:none;background:none;font-size:14px;font-weight:700;color:#C06B86;cursor:pointer"
          @click="limpiar"
        >
          Limpiar
        </button>
      </div>
    </section>

    <!-- Grilla -->
    <section style="max-width:1160px;margin:0 auto;padding:24px 22px 60px">
      <div v-if="!filtrados.length" style="background:#fff;border:1px dashed #ECE3D6;border-radius:20px;padding:56px 22px;text-align:center;color:#9A9085">
        <template v-if="(patrones?.length ?? 0) === 0">Pronto tendremos patrones nuevos por aquí. ¡Vuelve prontito! 🧶</template>
        <template v-else>No encontramos patrones con esos filtros.</template>
      </div>

      <div v-else class="t-grid">
        <NuxtLink
          v-for="p in filtrados"
          :key="p.slug"
          :to="`/tienda-de-patrones/${p.slug}`"
          class="t-card t-alza"
        >
          <div class="t-thumb">
            <img v-if="thumbUrl(p.thumbnail_path)" :src="thumbUrl(p.thumbnail_path)!" :alt="p.titulo" loading="lazy">
            <div v-else class="t-thumb-ph">🧶</div>
            <span v-if="p.estado === 'preventa'" class="t-badge" style="background:#C06B86">Preventa</span>
            <span v-else-if="p.precio_descuento" class="t-badge" style="background:#4E7A4A">Oferta</span>
          </div>
          <div style="padding:12px 14px 14px">
            <p style="margin:0;font-weight:800;color:#4A443D;font-size:15px;line-height:1.25;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;min-height:38px">{{ p.titulo }}</p>
            <p v-if="p.dificultad" style="margin:4px 0 0;font-size:12px;text-transform:capitalize;color:#A69C90">{{ p.dificultad }}</p>
            <div style="margin-top:8px;display:flex;align-items:baseline;gap:6px">
              <span style="font-weight:800;color:#C06B86;font-size:18px">${{ efectivo(p).toFixed(2) }}</span>
              <span v-if="p.precio_descuento" style="font-size:13px;color:#A69C90;text-decoration:line-through">${{ Number(p.precio).toFixed(2) }}</span>
              <span style="font-size:11px;color:#A69C90">USD</span>
            </div>
            <span class="t-ver">Ver patrón →</span>
          </div>
        </NuxtLink>
      </div>
    </section>
  </TiendaShell>
</template>

<style scoped>
.t-alza { transition: transform .18s ease, box-shadow .18s ease, border-color .18s ease; }
.t-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}
@media (min-width: 640px) { .t-grid { grid-template-columns: repeat(3, 1fr); } }
@media (min-width: 960px) { .t-grid { grid-template-columns: repeat(4, 1fr); } }

.t-card {
  display: block;
  background: #fff;
  border: 1px solid #ECE3D6;
  border-radius: 20px;
  overflow: hidden;
  text-decoration: none;
}
.t-card:hover { transform: translateY(-3px); box-shadow: 0 16px 30px -18px rgba(74,68,61,.45); border-color: #F0C9D6; }
.t-thumb { position: relative; aspect-ratio: 1/1; background: #F9EFE6; overflow: hidden; }
.t-thumb img { width: 100%; height: 100%; object-fit: cover; transition: transform .3s ease; }
.t-card:hover .t-thumb img { transform: scale(1.05); }
.t-thumb-ph { display: flex; align-items: center; justify-content: center; height: 100%; font-size: 40px; }
.t-badge {
  position: absolute; left: 10px; top: 10px;
  padding: 3px 10px; border-radius: 999px;
  font-size: 11px; font-weight: 800; color: #fff;
}
.t-ver { display: inline-block; margin-top: 10px; font-size: 13px; font-weight: 800; color: #C06B86; }
</style>
