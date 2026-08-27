// Split de subdominios:
//   · www.nuditoscol.com (y la raíz) → la portada es el landing.
//   · app.nuditoscol.com → la app (raíz = inventario).
// Solo actúa sobre la raíz "/"; el resto de rutas funciona igual en ambos.
export default defineEventHandler((event) => {
  const host = getRequestHost(event, { xForwardedHost: true })
  const path = getRequestURL(event).pathname

  if (path === '/' && (host === 'www.nuditoscol.com' || host === 'nuditoscol.com')) {
    return sendRedirect(event, '/landing', 302)
  }
})
