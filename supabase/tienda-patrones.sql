-- =====================================================================
-- NUDITOS · Tienda de patrones (Fase 1: base de datos + admin)
-- Ejecutar UNA VEZ en el SQL Editor de Supabase.
-- =====================================================================
-- Modelo:
--   · La dueña (es_admin) sube patrones desde admin.nuditoscol.com:
--     PDF (privado), thumbnail (público), precio, descuento, preventa.
--   · La tejedora compra como invitada (solo correo). Lemon Squeezy cobra;
--     el webhook crea la compra y enviamos el PDF por correo.
--   · PDFs en bucket privado 'patrones-pdf': solo se acceden con enlace
--     firmado temporal generado por el servidor (service_role).
-- =====================================================================

-- ---------- Admin: bandera en perfiles + helper ----------
alter table public.perfiles
  add column if not exists es_admin boolean not null default false;

create or replace function public.es_admin(p_user uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select p.es_admin from public.perfiles p where p.id = p_user), false);
$$;

grant execute on function public.es_admin(uuid) to authenticated, anon;

-- ---------- Tabla: patrones ----------
create table if not exists public.patrones (
  id                uuid primary key default gen_random_uuid(),
  slug              text not null unique,
  titulo            text not null,
  descripcion       text,
  precio            numeric(10,2) not null,          -- precio normal
  precio_descuento  numeric(10,2),                   -- opcional: si existe, es el precio a cobrar
  moneda            text not null default 'USD',
  -- 'borrador' | 'publicado' | 'preventa' | 'archivado'
  estado            text not null default 'borrador',
  fecha_lanzamiento date,                            -- solo preventa: cuándo se entrega el PDF
  -- 'principiante' | 'intermedio' | 'avanzado' | null
  dificultad        text,
  thumbnail_path    text,                            -- ruta en bucket 'patrones-thumbs'
  pdf_path          text,                            -- ruta en bucket 'patrones-pdf'
  destacado         boolean not null default false,  -- aparece en la sección de la landing
  creado_por        uuid references auth.users(id),
  creado_en         timestamptz not null default now(),
  actualizado_en    timestamptz not null default now(),
  constraint patrones_estado_chk
    check (estado in ('borrador', 'publicado', 'preventa', 'archivado'))
);

create index if not exists patrones_estado_idx on public.patrones (estado);
create index if not exists patrones_destacado_idx on public.patrones (destacado) where destacado;

-- Mantener actualizado_en al día en cada update.
create or replace function public.tocar_actualizado_en()
returns trigger
language plpgsql
as $$
begin
  new.actualizado_en := now();
  return new;
end;
$$;

drop trigger if exists patrones_touch on public.patrones;
create trigger patrones_touch
  before update on public.patrones
  for each row execute function public.tocar_actualizado_en();

-- ---------- Tabla: compras_patron (la llena el webhook) ----------
create table if not exists public.compras_patron (
  id             uuid primary key default gen_random_uuid(),
  patron_id      uuid not null references public.patrones(id) on delete restrict,
  email          text not null,
  user_id        uuid references auth.users(id) on delete set null,  -- si tiene cuenta
  -- 'pagada' | 'entregada' | 'reembolsada'
  estado         text not null default 'pagada',
  es_preventa    boolean not null default false,
  token          uuid not null default gen_random_uuid(),            -- enlace de descarga
  ls_order_id    text,
  monto          numeric(10,2),
  moneda         text default 'USD',
  descargas      integer not null default 0,
  comprado_en    timestamptz not null default now(),
  entregado_en   timestamptz,
  constraint compras_patron_estado_chk
    check (estado in ('pagada', 'entregada', 'reembolsada'))
);

create index if not exists compras_patron_token_idx   on public.compras_patron (token);
create index if not exists compras_patron_email_idx   on public.compras_patron (lower(email));
create index if not exists compras_patron_patron_idx  on public.compras_patron (patron_id);
create index if not exists compras_patron_user_idx    on public.compras_patron (user_id);
-- Evita duplicar la misma compra si el webhook llega dos veces.
create unique index if not exists compras_patron_order_uidx
  on public.compras_patron (ls_order_id) where ls_order_id is not null;

-- ---------- RLS ----------
alter table public.patrones        enable row level security;
alter table public.compras_patron  enable row level security;

-- Patrones: el público lee los publicados/en preventa; el admin ve y edita todo.
drop policy if exists "patrones lectura publica" on public.patrones;
create policy "patrones lectura publica" on public.patrones
  for select to anon, authenticated
  using (estado in ('publicado', 'preventa') or public.es_admin());

drop policy if exists "patrones admin escribe" on public.patrones;
create policy "patrones admin escribe" on public.patrones
  for all to authenticated
  using (public.es_admin())
  with check (public.es_admin());

-- Compras: el comprador ve las suyas (si tiene cuenta); el admin ve todas.
-- Las escribe únicamente el webhook (service_role, que se salta RLS).
drop policy if exists "compras propias o admin" on public.compras_patron;
create policy "compras propias o admin" on public.compras_patron
  for select to authenticated
  using (user_id = auth.uid() or public.es_admin());

-- ---------- Storage: buckets ----------
-- Thumbnails: público para mostrar en la tienda.
insert into storage.buckets (id, name, public)
values ('patrones-thumbs', 'patrones-thumbs', true)
on conflict (id) do nothing;

-- PDFs: PRIVADO. Solo el servidor (service_role) genera enlaces firmados.
insert into storage.buckets (id, name, public)
values ('patrones-pdf', 'patrones-pdf', false)
on conflict (id) do nothing;

-- Thumbs: lectura pública; solo el admin sube/edita/borra.
drop policy if exists "thumbs lectura publica" on storage.objects;
create policy "thumbs lectura publica"
on storage.objects for select
using (bucket_id = 'patrones-thumbs');

drop policy if exists "thumbs admin escribe" on storage.objects;
create policy "thumbs admin escribe"
on storage.objects for all to authenticated
using (bucket_id = 'patrones-thumbs' and public.es_admin())
with check (bucket_id = 'patrones-thumbs' and public.es_admin());

-- PDFs: sin lectura pública. Solo el admin administra los archivos;
-- la entrega al comprador la hace el servidor con enlaces firmados.
drop policy if exists "pdf admin administra" on storage.objects;
create policy "pdf admin administra"
on storage.objects for all to authenticated
using (bucket_id = 'patrones-pdf' and public.es_admin())
with check (bucket_id = 'patrones-pdf' and public.es_admin());

-- ---------- Marcar a las dueñas como admin ----------
-- (mayritaleja.08@gmail.com debe haberse registrado antes en la app.)
update public.perfiles set es_admin = true
where id in (
  select id from auth.users
  where lower(email) in ('cristianstrong@gmail.com', 'mayritaleja.08@gmail.com')
);

-- =====================================================================
-- COMANDOS DE ADMINISTRACIÓN (correr manualmente cuando haga falta)
-- =====================================================================
-- Hacer admin a alguien más (debe tener cuenta):
--   update public.perfiles set es_admin = true
--   where id = (select id from auth.users where lower(email) = 'correo@ejemplo.com');
--
-- Quitar admin:
--   update public.perfiles set es_admin = false
--   where id = (select id from auth.users where lower(email) = 'correo@ejemplo.com');
--
-- Ver ventas de un patrón:
--   select email, estado, monto, comprado_en from public.compras_patron
--   where patron_id = (select id from public.patrones where slug = 'mi-patron')
--   order by comprado_en desc;
-- =====================================================================
