// Split de subdominios:
//   · www.nuditoscol.com (y la raíz) → la portada "/" es el landing.
//   · app.nuditoscol.com   → la app; la raíz "/" redirige a "/inicio".
//   · admin.nuditoscol.com → el panel de la dueña; la raíz "/" redirige a "/admin".
// Solo actúa sobre la raíz "/"; el resto de rutas funciona igual en todos.
export default defineEventHandler((event) => {
  const host = getRequestHost(event, { xForwardedHost: true })
  const path = getRequestURL(event).pathname

  if (path !== '/') return

  if (host === 'app.nuditoscol.com') {
    return sendRedirect(event, '/inicio', 302)
  }
  if (host === 'admin.nuditoscol.com') {
    return sendRedirect(event, '/admin', 302)
  }
})
