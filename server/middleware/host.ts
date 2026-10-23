// Barrera por subdominio a nivel de servidor (detección de host fiable con
// x-forwarded-host, a diferencia de useRequestURL en SSR):
//   · app.nuditoscol.com   → la raíz "/" va a "/inicio".
//   · admin.nuditoscol.com → SOLO el panel (/, /patron/*, /sin-acceso) y las
//     rutas de auth; cualquier ruta de la app (p.ej. /inicio) se manda a "/".
//     Los assets y /api pasan siempre.
// Así el dominio admin NUNCA sirve la app, pase lo que pase en el cliente.

function esRutaPanelOAuth(path: string): boolean {
  // Assets y recursos internos (contienen "." o van bajo /_ o /api): pasar.
  if (path.startsWith('/_') || path.startsWith('/api') || path.includes('.')) return true
  // Rutas propias del panel.
  if (path === '/' || path.startsWith('/patron') || path === '/sin-acceso') return true
  // Auth compartida para poder iniciar sesión en el dominio admin.
  if (path === '/login' || path === '/confirm' || path === '/verificado') return true
  return false
}

export default defineEventHandler((event) => {
  const host = getRequestHost(event, { xForwardedHost: true })
  const path = getRequestURL(event).pathname

  if (host === 'app.nuditoscol.com') {
    if (path === '/') return sendRedirect(event, '/inicio', 302)
    return
  }

  if (host === 'admin.nuditoscol.com') {
    if (!esRutaPanelOAuth(path)) return sendRedirect(event, '/', 302)
  }
})
