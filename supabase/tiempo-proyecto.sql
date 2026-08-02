-- =====================================================================
-- NUDITOS · Tiempo por proyecto + Valor hora
-- Ejecutar UNA VEZ en el SQL Editor de Supabase.
--
-- · perfiles.valor_hora: tarifa por hora de la tejedora (para la mano de obra).
-- · tiempos_proyecto: cada registro de tiempo dedicado a un proyecto.
--   Se crea al usar un hilo con un proyecto seleccionado y activar "Añadir
--   tiempo". La suma de minutos da las horas totales del proyecto.
-- =====================================================================

-- ---------- Valor hora en el perfil ----------
alter table public.perfiles add column if not exists valor_hora numeric;

-- ---------- Tabla: tiempos_proyecto ----------
create table if not exists public.tiempos_proyecto (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  proyecto_id uuid not null references public.proyectos(id) on delete cascade,
  minutos     numeric not null check (minutos > 0),
  nota        text,
  created_at  timestamptz not null default now()
);

create index if not exists tiempos_proyecto_proyecto_idx
  on public.tiempos_proyecto (proyecto_id);

-- ---------- RLS: cada quien ve/gestiona lo suyo ----------
alter table public.tiempos_proyecto enable row level security;

drop policy if exists "tiempos propios" on public.tiempos_proyecto;
create policy "tiempos propios" on public.tiempos_proyecto
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ---------- Modo solo lectura: sin acceso no se puede crear/editar/borrar ----------
drop policy if exists "acceso_insert" on public.tiempos_proyecto;
create policy "acceso_insert" on public.tiempos_proyecto
  as restrictive for insert to authenticated
  with check (public.tiene_acceso());

drop policy if exists "acceso_update" on public.tiempos_proyecto;
create policy "acceso_update" on public.tiempos_proyecto
  as restrictive for update to authenticated
  using (public.tiene_acceso());

drop policy if exists "acceso_delete" on public.tiempos_proyecto;
create policy "acceso_delete" on public.tiempos_proyecto
  as restrictive for delete to authenticated
  using (public.tiene_acceso());
