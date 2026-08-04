<script setup lang="ts">
useHead({ title: 'Mi plan — Nuditos' })

const supabase = useSupabaseClient()
const user = useSupabaseUser()
const { sub, cargar, esVitalicia, enTrial, diasTrialRestantes, periodoVigente, tieneAcceso } = useSuscripcion()

const cargandoCheckout = ref<string | null>(null)
const error = ref<string | null>(null)

// --- Gestión de planes ---
// Mientras Lemon Squeezy verifica la tienda y habilita cobros reales, la
// adquisición de planes se gestiona manualmente por WhatsApp (activación
// desde la base de datos). Para volver al checkout automático, poner
// PAGOS_MANUALES = false.
const PAGOS_MANUALES = true
const WHATSAPP_URL = 'https://wa.me/573001809871'

await cargar()

// Historial de pagos (resiliente: si la tabla no existe aún, devuelve vacío)
const { data: pagos } = await useAsyncData('pagos', async () => {
  try {
    const { data } = await supabase
      .from('pagos')
      .select('*')
      .order('created_at', { ascending: false })
    return (data ?? []) as any[]
  } catch {
    return [] as any[]
  }
})

// Estado legible del plan actual
const planActual = computed(() => {
  if (esVitalicia.value) return { titulo: 'Vitalicio', detalle: 'Acceso completo para siempre 💛' }
  if (periodoVigente.value && sub.value.estado === 'activa')
    return { titulo: nombrePlan(sub.value.plan), detalle: `Renueva el ${fecha(sub.value.periodoTerminaEn)}` }
  if (sub.value.estado === 'cancelada' && periodoVigente.value)
    return { titulo: nombrePlan(sub.value.plan), detalle: `Cancelado · activo hasta el ${fecha(sub.value.periodoTerminaEn)}` }
  if (enTrial.value)
    return { titulo: 'Prueba gratis', detalle: `Te quedan ${diasTrialRestantes.value} día${diasTrialRestantes.value === 1 ? '' : 's'}` }
  return { titulo: 'Sin plan activo', detalle: 'Suscríbete para seguir creando y editando' }
})

function fecha(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('es-CL', { dateStyle: 'medium' })
}

// Punto de entrada del botón: WhatsApp (manual) o checkout automático.
function adquirir(plan: Plan) {
  if (PAGOS_MANUALES) {
    const periodo = plan.meses === 1 ? 'mes' : `${plan.meses} meses`
    const email = user.value?.email ? `\nMi correo de la cuenta es: ${user.value.email}` : ''
    const msg = `Hola 👋 Quiero adquirir el Plan ${plan.nombre} de Nuditos ($${plan.precio} USD / ${periodo}).${email}`
    window.open(`${WHATSAPP_URL}?text=${encodeURIComponent(msg)}`, '_blank')
    return
  }
  suscribir(plan.id)
}

async function suscribir(planId: string) {
  error.value = null
  cargandoCheckout.value = planId
  try {
    const { url } = await $fetch<{ url: string }>('/api/checkout', {
      method: 'POST',
      body: { plan: planId },
    })
    window.location.href = url
  } catch (e: any) {
    error.value = e?.data?.statusMessage || e?.message || 'No se pudo abrir el pago'
    cargandoCheckout.value = null
  }
}

// ¿El plan de la tarjeta es el que tiene activo?
function esActivo(planId: string): boolean {
  return !esVitalicia.value && sub.value.plan === planId && periodoVigente.value
}

// --- Canje de código de embajadora ---
const codigo = ref('')
const canjeando = ref(false)
const canjeMsg = ref<string | null>(null)
const canjeError = ref<string | null>(null)

async function canjearCodigo() {
  canjeError.value = null
  canjeMsg.value = null
  if (!codigo.value.trim()) return
  canjeando.value = true
  try {
    const { data, error: e } = await supabase.rpc('canjear_codigo', { p_codigo: codigo.value.trim() })
    if (e) throw e
    canjeMsg.value = `¡Listo! Se sumó un mes. Tu acceso va hasta el ${fecha(data as unknown as string)}.`
    codigo.value = ''
    await cargar()
  } catch (e: any) {
    canjeError.value = e?.message ?? 'No se pudo canjear el código'
  } finally {
    canjeando.value = false
  }
}
</script>

