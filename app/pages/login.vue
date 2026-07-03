<script setup lang="ts">
definePageMeta({ layout: false })

const supabase = useSupabaseClient()
const user = useSupabaseUser()

const entrada = ref('')
const password = ref('')
const cargando = ref(false)
const error = ref<string | null>(null)

// Si ya hay sesión (o cuando se complete el login), ir al inicio.
watch(user, (u) => {
  if (u) navigateTo('/')
}, { immediate: true })

async function entrar() {
  error.value = null
  cargando.value = true
  try {
    let email = entrada.value.trim()

    // Igual que en la app iOS: sin "@" se trata como username y se
    // resuelve el correo con el RPC email_por_username.
    if (!email.includes('@')) {
      const { data, error: rpcError } = await supabase.rpc('email_por_username', {
        p_username: email.toLowerCase(),
      })
      if (rpcError) throw rpcError
      if (!data) {
        error.value = 'No existe una cuenta con ese usuario'
        return
      }
      email = data as string
    }

    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password: password.value,
    })
    if (authError) {
      error.value = authError.message.includes('Invalid login credentials')
        ? 'Correo o contraseña incorrectos'
        : authError.message
    }
  } catch (e: any) {
    error.value = e.message ?? 'Error al iniciar sesión'
  } finally {
    cargando.value = false
  }
}

async function entrarConGoogle() {
  error.value = null
  const { error: authError } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: `${location.origin}/confirm` },
  })
  if (authError) error.value = authError.message
}
</script>

<template>
  <main class="flex min-h-screen items-center justify-center px-4">
    <div class="w-full max-w-sm">
      <div class="mb-8 text-center">
        <h1 class="text-4xl font-bold text-rosa">nuditos</h1>
        <p class="mt-1 text-sm text-texto2">tu inventario de hilos</p>
      </div>

      <form class="space-y-3" @submit.prevent="entrar">
        <input
          v-model="entrada"
          type="text"
          placeholder="Correo o usuario"
          autocapitalize="none"
          autocomplete="username"
          class="w-full rounded-2xl border border-borde bg-white px-4 py-3 outline-none placeholder:text-texto2/70 focus:border-rosa"
        >
        <input
          v-model="password"
          type="password"
          placeholder="Contraseña"
          autocomplete="current-password"
          class="w-full rounded-2xl border border-borde bg-white px-4 py-3 outline-none placeholder:text-texto2/70 focus:border-rosa"
        >

        <p v-if="error" class="rounded-xl bg-rosa-pastel px-4 py-2 text-sm text-rosa">
          {{ error }}
        </p>

        <button
          type="submit"
          :disabled="cargando || !entrada || password.length < 6"
          class="w-full rounded-2xl bg-rosa py-3 font-semibold text-white transition disabled:opacity-40"
        >
          {{ cargando ? 'Entrando…' : 'Entrar' }}
        </button>
      </form>

      <div class="my-6 flex items-center gap-3 text-xs text-texto2">
        <div class="h-px flex-1 bg-borde" />
        o continúa con
        <div class="h-px flex-1 bg-borde" />
      </div>

      <button
        class="w-full rounded-2xl border border-borde bg-white py-3 text-sm font-medium transition hover:border-rosa"
        @click="entrarConGoogle"
      >
        Continuar con Google
      </button>
    </div>
  </main>
</template>
