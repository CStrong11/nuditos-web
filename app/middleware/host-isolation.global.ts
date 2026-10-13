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

    const supabase = useSupabaseClient()
    const { data } = await supabase
      .from('perfiles')
      .select('es_admin')
      .eq('id', userID(user.value))
      .maybeSingle()
    if (!data?.es_admin) return navigateTo('/sin-acceso')
    return
  }

  // Hosts no-admin (www, app, preview de nuditoscol.com): el panel no existe.
  if (host.endsWith('nuditoscol.com') && esRutaPanel(to.path)) {
    return navigateTo('/')
  }
})