<template>
  <main class="mx-auto max-w-2xl px-4 py-8">
    <header class="mb-6 flex items-center gap-3">
      <NuxtLink to="/perfil" class="text-texto2">←</NuxtLink>
      <div>
        <h1 class="text-2xl font-bold text-rosa">Mi plan</h1>
        <p class="text-sm text-texto2">Suscripción y pagos</p>
      </div>
    </header>

    <!-- Estado actual -->
    <section
      class="rounded-2xl border p-5 text-center"
      :class="tieneAcceso ? 'border-borde bg-blanco' : 'border-poco-text/40 bg-poco-bg'"
    >
      <p class="text-xs uppercase tracking-wide text-texto2">Plan actual</p>
      <p class="mt-1 text-2xl font-bold" :class="tieneAcceso ? 'text-rosa' : 'text-poco-text'">
        {{ planActual.titulo }}
      </p>
      <p class="mt-1 text-sm text-texto2">{{ planActual.detalle }}</p>
    </section>

    <p v-if="error" class="mt-4 rounded-xl bg-rosa-pastel px-4 py-2 text-sm text-rosa">{{ error }}</p>

    <!-- Canjear código de embajadora -->
    <section v-if="!esVitalicia" class="mt-6 rounded-2xl border border-borde bg-blanco p-4">
      <h2 class="mb-1 font-bold">¿Tienes un código de embajadora?</h2>
      <p class="mb-3 text-xs text-texto2">Canjéalo y suma un mes gratis a tu acceso.</p>
      <div class="flex gap-2">
        <input
          v-model="codigo"
          placeholder="Tu código"
          autocapitalize="characters"
          class="min-w-0 flex-1 rounded-xl border border-borde bg-blanco px-3 py-2 uppercase outline-none focus:border-rosa"
          @keydown.enter="canjearCodigo"
        >
        <button
          :disabled="!codigo.trim() || canjeando"
          class="shrink-0 rounded-xl bg-rosa px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
          @click="canjearCodigo"
        >
          {{ canjeando ? 'Canjeando…' : 'Canjear' }}
        </button>
      </div>
      <p v-if="canjeMsg" class="mt-2 rounded-xl bg-verde-bg px-3 py-2 text-sm text-verde-text">{{ canjeMsg }}</p>
      <p v-if="canjeError" class="mt-2 rounded-xl bg-poco-bg px-3 py-2 text-sm text-poco-text">{{ canjeError }}</p>
    </section>

    <!-- Planes -->
    <template v-if="!esVitalicia">
      <h2 class="mb-3 mt-8 font-bold">
        {{ periodoVigente ? 'Cambiar de plan' : 'Elige tu plan' }}
      </h2>

      <div class="grid gap-3 sm:grid-cols-2">
        <div
          v-for="plan in PLANES" :key="plan.id"
          class="relative flex flex-col rounded-2xl border bg-blanco p-4"
          :class="esActivo(plan.id) ? 'border-rosa ring-2 ring-rosa/30' : 'border-borde'"
        >
          <span
            v-if="plan.destacado && !esActivo(plan.id)"
            class="absolute -top-2 right-4 rounded-full bg-rosa px-2 py-0.5 text-[10px] font-bold uppercase text-white"
          >
            Mejor precio
          </span>
          <span
            v-if="esActivo(plan.id)"
            class="absolute -top-2 right-4 rounded-full bg-verde-text px-2 py-0.5 text-[10px] font-bold uppercase text-white"
          >
            Activo
          </span>

          <p class="font-bold">{{ plan.nombre }}</p>
          <p class="mt-1">
            <span class="text-2xl font-bold">${{ plan.precio }}</span>
            <span class="text-sm text-texto2"> USD / {{ plan.meses === 1 ? 'mes' : `${plan.meses} meses` }}</span>
          </p>
          <p class="text-xs text-texto2">
            ≈ ${{ plan.porMes.toFixed(2) }} al mes
            <span v-if="plan.ahorro" class="font-semibold text-verde-text">· ahorras {{ plan.ahorro }}%</span>
          </p>

          <button
            class="mt-4 rounded-xl py-2.5 text-sm font-semibold text-white disabled:opacity-40"
            :class="esActivo(plan.id) ? 'bg-verde-text' : 'bg-rosa'"
            :disabled="esActivo(plan.id) || cargandoCheckout === plan.id"
            @click="adquirir(plan)"
          >
            <template v-if="esActivo(plan.id)">Tu plan actual</template>
            <template v-else-if="cargandoCheckout === plan.id">Abriendo pago…</template>
            <template v-else-if="PAGOS_MANUALES">{{ periodoVigente ? 'Cambiar de plan' : 'Adquirir plan' }}</template>
            <template v-else>{{ periodoVigente ? 'Cambiar a este' : 'Suscribirme' }}</template>
          </button>
        </div>
      </div>

      <p class="mt-4 text-center text-xs text-texto2/70">
        <template v-if="PAGOS_MANUALES">
          Al adquirir un plan te llevamos a WhatsApp 💬 para coordinar el pago y activarlo.
        </template>
        <template v-else>
          Pago seguro procesado por Lemon Squeezy. Puedes cancelar cuando quieras.
        </template>
      </p>
    </template>

    <!-- Historial de pagos -->
    <section v-if="pagos && pagos.length" class="mt-8">
      <h2 class="mb-3 font-bold">Historial de pagos</h2>
      <ul class="space-y-2">
        <li
          v-for="p in pagos" :key="p.id"
          class="flex items-center justify-between rounded-2xl border border-borde bg-blanco p-3 text-sm"
        >
          <div>
            <p class="font-medium">
              {{ nombrePlan(p.plan) }}
              <span
                class="ml-1 rounded px-1.5 py-0.5 text-[10px] font-semibold"
                :class="p.estado === 'paid' ? 'bg-verde-bg text-verde-text' : 'bg-poco-bg text-poco-text'"
              >
                {{ p.estado === 'paid' ? 'Pagado' : 'Falló' }}
              </span>
            </p>
            <p class="text-xs text-texto2">{{ fecha(p.created_at) }}</p>
          </div>
          <div class="text-right">
            <p class="font-bold">${{ Number(p.monto ?? 0).toFixed(2) }} {{ p.moneda }}</p>
            <a
              v-if="p.invoice_url"
              :href="p.invoice_url" target="_blank"
              class="text-xs text-rosa underline"
            >
              Ver factura
            </a>
          </div>
        </li>
      </ul>
    </section>

    <!-- Legales -->
    <div class="mt-8 text-center text-xs text-texto2/70">
      <div class="flex flex-wrap justify-center gap-x-3 gap-y-1">
        <NuxtLink to="/terminos" class="hover:text-rosa hover:underline">Términos</NuxtLink>
        <span class="text-borde">·</span>
        <NuxtLink to="/reembolsos" class="hover:text-rosa hover:underline">Reembolsos</NuxtLink>
      </div>
    </div>
  </main>
</template>
