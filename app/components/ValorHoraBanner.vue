<script setup lang="ts">
const route = useRoute()
const user = useSupabaseUser()
const { tieneAcceso } = useSuscripcion()
const { valor, cargar, sinDefinir } = useValorHora()

// Se descarta por sesión (vuelve a aparecer luego, hasta que lo definan).
const descartado = useState('valor-hora-descartado', () => false)

onMounted(() => cargar())

const mostrar = computed(() =>
  !!user.value
  && tieneAcceso.value
  && valor.value !== undefined
  && sinDefinir.value
  && !descartado.value
  && !route.path.startsWith('/perfil'),
)
</script>

<template>
  <div v-if="mostrar" class="mx-auto flex max-w-3xl items-center gap-2 px-4 py-2 text-sm">
    <div class="flex w-full items-center gap-2 rounded-xl bg-celeste px-3 py-2 text-texto">
      <span>⏱️</span>
      <span class="flex-1 font-medium">
        Define el <strong>valor de tu hora</strong> para calcular la mano de obra de tus proyectos.
      </span>
      <NuxtLink
        to="/perfil"
        class="shrink-0 rounded-lg bg-rosa px-2.5 py-1 text-xs font-semibold text-white"
      >
        Definir
      </NuxtLink>
      <button
        class="shrink-0 px-1 text-texto2"
        aria-label="Descartar"
        @click="descartado = true"
      >
        ✕
      </button>
    </div>
  </div>
</template>
