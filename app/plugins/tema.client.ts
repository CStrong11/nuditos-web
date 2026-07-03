// Aplica el tema (claro/oscuro/sistema + acento) al <html>.
// Fuente de verdad: perfiles.tema / perfiles.color_tema (compartida con iOS);
// localStorage como caché para que el arranque no parpadee.

export default defineNuxtPlugin(() => {
  const media = window.matchMedia('(prefers-color-scheme: dark)')
  let temaActual = localStorage.getItem('tema') ?? 'sistema'
  let acentoActual = localStorage.getItem('acento') ?? 'rosa'

  function pintar() {
    const html = document.documentElement
    const oscuro = temaActual === 'oscuro' || (temaActual === 'sistema' && media.matches)
    html.classList.toggle('oscuro', oscuro)
    html.dataset.acento = acentoActual
  }

  function aplicarTema(tema: string, acento: string) {
    temaActual = tema
    acentoActual = acento
    localStorage.setItem('tema', tema)
    localStorage.setItem('acento', acento)
    pintar()
  }

  media.addEventListener('change', pintar)
  pintar()

  // Al iniciar sesión, sincronizar desde el perfil (una vez por carga).
  const user = useSupabaseUser()
  const supabase = useSupabaseClient()
  let sincronizado = false
  watch(user, async (u) => {
    if (!u || sincronizado) return
    sincronizado = true
    const { data } = await supabase.from('perfiles').select('tema, color_tema').single()
    if (data) {
      aplicarTema((data as any).tema ?? 'sistema', (data as any).color_tema ?? 'rosa')
    }
  }, { immediate: true })

  return { provide: { aplicarTema } }
})
