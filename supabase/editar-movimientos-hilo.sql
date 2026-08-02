-- =====================================================================
-- NUDITOS · Editar / eliminar movimientos de hilo
-- Ejecutar UNA VEZ en el SQL Editor de Supabase.
--
-- Contexto: en movimientos_hilo la `cantidad` se guarda SIEMPRE positiva y
-- el `tipo` marca la dirección:
--   · uso        -> descontó  cantidad del stock  (revertir = sumar)
--   · reposicion -> agregó    cantidad al stock   (revertir = restar)
-- El stock (hilos.cantidad_actual) es incremental, así que editar/eliminar
-- debe ajustar el stock de forma atómica.
--
-- Solo se permiten editar/eliminar movimientos 'uso' y 'reposicion'.
-- =====================================================================

-- ---------- Ligar el tiempo al movimiento que lo originó ----------
-- Así, al eliminar un uso, su tiempo se borra en cascada.
alter table public.tiempos_proyecto
  add column if not exists movimiento_id uuid
  references public.movimientos_hilo(id) on delete cascade;

create index if not exists tiempos_proyecto_mov_idx
  on public.tiempos_proyecto (movimiento_id);


-- ---------- RPC: editar_movimiento_hilo ----------
create or replace function public.editar_movimiento_hilo(
  p_id          uuid,
  p_cantidad    numeric,
  p_proyecto_id uuid default null,
  p_nota        text default null
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid        uuid := auth.uid();
  v_mov        movimientos_hilo%rowtype;
  v_stock      numeric;
  v_efecto_old numeric;
  v_efecto_new numeric;
  v_nuevo      numeric;
begin
  if v_uid is null then
    raise exception 'Sesión no disponible';
  end if;
  if not public.tiene_acceso() then
    raise exception 'Tu acceso está en modo solo lectura';
  end if;
  if p_cantidad is null or p_cantidad <= 0 then
    raise exception 'La cantidad debe ser mayor a cero';
  end if;

  select * into v_mov
    from movimientos_hilo
   where id = p_id and user_id = v_uid
   for update;
  if not found then
    raise exception 'Movimiento no encontrado';
  end if;
  if v_mov.tipo not in ('uso', 'reposicion') then
    raise exception 'Ese tipo de movimiento no se puede editar';
  end if;

  select cantidad_actual into v_stock
    from hilos
   where id = v_mov.hilo_id and user_id = v_uid
   for update;
  if v_stock is null then
    raise exception 'Hilo no encontrado';
  end if;

  -- Efecto sobre el stock: uso resta, reposicion suma
  v_efecto_old := case when v_mov.tipo = 'uso' then -v_mov.cantidad else v_mov.cantidad end;
  v_efecto_new := case when v_mov.tipo = 'uso' then -p_cantidad     else p_cantidad     end;
  v_nuevo := v_stock - v_efecto_old + v_efecto_new;

  if v_nuevo < 0 then
    raise exception 'La edición dejaría el stock en negativo (disponible: %)', v_stock;
  end if;

  update hilos
     set cantidad_actual = v_nuevo
   where id = v_mov.hilo_id and user_id = v_uid;

  -- El proyecto solo aplica a los usos
  update movimientos_hilo
     set cantidad    = p_cantidad,
         nota        = nullif(p_nota, ''),
         proyecto_id = case when v_mov.tipo = 'uso' then p_proyecto_id else proyecto_id end
   where id = p_id and user_id = v_uid;

  -- Mover / soltar el tiempo ligado según el nuevo proyecto
  if v_mov.tipo = 'uso' then
    if p_proyecto_id is null then
      delete from tiempos_proyecto where movimiento_id = p_id and user_id = v_uid;
    else
      update tiempos_proyecto set proyecto_id = p_proyecto_id
       where movimiento_id = p_id and user_id = v_uid;
    end if;
  end if;
end;
$$;

revoke execute on function public.editar_movimiento_hilo(uuid, numeric, uuid, text) from public, anon;
grant execute on function public.editar_movimiento_hilo(uuid, numeric, uuid, text) to authenticated;


-- ---------- RPC: eliminar_movimiento_hilo ----------
create or replace function public.eliminar_movimiento_hilo(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid    uuid := auth.uid();
  v_mov    movimientos_hilo%rowtype;
  v_stock  numeric;
  v_efecto numeric;
  v_nuevo  numeric;
begin
  if v_uid is null then
    raise exception 'Sesión no disponible';
  end if;
  if not public.tiene_acceso() then
    raise exception 'Tu acceso está en modo solo lectura';
  end if;

  select * into v_mov
    from movimientos_hilo
   where id = p_id and user_id = v_uid
   for update;
  if not found then
    raise exception 'Movimiento no encontrado';
  end if;
  if v_mov.tipo not in ('uso', 'reposicion') then
    raise exception 'Ese tipo de movimiento no se puede eliminar';
  end if;

  select cantidad_actual into v_stock
    from hilos
   where id = v_mov.hilo_id and user_id = v_uid
   for update;
  if v_stock is null then
    raise exception 'Hilo no encontrado';
  end if;

  -- Revertir el efecto del movimiento sobre el stock
  v_efecto := case when v_mov.tipo = 'uso' then -v_mov.cantidad else v_mov.cantidad end;
  v_nuevo := v_stock - v_efecto;

  if v_nuevo < 0 then
    raise exception 'Eliminar dejaría el stock en negativo (disponible: %)', v_stock;
  end if;

  update hilos
     set cantidad_actual = v_nuevo
   where id = v_mov.hilo_id and user_id = v_uid;

  -- El tiempo ligado se borra por la FK (on delete cascade)
  delete from movimientos_hilo where id = p_id and user_id = v_uid;
end;
$$;

revoke execute on function public.eliminar_movimiento_hilo(uuid) from public, anon;
grant execute on function public.eliminar_movimiento_hilo(uuid) to authenticated;
