// Portería del panel admin (admin.nuditoscol.com / rutas /admin).
// · Sin sesión -> a login.
// · Con sesión pero sin es_admin -> fuera (a la app).
export default defineNuxtRouteMiddleware(async (to) => {
  const user = useSupabaseUser()
  if (!user.value) return navigateTo('/login')

  const supabase = useSupabaseClient()
  const { data, error } = await supabase
    .from('perfiles')
    .select('es_admin')
    .eq('id', userID(user.value))
    .maybeSingle()

  // Logueado pero sin permiso de admin (o falta correr el SQL) -> página propia,
  // no la app. Evita rebotar a la página de "sin acceso" sobre sí misma.
  if ((error || !data?.es_admin) && to.path !== '/admin/sin-acceso') {
    return navigateTo('/admin/sin-acceso')
  }
})
