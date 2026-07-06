<script setup lang="ts">
definePageMeta({ layout: false })

const supabase = useSupabaseClient()
const user = useSupabaseUser()

type Modo = 'login' | 'registro' | 'olvide'
const modo = ref<Modo>('login')

const entrada = ref('')
const password = ref('')
const nombre = ref('')
const cargando = ref(false)
const error = ref<string | null>(null)
const info = ref<string | null>(null)

watch(user, (u) => {
  if (u) navigateTo('/')
}, { immediate: true })

watch(modo, () => {
  error.value = null
  info.value = null
})

const subtitulo = computed(() => ({
  login: 'tu inventario de hilos',
  registro: 'crea tu cuenta',
  olvide: 'recupera tu acceso',
}[modo.value]))

const esEmail = computed(() => /.+@.+\..+/.test(entrada.value.trim()))

const puedeEnviar = computed(() => {
  if (modo.value === 'registro') return esEmail.value && password.value.length >= 6 && !!nombre.value
  if (modo.value === 'olvide') return esEmail.value
  const e = entrada.value.trim()
  const esUsername = !!e && !e.includes(' ') && !e.includes('@')
  return (esEmail.value || esUsername) && password.value.length >= 6
})

async function enviar() {
  error.value = null
  info.value = null
  cargando.value = true
  try {
    if (modo.value === 'registro') {
      const { data, error: e } = await supabase.auth.signUp({
        email: entrada.value.trim(),
        password: password.value,
        options: { data: { nombre: nombre.value } },
      })
      if (e) throw e
      if (!data.session) info.value = 'Revisa tu correo para confirmar tu cuenta'
      return
    }

    if (modo.value === 'olvide') {
      const { error: e } = await supabase.auth.resetPasswordForEmail(entrada.value.trim())
      if (e) throw e
      info.value = 'Te hemos enviado un correo para restablecer tu contraseña'
      return
    }

    // Login: sin "@" se trata como username (RPC email_por_username, como iOS)
    let email = entrada.value.trim()
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
    error.value = e.message ?? 'Algo salió mal'
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
        <img src="/nuditos-logo.png" alt="Nuditos" class="mx-auto mb-3 h-24 w-auto">
        <h1 class="text-4xl font-bold text-rosa">nuditos</h1>
        <p class="mt-1 text-sm text-texto2">{{ subtitulo }}</p>
      </div>

      <form class="space-y-3" @submit.prevent="enviar">
        <input
          v-if="modo === 'registro'"
          v-model="nombre"
          type="text"
          placeholder="Tu nombre"
          class="w-full rounded-2xl border border-borde bg-blanco px-4 py-3 outline-none placeholder:text-texto2/70 focus:border-rosa"
        >
        <input
          v-model="entrada"
          type="text"
          :placeholder="modo === 'login' ? 'Correo o usuario' : 'Correo'"
          autocapitalize="none"
          autocomplete="username"
          class="w-full rounded-2xl border border-borde bg-blanco px-4 py-3 outline-none placeholder:text-texto2/70 focus:border-rosa"
        >
        <input
          v-if="modo !== 'olvide'"
          v-model="password"
          type="password"
          placeholder="Contraseña"
          :autocomplete="modo === 'registro' ? 'new-password' : 'current-password'"
          class="w-full rounded-2xl border border-borde bg-blanco px-4 py-3 outline-none placeholder:text-texto2/70 focus:border-rosa"
        >

        <p v-if="error" class="rounded-xl bg-rosa-pastel px-4 py-2 text-sm text-rosa">{{ error }}</p>
        <p v-if="info" class="rounded-xl bg-verde-bg px-4 py-2 text-sm text-verde-text">{{ info }}</p>

        <button
          type="submit"
          :disabled="cargando || !puedeEnviar"
          class="w-full rounded-2xl bg-rosa py-3 font-semibold text-white transition disabled:opacity-40"
        >
          {{ cargando ? 'Un momento…' : (modo === 'registro' ? 'Crear cuenta' : modo === 'olvide' ? 'Enviar correo de recuperación' : 'Entrar') }}
        </button>
      </form>

      <!-- Cambiar de modo -->
      <div class="mt-5 space-x-1 text-center text-sm">
        <template v-if="modo === 'login'">
          <span class="text-texto2">¿No tienes cuenta?</span>
          <button class="font-semibold text-rosa" @click="modo = 'registro'">Crear cuenta</button>
          <span class="text-borde">·</span>
          <button class="text-texto2" @click="modo = 'olvide'">¿Olvidaste tu contraseña?</button>
        </template>
        <template v-else-if="modo === 'registro'">
          <span class="text-texto2">¿Ya tienes cuenta?</span>
          <button class="font-semibold text-rosa" @click="modo = 'login'">Entrar</button>
        </template>
        <template v-else>
          <button class="font-semibold text-rosa" @click="modo = 'login'">Volver al inicio</button>
        </template>
      </div>

      <template v-if="modo === 'login'">
        <div class="my-6 flex items-center gap-3 text-xs text-texto2">
          <div class="h-px flex-1 bg-borde" />
          o continúa con
          <div class="h-px flex-1 bg-borde" />
        </div>

        <button
          class="flex w-full items-center justify-center gap-2.5 rounded-2xl border border-borde bg-blanco py-3 text-sm font-medium transition-all duration-200 hover:border-rosa active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-rosa/20"
          @click="entrarConGoogle"
        >
          <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
          </svg>
          <span>Continuar con Google</span>
        </button>
      </template>

      <p class="mt-10 text-center text-xs text-texto2/50">© 2026 nuditos</p>
    </div>
  </main>
</template>
