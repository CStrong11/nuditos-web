// Split de subdominios (solo la raíz "/"):
//   · www.nuditoscol.com   → la portada "/" es el landing.
//   · app.nuditoscol.com   → la app; "/" redirige a "/inicio".
//   · admin.nuditoscol.com → la raíz "/" ES el panel de la tienda (sin redirect;
//     el contenido lo decide el host en pages/index.vue + middleware global).
export default defineEventHandler((event) => {
  const host = getRequestHost(event, { xForwardedHost: true })
  const path = getRequestURL(event).pathname

  if (path === '/' && host === 'app.nuditoscol.com') {
    return sendRedirect(event, '/inicio', 302)
  }
})
