// Aísla los subdominios: la app y el panel admin NO comparten rutas ni datos.
//   · admin.nuditoscol.com -> SOLO el panel (raíz "/", /patron/*, /sin-acceso)
//     + login/confirm para entrar. Gating de admin aquí mismo.
//   · cualquier otro host   -> las rutas del panel no existen (van a la raíz).
// En localhost/preview (hostnames que no son de producción) no se aplica el
// aislamiento, para poder probar el panel por ruta directa.

// ¿La ruta pertenece al panel admin? (sin contar la raíz, que es compartida)
function esRutaPanel(path: string): boolean {
  return path.startsWith('/patron') || path === '/sin-acceso'
}

// Host fiable en cliente y servidor. En SSR tras el proxy de Vercel, el host
// real viene en x-forwarded-host (useRequestURL a veces no lo refleja).
function hostActual(): string {
  if (import.meta.client) return window.location.hostname
  const h = useRequestHeaders(['x-forwarded-host', 'host'])
  return (h['x-forwarded-host'] || h['host'] || '').split(',')[0].split(':')[0].trim()
}

export default defineNuxtRouteMiddleware(async (to) => {
  const host = hostActual()
  const authCompartida = ['/login', '/confirm', '/verificado'].includes(to.path)

  if (host === 'admin.nuditoscol.com') {
    if (authCompartida) return
    // En el host admin solo existen la raíz y las rutas del panel.
    if (to.path !== '/' && !esRutaPanel(to.path)) return navigateTo('/')

    // Gating: debe estar logueada y ser admin.
    const user = useSupabaseUser()
    if (!user.value) return navigateTo('/login')
    if (to.path === '/sin-acceso') return // la propia página de "sin permiso"

    // El chequeo de admin se hace SOLO en el cliente, donde la sesión está
    // garantizada (en SSR a veces aún no, y marcaba falsos negativos). Los
    // datos del panel están protegidos por RLS igualmente.
    if (import.meta.server) return

    // Función es_admin() (SECURITY DEFINER): no depende de las políticas RLS
    // de perfiles, así que es fiable para cualquier admin.
    const supabase = useSupabaseClient()
    const { data: esAdmin, error } = await supabase.rpc('es_admin')
    if (error) return // error puntual de red: no la echamos; deja ver el panel
    if (!esAdmin) return navigateTo('/sin-acceso')
    return
  }

  // Hosts no-admin (www, app, preview de nuditoscol.com): el panel no existe.
  if (host.endsWith('nuditoscol.com') && esRutaPanel(to.path)) {
    return navigateTo('/')
  }
})
