<script setup lang="ts">
const supabase = useSupabaseClient()
const user = useSupabaseUser()

const { data: perfil, refresh } = await useAsyncData('perfil', async () => {
  const { data } = await supabase.from('perfiles').select('*').single()
  return data as any
})

const displayName = computed(() =>
  perfil.value?.nombre
  ?? user.value?.user_metadata?.full_name
  ?? user.value?.user_metadata?.nombre
  ?? 'Tejedora',
)

const iniciales = computed(() => {
  const parts = String(displayName.value).split(' ')
  if (parts.length >= 2) return (parts[0]![0]! + parts[1]![0]!).toUpperCase()
  return String(displayName.value).slice(0, 2).toUpperCase()
})

const mensaje = ref<string | null>(null)
const esError = ref(false)

function avisar(texto: string, error = false) {
  mensaje.value = texto
  esError.value = error
  setTimeout(() => { mensaje.value = null }, 4000)
}

// Todos los updates a perfiles llevan WHERE id = uid (el proyecto lo exige).
async function actualizarPerfil(campos: Record<string, string>) {
  const { error } = await supabase.from('perfiles').update(campos).eq('id', userID(user.value))
  if (error) throw error
  await refresh()
}

// --- Nombre / username ---
const editandoNombre = ref(false)
const nuevoNombre = ref('')
const editandoUsername = ref(false)
const nuevoUsername = ref('')

async function guardarNombre() {
  try {
    await actualizarPerfil({ nombre: nuevoNombre.value })
    editandoNombre.value = false
  } catch (e: any) {
    avisar(e.message, true)
  }
}

async function guardarUsername() {
  const limpio = nuevoUsername.value.toLowerCase().replace(/[^a-z0-9._]/g, '')
  if (!limpio) { editandoUsername.value = false; return }
  try {
    await actualizarPerfil({ username: limpio })
    editandoUsername.value = false
  } catch (e: any) {
    avisar(
      e.message?.includes('duplicate') || e.message?.includes('unique')
        ? 'Ese nombre de usuario ya está en uso.'
        : e.message,
      true,
    )
  }
}

// --- Avatar ---
const subiendoAvatar = ref(false)

async function cambiarAvatar(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  subiendoAvatar.value = true
  try {
    const url = await subirImagen(supabase, 'avatars', userID(user.value), 'avatar', file)
    await actualizarPerfil({ avatar_url: url })
  } catch (err: any) {
    avisar(err.message, true)
  } finally {
    subiendoAvatar.value = false
  }
}

// --- Tema (compartido con la app iOS vía perfiles.tema / color_tema) ---
const { $aplicarTema } = useNuxtApp()
const acentos = ['rosa', 'durazno', 'verde', 'celeste', 'lila']
const coloresAcento: Record<string, string> = {
  rosa: '#C06B86', durazno: '#A85C32', verde: '#4E7A4A', celeste: '#4A7BA6', lila: '#7B5EA6',
}

async function guardarTema(campos: Record<string, string>) {
  // Aplicar al instante en la web...
  $aplicarTema(
    campos.tema ?? perfil.value?.tema ?? 'sistema',
    campos.color_tema ?? perfil.value?.color_tema ?? 'rosa',
  )
  // ...y persistir (también lo usa la app iOS).
  try {
    await actualizarPerfil(campos)
  } catch (e: any) {
    avisar(e.message, true)
  }
}

// --- Etiquetas ---
const { data: etiquetas, refresh: refreshEtiquetas } = await useAsyncData('etiquetas-perfil', async () => {
  const { data } = await supabase.from('etiquetas').select('id, nombre').order('nombre')
  return (data ?? []) as { id: string, nombre: string }[]
})
const nuevaEtiqueta = ref('')

async function crearEtiqueta() {
  const nombre = nuevaEtiqueta.value.trim()
  if (!nombre) return
  const { error } = await supabase.from('etiquetas').insert({ nombre, user_id: userID(user.value) })
  if (error) { avisar(error.message, true); return }
  nuevaEtiqueta.value = ''
  await refreshEtiquetas()
  await refreshNuxtData('etiquetas')
}

