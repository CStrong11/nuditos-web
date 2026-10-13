<script setup lang="ts">
definePageMeta({ layout: false })

const route = useRoute()
const supabase = useSupabaseClient()
const user = useSupabaseUser()
const slug = route.params.slug as string

const { data: patron } = await useAsyncData(`patron-${slug}`, async () => {
  const { data, error } = await supabase
    .from('patrones')
    .select('id, slug, titulo, descripcion, precio, precio_descuento, estado, dificultad, thumbnail_path, fecha_lanzamiento')
    .eq('slug', slug)
    .in('estado', ['publicado', 'preventa'])
    .maybeSingle()
  if (error) throw error
  return data
})

useHead(() => ({ title: patron.value ? `${patron.value.titulo} — Nuditos` : 'Patrón — Nuditos' }))

function thumbUrl(path: string | null): string | null {
  if (!path) return null
  return supabase.storage.from('patrones-thumbs').getPublicUrl(path).data.publicUrl
}
const efectivo = computed(() => patron.value ? Number(patron.value.precio_descuento ?? patron.value.precio) : 0)

// --- Compra ---
const modalAbierto = ref(false)
const email = ref('')
const procesando = ref(false)
const errorCompra = ref<string | null>(null)

watchEffect(() => { if (user.value?.email) email.value = user.value.email })
const emailValido = computed(() => /.+@.+\..+/.test(email.value.trim()))

async function comprar() {
  if (!emailValido.value || !patron.value) return
  errorCompra.value = null
  procesando.value = true
  try {
    const { url } = await $fetch<{ url: string }>('/api/tienda/checkout', {
      method: 'POST',
      body: { patronId: patron.value.id, email: email.value.trim() },
    })
    window.location.href = url
  } catch (e: any) {
    errorCompra.value = e?.statusMessage || 'No se pudo iniciar el pago. Intenta de nuevo.'
    procesando.value = false
  }
}
</script>

