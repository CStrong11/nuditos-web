// Aísla los subdominios: la app y el panel admin NO comparten rutas ni datos.
//   · admin.nuditoscol.com -> SOLO rutas /admin (+ login/confirm para entrar).
//     Cualquier otra ruta (la app) se redirige a /admin.
//   · app.nuditoscol.com   -> no expone el panel admin.
// En localhost y previews (hostnames que no son de producción) no se aplica,
// para poder probar todo por ruta directa.
export default defineNuxtRouteMiddleware((to) => {
  const host = useRequestURL().hostname
  const authCompartida = to.path === '/login' || to.path === '/confirm' || to.path === '/verificado'

  if (host === 'admin.nuditoscol.com') {
    if (to.path.startsWith('/admin') || authCompartida) return
    return navigateTo('/admin')
  }

  if (host === 'app.nuditoscol.com' && to.path.startsWith('/admin')) {
    return navigateTo('/inicio')
  }
})
