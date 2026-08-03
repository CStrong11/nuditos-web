-- =====================================================================
-- NUDITOS · Onboarding (tour guiado de bienvenida)
-- Ejecutar UNA VEZ en el SQL Editor de Supabase.
--
-- perfiles.tour_visto: marca si la cuenta ya vio el tour.
--   · Nuevas cuentas -> false (por defecto) -> ven el tour una vez.
--   · Cuentas ya existentes -> las marcamos true para NO molestarlas.
-- =====================================================================

alter table public.perfiles
  add column if not exists tour_visto boolean not null default false;

-- No mostrar el tour a las cuentas que ya existían antes de esta función.
update public.perfiles set tour_visto = true where tour_visto = false;