async function eliminarEtiqueta(id: string) {
  const { error } = await supabase.from('etiquetas').delete().eq('id', id)
  if (error) { avisar(error.message, true); return }
  await refreshEtiquetas()
  await refreshNuxtData('etiquetas')
}

async function cerrarSesion() {
  await supabase.auth.signOut()
  navigateTo('/login')
}
</script>

<template>
  <main class="mx-auto max-w-2xl px-4 py-8">
    <header class="mb-6">
      <h1 class="text-2xl font-bold text-rosa">Perfil</h1>
    </header>

    <p
      v-if="mensaje"
      class="mb-4 rounded-xl px-4 py-2 text-sm"
      :class="esError ? 'bg-poco-bg text-poco-text' : 'bg-verde-bg text-verde-text'"
    >
      {{ mensaje }}
    </p>

    <!-- Cabecera de perfil -->
    <section class="rounded-2xl border border-borde bg-blanco p-6 text-center">
      <label class="relative mx-auto block h-20 w-20 cursor-pointer">
        <img
          v-if="perfil?.avatar_url"
          :src="perfil.avatar_url"
          class="h-20 w-20 rounded-full object-cover"
          alt=""
        >
        <span
          v-else
          class="flex h-20 w-20 items-center justify-center rounded-full bg-rosa-pastel text-2xl font-bold text-rosa"
        >
          {{ iniciales }}
        </span>
        <span class="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-rosa text-xs text-white">
          {{ subiendoAvatar ? '…' : '📷' }}
        </span>
        <input type="file" accept="image/*" class="hidden" @change="cambiarAvatar">
      </label>

      <!-- Nombre -->
      <div class="mt-4">
        <div v-if="editandoNombre" class="flex items-center justify-center gap-2">
          <input
            v-model="nuevoNombre"
            class="w-48 rounded-xl border border-borde px-3 py-1.5 text-center outline-none focus:border-rosa"
          >
          <button class="text-verde-text" @click="guardarNombre">✓</button>
        </div>
        <button
          v-else
          class="text-lg font-semibold"
          @click="nuevoNombre = displayName; editandoNombre = true"
        >
          {{ displayName }} <span class="text-xs text-texto2">✏️</span>
        </button>
      </div>

      <!-- Username -->
      <div class="mt-1">
        <div v-if="editandoUsername" class="flex items-center justify-center gap-2">
          <input
            v-model="nuevoUsername"
            placeholder="tu_usuario"
            autocapitalize="none"
            class="w-48 rounded-xl border border-borde px-3 py-1.5 text-center outline-none focus:border-rosa"
          >
          <button class="text-verde-text" @click="guardarUsername">✓</button>
        </div>
        <button
          v-else
          class="text-sm"
          :class="perfil?.username ? 'font-medium text-rosa' : 'text-texto2/60'"
          @click="nuevoUsername = perfil?.username ?? ''; editandoUsername = true"
        >
          {{ perfil?.username ? `@${perfil.username}` : 'Definir usuario' }}
        </button>
      </div>
    </section>

    <!-- Info -->
    <section class="mt-4 divide-y divide-borde rounded-2xl border border-borde bg-blanco">
      <div class="flex items-center gap-3 px-4 py-3">
        <span>✉️</span>
        <div>
          <p class="text-xs text-texto2">Email</p>
          <p class="text-sm font-medium">{{ user?.email }}</p>
        </div>
      </div>
      <div class="flex items-center gap-3 px-4 py-3">
        <span>📅</span>
        <div>
          <p class="text-xs text-texto2">Miembro desde</p>
          <p class="text-sm font-medium">
            {{ perfil?.created_at ? new Date(perfil.created_at).toLocaleDateString('es-CL', { dateStyle: 'medium' }) : '—' }}
          </p>
        </div>
      </div>
    </section>

    <!-- Apariencia -->
    <section class="mt-4 rounded-2xl border border-borde bg-blanco p-4">
      <h2 class="mb-3 font-bold">Apariencia</h2>

      <div class="mb-4 flex gap-2">
        <button
          v-for="m in ['claro', 'oscuro', 'sistema']" :key="m"
          class="flex-1 rounded-xl border py-2 text-sm font-medium capitalize"
          :class="perfil?.tema === m ? 'border-rosa bg-rosa-pastel text-rosa' : 'border-borde text-texto2'"
          @click="guardarTema({ tema: m })"
        >
          {{ m }}
        </button>
      </div>

      <p class="mb-2 text-xs text-texto2">Color del tema</p>
      <div class="flex gap-3">
        <button
          v-for="a in acentos" :key="a"
          class="flex h-10 w-10 items-center justify-center rounded-full text-white"
          :style="{ backgroundColor: coloresAcento[a] }"
          @click="guardarTema({ color_tema: a })"
        >
          <span v-if="perfil?.color_tema === a">✓</span>
        </button>
      </div>
    </section>

    <!-- Etiquetas -->
    <section class="mt-4 rounded-2xl border border-borde bg-blanco p-4">
      <h2 class="mb-3 font-bold">Etiquetas</h2>

      <div class="mb-3 flex gap-2">
        <input
          v-model="nuevaEtiqueta"
          placeholder="Nueva etiqueta"
          class="flex-1 rounded-xl border border-borde bg-blanco px-3 py-2 text-sm outline-none focus:border-rosa"
          @keydown.enter="crearEtiqueta"
        >
        <button class="rounded-xl bg-rosa px-4 font-bold text-white" @click="crearEtiqueta">+</button>
      </div>

      <p v-if="!etiquetas?.length" class="text-sm text-texto2">Sin etiquetas</p>
      <div v-else class="flex flex-wrap gap-2">
        <span
          v-for="tag in etiquetas" :key="tag.id"
          class="flex items-center gap-2 rounded-xl border border-borde bg-blanco px-3 py-1 text-sm"
        >
          {{ tag.nombre }}
          <button class="text-xs text-texto2" @click="eliminarEtiqueta(tag.id)">✕</button>
        </span>
      </div>
    </section>

    <!-- Ayuda -->
    <NuxtLink
      to="/ayuda"
      class="mt-4 flex items-center gap-3 rounded-2xl border border-borde bg-blanco p-4 transition hover:border-rosa"
    >
      <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rosa-pastel text-lg">
        💬
      </span>
      <span class="min-w-0 flex-1">
        <span class="block font-semibold">Ayuda y tutoriales</span>
        <span class="block text-xs text-texto2">
          Cómo usar la app, preguntas frecuentes y soporte
        </span>
      </span>
      <span class="shrink-0 text-texto2">›</span>
    </NuxtLink>

    <button
      class="mt-6 w-full rounded-2xl bg-poco-bg py-3 font-semibold text-poco-text"
      @click="cerrarSesion"
    >
      Cerrar sesión
    </button>

    <!-- Legales -->
    <div class="mt-8 text-center text-xs text-texto2/70">
      <div class="flex flex-wrap justify-center gap-x-3 gap-y-1">
        <NuxtLink to="/terminos" class="underline-offset-2 hover:text-rosa hover:underline">
          Términos y Condiciones
        </NuxtLink>
        <span class="text-borde">·</span>
        <NuxtLink to="/privacidad" class="underline-offset-2 hover:text-rosa hover:underline">
          Privacidad
        </NuxtLink>
        <span class="text-borde">·</span>
        <NuxtLink to="/reembolsos" class="underline-offset-2 hover:text-rosa hover:underline">
          Reembolsos
        </NuxtLink>
      </div>
      <p class="mt-3 text-texto2/50">nuditos web v1.0 · © 2026 nuditos</p>
    </div>
  </main>
</template>
