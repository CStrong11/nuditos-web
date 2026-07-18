-- =====================================================================
-- NUDITOS · Insumos (ojitos de seguridad, etiquetas, cajitas, etc.)
-- Ejecutar UNA VEZ en el SQL Editor de Supabase.
-- =====================================================================
-- Convención: el stock SIEMPRE se guarda en UNIDADES sueltas.
--   · tipo_uso = 'par'    -> al usar 1 par se descuentan 2 unidades
--   · tipo_uso = 'unidad' -> al usar 1 se descuenta 1 unidad
-- El paquete se define en el insumo (unidades_por_paquete + costo del
-- paquete), igual que el ovillo en los hilos. Costo unitario =
-- costo / unidades_por_paquete.
-- =====================================================================

-- ---------- Tabla: insumos ----------
create table if not exists public.insumos (
  id                   uuid primary key default gen_random_uuid(),
  user_id              uuid not null references auth.users(id) on delete cascade,
  nombre               text not null,
  descripcion          text,
  marca                text,
  color                text,
  tipo_uso             text not null default 'unidad'
                         check (tipo_uso in ('unidad', 'par')),
  cantidad_actual      numeric not null default 0,
  cantidad_inicial     numeric not null default 0,
  cantidad_minima      numeric,
  unidades_por_paquete numeric,          -- cuántas unidades trae un paquete
  costo                numeric,          -- precio de UN paquete
  imagen_url           text,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create index if not exists insumos_user_id_idx on public.insumos (user_id);

-- ---------- Tabla: movimientos_insumo ----------
create table if not exists public.movimientos_insumo (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  insumo_id    uuid not null references public.insumos(id) on delete cascade,
  proyecto_id  uuid references public.proyectos(id) on delete set null,
  cantidad     numeric not null,          -- siempre en UNIDADES
  tipo         text not null check (tipo in ('uso','reposicion','ajuste','inicial')),
  nota         text,
  created_at   timestamptz not null default now()
);

create index if not exists movimientos_insumo_insumo_idx   on public.movimientos_insumo (insumo_id);
create index if not exists movimientos_insumo_proyecto_idx on public.movimientos_insumo (proyecto_id);
create index if not exists movimientos_insumo_user_idx     on public.movimientos_insumo (user_id);

-- ---------- RLS: cada quien ve y edita solo lo suyo ----------
alter table public.insumos            enable row level security;
alter table public.movimientos_insumo enable row level security;

drop policy if exists "insumos propios" on public.insumos;
create policy "insumos propios" on public.insumos
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "movimientos insumo propios" on public.movimientos_insumo;
create policy "movimientos insumo propios" on public.movimientos_insumo
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ---------- RPC: usar_insumo ----------
-- p_cantidad SIEMPRE llega en unidades (el cliente ya convirtió pares/paquetes).
create or replace function public.usar_insumo(
  p_insumo_id   uuid,
  p_cantidad    numeric,
  p_proyecto_id uuid default null,
  p_nota        text default null
) returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_stock numeric;
begin
  if p_cantidad is null or p_cantidad <= 0 then
    raise exception 'La cantidad debe ser mayor a cero';
  end if;

  select cantidad_actual into v_stock
    from insumos
   where id = p_insumo_id and user_id = auth.uid()
   for update;

  if v_stock is null then
    raise exception 'Insumo no encontrado';
  end if;

  if p_cantidad > v_stock then
    raise exception 'Stock insuficiente: disponible %', v_stock;
  end if;

  update insumos
     set cantidad_actual = cantidad_actual - p_cantidad,
         updated_at      = now()
   where id = p_insumo_id and user_id = auth.uid();

  insert into movimientos_insumo (user_id, insumo_id, proyecto_id, cantidad, tipo, nota)
  values (auth.uid(), p_insumo_id, p_proyecto_id, p_cantidad, 'uso', nullif(p_nota, ''));
end;
$$;

-- ---------- RPC: reponer_insumo ----------
create or replace function public.reponer_insumo(
  p_insumo_id uuid,
  p_cantidad  numeric,
  p_nota      text default null
) returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
  if p_cantidad is null or p_cantidad <= 0 then
    raise exception 'La cantidad debe ser mayor a cero';
  end if;

  if not exists (select 1 from insumos where id = p_insumo_id and user_id = auth.uid()) then
    raise exception 'Insumo no encontrado';
  end if;

  update insumos
     set cantidad_actual  = cantidad_actual + p_cantidad,
         cantidad_inicial = cantidad_inicial + p_cantidad,
         updated_at       = now()
   where id = p_insumo_id and user_id = auth.uid();

  insert into movimientos_insumo (user_id, insumo_id, proyecto_id, cantidad, tipo, nota)
  values (auth.uid(), p_insumo_id, null, p_cantidad, 'reposicion', nullif(p_nota, ''));
end;
$$;

grant execute on function public.usar_insumo(uuid, numeric, uuid, text)  to authenticated;
grant execute on function public.reponer_insumo(uuid, numeric, text)     to authenticated;
