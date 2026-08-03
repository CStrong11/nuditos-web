-- =====================================================================
-- NUDITOS · Embajadoras (códigos de referido → 1 mes gratis)
-- Ejecutar UNA VEZ en el SQL Editor de Supabase.
--
-- · Cada embajadora tiene un código. Quien lo canjea recibe +30 días de
--   acceso (se suman a lo que tenga de trial).
-- · Un canje por cuenta. Sin auto-referido. Usos ilimitados por código.
-- · Los códigos los creas tú (ver COMANDOS DE ADMIN abajo).
-- =====================================================================

-- ---------- Tabla: códigos de embajadora ----------
create table if not exists public.codigos_embajadora (
  id           uuid primary key default gen_random_uuid(),
  embajadora_id uuid not null references auth.users(id) on delete cascade,
  codigo       text not null,
  activo       boolean not null default true,
  nota         text,               -- referencia interna (nombre de la embajadora, etc.)
  created_at   timestamptz not null default now()
);

-- Código único sin importar mayúsculas/minúsculas
create unique index if not exists codigos_embajadora_codigo_unico
  on public.codigos_embajadora (upper(codigo));

-- ---------- Tabla: canjes (una fila por cuenta que canjea) ----------
create table if not exists public.canjes_codigo (
  id           uuid primary key default gen_random_uuid(),
  codigo_id    uuid not null references public.codigos_embajadora(id) on delete cascade,
  embajadora_id uuid not null references auth.users(id) on delete cascade,
  referido_id  uuid not null unique references auth.users(id) on delete cascade,
  created_at   timestamptz not null default now()
);

create index if not exists canjes_codigo_codigo_idx on public.canjes_codigo (codigo_id);

-- ---------- RLS ----------
-- La escritura es solo vía el RPC (security definer). Lectura: la embajadora
-- puede ver lo suyo (por si a futuro mostramos su código/canjes en la app).
alter table public.codigos_embajadora enable row level security;
alter table public.canjes_codigo      enable row level security;

drop policy if exists "codigo propio lectura" on public.codigos_embajadora;
create policy "codigo propio lectura" on public.codigos_embajadora
  for select to authenticated using (embajadora_id = auth.uid());

drop policy if exists "canje propio lectura" on public.canjes_codigo;
create policy "canje propio lectura" on public.canjes_codigo
  for select to authenticated
  using (embajadora_id = auth.uid() or referido_id = auth.uid());

-- ---------- RPC: canjear_codigo ----------
-- Devuelve la nueva fecha de fin de acceso (trial_termina_en).
create or replace function public.canjear_codigo(p_codigo text)
returns timestamptz
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid   uuid := auth.uid();
  v_cod   public.codigos_embajadora%rowtype;
  v_estado text;
  v_nueva timestamptz;
begin
  if v_uid is null then
    raise exception 'Sesión no disponible';
  end if;
  if p_codigo is null or length(trim(p_codigo)) = 0 then
    raise exception 'Ingresa un código';
  end if;

  select * into v_cod
    from codigos_embajadora
   where upper(codigo) = upper(trim(p_codigo)) and activo
   limit 1;
  if not found then
    raise exception 'Código no válido o inactivo';
  end if;

  if v_cod.embajadora_id = v_uid then
    raise exception 'No puedes usar tu propio código';
  end if;

  if exists (select 1 from canjes_codigo where referido_id = v_uid) then
    raise exception 'Ya canjeaste un código antes';
  end if;

  -- Vitalicias no necesitan el mes gratis
  select estado into v_estado from suscripciones where user_id = v_uid;
  if v_estado = 'vitalicia' then
    raise exception 'Ya tienes acceso vitalicio';
  end if;

  -- Registrar el canje (el unique en referido_id evita dobles por carrera)
  insert into canjes_codigo (codigo_id, embajadora_id, referido_id)
  values (v_cod.id, v_cod.embajadora_id, v_uid);

  -- Sumar 30 días al acceso actual (desde lo que tenga, o desde ahora si venció)
  v_nueva := greatest(coalesce((select trial_termina_en from suscripciones where user_id = v_uid), now()), now())
             + interval '30 days';

  update suscripciones
     set trial_termina_en = v_nueva,
         estado = case when estado in ('vencida', 'cancelada') then 'trial' else estado end,
         actualizado_en = now()
   where user_id = v_uid;

  -- Por si no existía la fila de suscripción (caso raro)
  if not found then
    insert into suscripciones (user_id, estado, trial_termina_en)
    values (v_uid, 'trial', v_nueva);
  end if;

  return v_nueva;
end;
$$;

revoke execute on function public.canjear_codigo(text) from public, anon;
grant execute on function public.canjear_codigo(text) to authenticated;

-- =====================================================================
-- COMANDOS DE ADMIN (para ti)
-- =====================================================================
-- Crear un código para una embajadora:
--   insert into public.codigos_embajadora (embajadora_id, codigo, nota)
--   values (
--     (select id from auth.users where lower(email) = lower('embajadora@correo.com')),
--     'MARIA', 'María — Instagram'
--   );
--
-- Desactivar un código:
--   update public.codigos_embajadora set activo = false where upper(codigo) = upper('MARIA');
--
-- Ver cuántas cuentas ha traído cada código:
--   select c.codigo, c.nota, count(k.id) as canjes
--   from public.codigos_embajadora c
--   left join public.canjes_codigo k on k.codigo_id = c.id
--   group by c.id, c.codigo, c.nota
--   order by canjes desc;
-- =====================================================================
