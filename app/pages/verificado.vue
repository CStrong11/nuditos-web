<script setup lang="ts">
definePageMeta({ layout: false })
useHead({ title: 'Correo verificado — Nuditos' })

const segundos = ref(5)
let timer: ReturnType<typeof setInterval> | null = null

onMounted(() => {
  timer = setInterval(() => {
    segundos.value -= 1
    if (segundos.value <= 0) {
      if (timer) clearInterval(timer)
      navigateTo('/login')
    }
  }, 1000)
})

onBeforeUnmount(() => {
  if (timer) clearInterval(timer)
})
</script>

<template>
  <main class="flex min-h-screen items-center justify-center bg-crema px-4">
    <div class="w-full max-w-sm rounded-3xl border border-borde bg-blanco p-8 text-center">
      <img src="/nuditos-logo.png" alt="Nuditos" class="mx-auto mb-3 h-16 w-auto">
      <div class="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-verde-bg text-3xl">
        ✅
      </div>
      <h1 class="mt-5 text-2xl font-bold text-rosa">¡Tu correo ha sido verificado!</h1>
      <p class="mt-2 text-sm text-texto2">
        Tu cuenta ya está activa. Ya puedes iniciar sesión y empezar a tejer. 🧶
      </p>
      <p class="mt-5 text-sm text-texto2/70">
        Te llevamos a iniciar sesión en
        <span class="font-bold text-rosa">{{ segundos }}</span> s…
      </p>
      <NuxtLink
        to="/login"
        class="mt-5 inline-block rounded-2xl bg-rosa px-6 py-3 font-semibold text-white transition hover:opacity-90"
      >
        Iniciar sesión ahora
      </NuxtLink>
    </div>
  </main>
</template>
