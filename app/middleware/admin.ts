// Portería del panel admin (admin.nuditoscol.com / rutas /admin).
// · Sin sesión -> a login.
// · Con sesión pero sin es_admin -> fuera (a la app).
export default defineNuxtRouteMiddleware(async () => {
  const user = useSupabaseUser()
  if (!user.value) return navigateTo('/login')

  const supabase = useSupabaseClient()
  const { data, error } = await supabase
    .from('perfiles')
    .select('es_admin')
    .eq('id', userID(user.value))
    .maybeSingle()

  if (error || !data?.es_admin) return navigateTo('/inicio')
})
