-- =====================================================================
-- NUDITOS · Galería de imágenes por patrón (Fase 2.1)
-- Ejecutar UNA VEZ en el SQL Editor de Supabase.
-- =====================================================================
-- Cada patrón puede tener varias fotos además del thumbnail. Se guardan en
-- el bucket público 'patrones-thumbs' (mismo que el thumbnail), bajo
-- {patron_id}/galeria/{archivo}. La tabla solo guarda la ruta y el orden.
-- =====================================================================

create table if not exists public.patron_imagenes (
  id         uuid primary key default gen_random_uuid(),
  patron_id  uuid not null references public.patrones(id) on delete cascade,
  path       text not null,            -- ruta en bucket 'patrones-thumbs'
  orden      integer not null default 0,
  creado_en  timestamptz not null default now()
);

create index if not exists patron_imagenes_patron_idx
  on public.patron_imagenes (patron_id, orden);

alter table public.patron_imagenes enable row level security;

-- Lectura pública solo de imágenes de patrones visibles (o cualquiera si admin).
drop policy if exists "imagenes lectura publica" on public.patron_imagenes;
create policy "imagenes lectura publica" on public.patron_imagenes
  for select to anon, authenticated
  using (
    exists (
      select 1 from public.patrones p
      where p.id = patron_id
        and (p.estado in ('publicado', 'preventa') or public.es_admin())
    )
  );

-- Solo el admin agrega/edita/borra.
drop policy if exists "imagenes admin escribe" on public.patron_imagenes;
create policy "imagenes admin escribe" on public.patron_imagenes
  for all to authenticated
  using (public.es_admin())
  with check (public.es_admin());
