// Split de subdominios:
//   · www.nuditoscol.com (y la raíz) → la portada "/" es el landing.
//   · app.nuditoscol.com → la app; la raíz "/" redirige a "/inicio".
// Solo actúa sobre la raíz "/"; el resto de rutas funciona igual en ambos.
export default defineEventHandler((event) => {
  const host = getRequestHost(event, { xForwardedHost: true })
  const path = getRequestURL(event).pathname

  if (path === '/' && host === 'app.nuditoscol.com') {
    return sendRedirect(event, '/inicio', 302)
  }
})
