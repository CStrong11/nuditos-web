<script setup lang="ts">
useHead({ title: 'Mi plan — Nuditos' })

const supabase = useSupabaseClient()
const { sub, cargar, esVitalicia, enTrial, diasTrialRestantes, periodoVigente, tieneAcceso } = useSuscripcion()

const cargandoCheckout = ref<string | null>(null)
const error = ref<string | null>(null)

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
            @click="suscribir(plan.id)"
          >
            <template v-if="esActivo(plan.id)">Tu plan actual</template>
            <template v-else-if="cargandoCheckout === plan.id">Abriendo pago…</template>
            <template v-else>{{ periodoVigente ? 'Cambiar a este' : 'Suscribirme' }}</template>
          </button>
        </div>
      </div>

      <p class="mt-4 text-center text-xs text-texto2/70">
        Pago seguro procesado por Lemon Squeezy. Puedes cancelar cuando quieras.
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
