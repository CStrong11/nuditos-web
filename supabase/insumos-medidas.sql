-- =====================================================================
-- NUDITOS · Insumos: agregar medidas por peso y por longitud
-- Ejecutar en el SQL Editor de Supabase DESPUÉS de insumos.sql
-- =====================================================================
-- Amplía tipo_uso de 2 a 4 opciones:
--   'unidad'   -> se cuenta por piezas sueltas   (ej. etiquetas, cajitas)
--   'par'      -> se cuenta por pares, 1 par = 2 (ej. ojitos)
--   'peso'     -> se pesa                        (ej. relleno, fibra)
--   'longitud' -> se mide                        (ej. cinta, elástico)
--
-- Para 'peso' y 'longitud', cantidad_actual queda expresada en la unidad
-- elegida (g/kg o m/cm), que se guarda en la nueva columna `unidad`.
-- `unidades_por_paquete` pasa a significar "cuánto trae un paquete" en
-- esa misma unidad (ej. una bolsa de relleno de 500 g).
-- =====================================================================

-- 1) Permitir las dos medidas nuevas
alter table public.insumos
  drop constraint if exists insumos_tipo_uso_check;

alter table public.insumos
  add constraint insumos_tipo_uso_check
  check (tipo_uso in ('unidad', 'par', 'peso', 'longitud'));

-- 2) Unidad de medida (g/kg para peso, m/cm para longitud; null si son piezas)
alter table public.insumos
  add column if not exists unidad text;

-- 3) Dejar coherentes los insumos que ya existan
update public.insumos
   set unidad = null
 where tipo_uso in ('unidad', 'par')
   and unidad is not null;
