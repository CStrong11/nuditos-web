<script setup lang="ts">
// Recorta una imagen a cuadrado (1:1) para la portada de la tienda.
// El usuario arrastra y hace zoom; "Usar" exporta un File JPEG cuadrado.
const props = defineProps<{ archivo: File }>()
const emit = defineEmits<{ listo: [File]; cerrar: [] }>()

const V = 288   // lado del recuadro en pantalla (px)
const OUT = 1000 // lado de la imagen exportada (px)

const url = ref('')
const img = ref<HTMLImageElement | null>(null)
const nw = ref(0)
const nh = ref(0)
const baseScale = ref(1)
const zoom = ref(1)
const ox = ref(0)
const oy = ref(0)
const listo = ref(false)

const s = computed(() => baseScale.value * zoom.value)
const dispW = computed(() => nw.value * s.value)
const dispH = computed(() => nh.value * s.value)

function clamp() {
  ox.value = Math.min(0, Math.max(V - dispW.value, ox.value))
  oy.value = Math.min(0, Math.max(V - dispH.value, oy.value))
}
watch(zoom, () => clamp())

onMounted(() => {
  url.value = URL.createObjectURL(props.archivo)
  const im = new Image()
  im.onload = () => {
    img.value = im
    nw.value = im.naturalWidth
    nh.value = im.naturalHeight
    baseScale.value = Math.max(V / nw.value, V / nh.value)
    ox.value = (V - dispW.value) / 2
    oy.value = (V - dispH.value) / 2
    listo.value = true
  }
  im.src = url.value
})
onBeforeUnmount(() => { if (url.value) URL.revokeObjectURL(url.value) })

// Arrastre
let arrastrando = false
let px = 0, py = 0, iox = 0, ioy = 0
function onDown(e: PointerEvent) {
  arrastrando = true
  px = e.clientX; py = e.clientY; iox = ox.value; ioy = oy.value
  ;(e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId)
}
function onMove(e: PointerEvent) {
  if (!arrastrando) return
  ox.value = iox + (e.clientX - px)
  oy.value = ioy + (e.clientY - py)
  clamp()
}
function onUp() { arrastrando = false }

function confirmar() {
  if (!img.value) return
  const canvas = document.createElement('canvas')
  canvas.width = OUT; canvas.height = OUT
  const ctx = canvas.getContext('2d')!
  const srcX = -ox.value / s.value
  const srcY = -oy.value / s.value
  const srcSize = V / s.value
  ctx.drawImage(img.value, srcX, srcY, srcSize, srcSize, 0, 0, OUT, OUT)
  canvas.toBlob((blob) => {
    if (blob) emit('listo', new File([blob], 'portada.jpg', { type: 'image/jpeg' }))
  }, 'image/jpeg', 0.9)
}
</script>

<template>
  <div class="fixed inset-0 z-[120] flex items-center justify-center bg-black/55 p-4" @click.self="emit('cerrar')">
    <div class="w-full max-w-sm rounded-3xl bg-blanco p-5">
      <h2 class="text-lg font-bold text-texto">Encuadra la portada</h2>
      <p class="mt-1 text-sm text-texto2">Arrastra para mover y usa el control para acercar.</p>

      <div
        class="relative mx-auto mt-4 overflow-hidden rounded-2xl bg-crema"
        :style="{ width: V + 'px', height: V + 'px', touchAction: 'none', cursor: arrastrando ? 'grabbing' : 'grab' }"
        @pointerdown="onDown" @pointermove="onMove" @pointerup="onUp" @pointercancel="onUp"
      >
        <img
          v-if="listo"
          :src="url"
          draggable="false"
          class="absolute left-0 top-0 max-w-none select-none"
          :style="{ width: dispW + 'px', height: dispH + 'px', transform: `translate(${ox}px, ${oy}px)` }"
          alt=""
        >
        <!-- Marco guía -->
        <div class="pointer-events-none absolute inset-0 rounded-2xl ring-2 ring-white/70" />
      </div>

      <div class="mt-4 flex items-center gap-3">
        <span class="text-xs text-texto2">Zoom</span>
        <input v-model.number="zoom" type="range" min="1" max="3" step="0.01" class="flex-1 accent-rosa">
      </div>

      <div class="mt-5 flex gap-3">
        <button type="button" class="flex-1 rounded-2xl border border-borde py-3 font-semibold text-texto2" @click="emit('cerrar')">
          Cancelar
        </button>
        <button type="button" class="flex-1 rounded-2xl bg-rosa py-3 font-semibold text-white" @click="confirmar">
          Usar esta foto
        </button>
      </div>
    </div>
  </div>
</template>
