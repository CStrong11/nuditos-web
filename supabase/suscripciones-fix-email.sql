-- =====================================================================
-- NUDITOS · Resolver usuario por email en el webhook de Lemon Squeezy
-- Ejecutar en el SQL Editor de Supabase.
-- =====================================================================
-- El webhook usa esta función (con service_role) para encontrar el user_id
-- a partir del correo que envía Lemon Squeezy, cuando el custom_data no llega.
-- =====================================================================

create or replace function public.user_id_por_email(p_email text)
returns uuid
language sql
security definer
set search_path = public, auth
as $$
  select id from auth.users where lower(email) = lower(p_email) limit 1;
$$;

revoke execute on function public.user_id_por_email(text) from public, anon, authenticated;
grant execute on function public.user_id_por_email(text) to service_role;