<template>
  <TiendaShell>
    <div style="max-width:1000px;margin:0 auto;padding:clamp(24px,4vw,44px) 22px 60px">
      <div v-if="!patron" style="background:#fff;border:1px solid #ECE3D6;border-radius:20px;padding:56px 22px;text-align:center;color:#9A9085">
        No encontramos este patrón.
        <NuxtLink to="/tienda-de-patrones" style="display:block;margin-top:12px;font-weight:800;color:#C06B86">← Ver la tienda</NuxtLink>
      </div>

      <template v-else>
        <NuxtLink to="/tienda-de-patrones" style="font-size:14px;font-weight:700;color:#7d7368">← Tienda</NuxtLink>

        <div style="margin-top:14px;display:grid;gap:clamp(20px,4vw,40px);grid-template-columns:1fr" class="t-detalle">
          <!-- Imagen -->
          <div style="position:relative;aspect-ratio:1/1;border:1px solid #ECE3D6;border-radius:24px;overflow:hidden;background:#F9EFE6">
            <img v-if="thumbUrl(patron.thumbnail_path)" :src="thumbUrl(patron.thumbnail_path)!" :alt="patron.titulo" style="width:100%;height:100%;object-fit:cover">
            <div v-else style="display:flex;align-items:center;justify-content:center;height:100%;font-size:72px">🧶</div>
            <span v-if="patron.estado === 'preventa'" style="position:absolute;left:14px;top:14px;padding:5px 14px;border-radius:999px;background:#C06B86;color:#fff;font-size:13px;font-weight:800">Preventa</span>
          </div>

          <!-- Info -->
          <div>
            <h1 style="margin:0;font-family:'Baloo 2',Nunito,sans-serif;font-weight:800;font-size:clamp(28px,4vw,42px);line-height:1.08;letter-spacing:-.02em;color:#4A443D">{{ patron.titulo }}</h1>
            <p v-if="patron.dificultad" style="margin:8px 0 0;font-size:14px;text-transform:capitalize;color:#A69C90">Nivel: {{ patron.dificultad }}</p>

            <div style="margin-top:16px;display:flex;align-items:baseline;gap:10px">
              <span style="font-weight:800;color:#C06B86;font-size:34px">${{ efectivo.toFixed(2) }}</span>
              <span v-if="patron.precio_descuento" style="font-size:18px;color:#A69C90;text-decoration:line-through">${{ Number(patron.precio).toFixed(2) }}</span>
              <span style="font-size:14px;color:#A69C90">USD</span>
            </div>

            <p v-if="patron.estado === 'preventa' && patron.fecha_lanzamiento" style="margin:14px 0 0;background:#F6D7E0;color:#C06B86;padding:10px 14px;border-radius:14px;font-size:14px;font-weight:600">
              🗓️ Preventa — recibirás tu PDF por correo el <strong>{{ patron.fecha_lanzamiento }}</strong>.
            </p>

            <p v-if="patron.descripcion" style="margin:18px 0 0;white-space:pre-line;font-size:15px;line-height:1.7;color:#6b6258">{{ patron.descripcion }}</p>

            <button
              class="t-alza"
              style="margin-top:26px;width:100%;padding:16px;border:none;border-radius:18px;background:#C06B86;color:#fff;font-size:17px;font-weight:800;cursor:pointer;box-shadow:0 14px 26px -12px rgba(192,107,134,.85)"
              @click="modalAbierto = true"
            >
              {{ patron.estado === 'preventa' ? 'Reservar en preventa' : 'Comprar patrón' }}
            </button>
            <p style="margin:12px 0 0;font-size:13px;color:#A69C90">📩 El PDF llega a tu correo. No necesitas crear cuenta. Pago seguro con tarjeta.</p>
          </div>
        </div>
      </template>
    </div>

    <!-- Modal de compra -->
    <div v-if="modalAbierto" style="position:fixed;inset:0;z-index:100;display:flex;align-items:center;justify-content:center;background:rgba(40,34,30,.45);padding:16px" @click.self="modalAbierto = false">
      <div style="width:100%;max-width:400px;background:#fff;border-radius:24px;padding:24px">
        <h2 style="margin:0;font-family:'Baloo 2',Nunito,sans-serif;font-weight:800;font-size:20px;color:#4A443D">¿A qué correo enviamos tu patrón?</h2>
        <p style="margin:6px 0 0;font-size:14px;color:#7d7368">Ahí recibirás el enlace de descarga del PDF.</p>
        <input
          v-model="email"
          type="email"
          inputmode="email"
          autocapitalize="none"
          placeholder="tucorreo@ejemplo.com"
          style="margin-top:16px;width:100%;padding:13px 16px;border:1.5px solid #ECE3D6;border-radius:14px;font-size:15px;color:#4A443D;background:#FDFAF5;outline:none"
          @keyup.enter="comprar"
        >
        <p v-if="errorCompra" style="margin:8px 0 0;font-size:14px;color:#C0392B">{{ errorCompra }}</p>
        <div style="margin-top:16px;display:flex;gap:10px">
          <button style="flex:1;padding:13px;border:1.5px solid #ECE3D6;border-radius:14px;background:#fff;font-size:15px;font-weight:700;color:#7d7368;cursor:pointer" @click="modalAbierto = false">
            Cancelar
          </button>
          <button
            style="flex:1;padding:13px;border:none;border-radius:14px;background:#C06B86;font-size:15px;font-weight:800;color:#fff;cursor:pointer"
            :style="(!emailValido || procesando) ? 'opacity:.45;cursor:default' : ''"
            :disabled="!emailValido || procesando"
            @click="comprar"
          >
            {{ procesando ? 'Un momento…' : 'Ir a pagar' }}
          </button>
        </div>
      </div>
    </div>
  </TiendaShell>
</template>

<style scoped>
.t-alza { transition: transform .18s ease, box-shadow .18s ease; }
.t-alza:hover { transform: translateY(-2px); }
@media (min-width: 760px) { .t-detalle { grid-template-columns: 1fr 1fr !important; align-items: start; } }
</style>
