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

export default defineNuxtRouteMiddleware(async (to) => {
  const host = useRequestURL().hostname
  const authCompartida = ['/login', '/confirm', '/verificado'].includes(to.path)

  if (host === 'admin.nuditoscol.com') {
    if (authCompartida) return
    // En el host admin solo existen la raíz y las rutas del panel.
    if (to.path !== '/' && !esRutaPanel(to.path)) return navigateTo('/')

    // Gating: debe estar logueada y ser admin.
    const user = useSupabaseUser()
    if (!user.value) return navigateTo('/login')
    if (to.path === '/sin-acceso') return // la propia página de "sin permiso"

    // Usa la función es_admin() (SECURITY DEFINER): no depende de las políticas
    // RLS de perfiles, así que es fiable para cualquier admin.
    const supabase = useSupabaseClient()
    const { data: esAdmin, error } = await supabase.rpc('es_admin')
    // Si la consulta falla (red/timeout), no la echamos como si no fuera admin:
    // la mandamos a login para reintentar la sesión.
    if (error) return navigateTo('/login')
    if (!esAdmin) return navigateTo('/sin-acceso')
    return
  }

  // Hosts no-admin (www, app, preview de nuditoscol.com): el panel no existe.
  if (host.endsWith('nuditoscol.com') && esRutaPanel(to.path)) {
    return navigateTo('/')
  }
})
