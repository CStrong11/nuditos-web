-- =====================================================================
-- NUDITOS · Bucket de imágenes para Insumos
-- Ejecutar en el SQL Editor de Supabase.
-- =====================================================================
-- Mismo patrón que los buckets 'avatars', 'hilos' y 'proyectos':
-- público para lectura, y cada usuario solo escribe dentro de su
-- carpeta {uid}/.
-- =====================================================================

-- Bucket público para fotos de insumos
insert into storage.buckets (id, name, public)
values ('insumos', 'insumos', true)
on conflict (id) do nothing;

drop policy if exists "insumos lectura publica" on storage.objects;
create policy "insumos lectura publica"
on storage.objects for select
using (bucket_id = 'insumos');

drop policy if exists "insumos subir propio" on storage.objects;
create policy "insumos subir propio"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'insumos'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "insumos actualizar propio" on storage.objects;
create policy "insumos actualizar propio"
on storage.objects for update to authenticated
using (
  bucket_id = 'insumos'
  and (storage.foldername(name))[1] = auth.uid()::text
);
