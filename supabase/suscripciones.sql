-- =====================================================================
-- NUDITOS · Suscripciones (trial 14 días + Lemon Squeezy + vitalicias)
-- Ejecutar UNA VEZ en el SQL Editor de Supabase.
-- =====================================================================
-- Modelo:
--   · Al registrarse -> fila en `suscripciones` con trial de 14 días.
--   · El acceso lo decide tiene_acceso(): trial vigente, período pagado
--     vigente, o estado 'vitalicia'.
--   · Lemon Squeezy solo cobra; el webhook actualiza estado/período.
--   · Vencido sin pago -> modo solo lectura (políticas RESTRICTIVE abajo).
-- =====================================================================

-- ---------- Tabla: suscripciones (una por usuario) ----------
create table if not exists public.suscripciones (
  user_id            uuid primary key references auth.users(id) on delete cascade,
  -- 'trial' | 'activa' | 'cancelada' | 'vencida' | 'vitalicia'
  estado             text not null default 'trial',
  -- 'mensual' | 'trimestral' | 'semestral' | 'anual' | null
  plan               text,
  trial_termina_en   timestamptz,
  periodo_termina_en timestamptz,     -- fin del período pagado / próxima renovación
  ls_subscription_id text,            -- id de la suscripción en Lemon Squeezy
  ls_customer_id     text,
  ls_variant_id      text,
  actualizado_en     timestamptz not null default now()
);

create index if not exists suscripciones_ls_sub_idx
  on public.suscripciones (ls_subscription_id);

-- ---------- Tabla: pagos (historial de cobros, la llena el webhook) ----------
create table if not exists public.pagos (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references auth.users(id) on delete cascade,
  ls_subscription_id text,
  monto              numeric,          -- en la moneda de LS (USD)
  moneda             text default 'USD',
  plan               text,
  estado             text,             -- 'paid' | 'failed' | ...
  invoice_url        text,
  created_at         timestamptz not null default now()
);

create index if not exists pagos_user_idx on public.pagos (user_id, created_at desc);

-- ---------- RLS: el usuario solo LEE lo suyo; escribe únicamente el webhook
--            (service_role, que se salta RLS) ----------
alter table public.suscripciones enable row level security;
alter table public.pagos         enable row level security;

drop policy if exists "suscripcion propia lectura" on public.suscripciones;
create policy "suscripcion propia lectura" on public.suscripciones
  for select to authenticated
  using (user_id = auth.uid());

drop policy if exists "pagos propios lectura" on public.pagos;
create policy "pagos propios lectura" on public.pagos
  for select to authenticated
  using (user_id = auth.uid());
-- (Sin políticas de INSERT/UPDATE para usuarios: solo el service_role escribe.)

-- ---------- Función central de acceso ----------
create or replace function public.tiene_acceso(p_user uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((
    select
      s.estado = 'vitalicia'
      or (s.trial_termina_en is not null and s.trial_termina_en > now())
      or (s.periodo_termina_en is not null and s.periodo_termina_en > now())
    from public.suscripciones s
    where s.user_id = p_user
  ), false);
$$;

grant execute on function public.tiene_acceso(uuid) to authenticated;

-- ---------- Alta automática del trial al registrarse ----------
create or replace function public.crear_suscripcion_trial()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.suscripciones (user_id, estado, trial_termina_en)
  values (new.id, 'trial', now() + interval '14 days')
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists crear_suscripcion_al_registrarse on auth.users;
create trigger crear_suscripcion_al_registrarse
  after insert on auth.users
  for each row execute function public.crear_suscripcion_trial();

-- ---------- Backfill: usuarios que ya existían reciben trial de 14 días ----------
insert into public.suscripciones (user_id, estado, trial_termina_en)
select u.id, 'trial', now() + interval '14 days'
from auth.users u
left join public.suscripciones s on s.user_id = u.id
where s.user_id is null;

-- =====================================================================
-- MODO SOLO LECTURA
-- Políticas RESTRICTIVE (se combinan con AND sobre las permisivas ya
-- existentes) que bloquean crear/editar/eliminar cuando NO hay acceso.
-- SELECT queda libre: el usuario siempre puede ver sus datos.
-- =====================================================================
do $$
declare
  t text;
  tablas text[] := array[
    'hilos', 'insumos', 'proyectos',
    'movimientos_hilo', 'movimientos_insumo',
    'etiquetas', 'hilo_etiquetas'
  ];
begin
  foreach t in array tablas loop
    -- Solo si la tabla existe (por si alguna no está creada aún)
    if to_regclass('public.' || t) is not null then
      execute format('drop policy if exists "acceso_insert" on public.%I', t);
      execute format('drop policy if exists "acceso_update" on public.%I', t);
      execute format('drop policy if exists "acceso_delete" on public.%I', t);

      execute format(
        'create policy "acceso_insert" on public.%I as restrictive for insert to authenticated with check (public.tiene_acceso())', t);
      execute format(
        'create policy "acceso_update" on public.%I as restrictive for update to authenticated using (public.tiene_acceso())', t);
      execute format(
        'create policy "acceso_delete" on public.%I as restrictive for delete to authenticated using (public.tiene_acceso())', t);
    end if;
  end loop;
end $$;

-- =====================================================================
-- COMANDOS DE ADMINISTRACIÓN (para ti, correr manualmente cuando haga falta)
-- =====================================================================
-- Dar plan VITALICIO a una embajadora (acceso gratis para siempre):
--   update public.suscripciones set estado = 'vitalicia', actualizado_en = now()
--   where user_id = (select id from auth.users where email = 'correo@ejemplo.com');
--
-- Quitar el vitalicio (vuelve a depender de trial/pago):
--   update public.suscripciones set estado = 'vencida', actualizado_en = now()
--   where user_id = (select id from auth.users where email = 'correo@ejemplo.com');
--
-- Extender manualmente el acceso de alguien hasta una fecha:
--   update public.suscripciones set periodo_termina_en = '2027-01-01', actualizado_en = now()
--   where user_id = (select id from auth.users where email = 'correo@ejemplo.com');
-- =====================================================================
