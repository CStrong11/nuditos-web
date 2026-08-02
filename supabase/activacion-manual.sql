-- =====================================================================
-- NUDITOS · Activación MANUAL de planes (mientras Lemon Squeezy verifica
-- la tienda). Los pagos se coordinan por WhatsApp y tú activas el plan
-- aquí, en el SQL Editor de Supabase.
--
-- Cómo usar: copia el bloque del plan que corresponda, reemplaza el correo
-- y ejecútalo. El acceso lo decide public.tiene_acceso(): con estado
-- 'activa' y periodo_termina_en en el futuro, la usuaria tiene acceso.
--
-- Nota: el período se EXTIENDE desde la fecha más lejana entre "ahora" y
-- el período vigente, así renovar antes de vencer no pierde días.
-- =====================================================================


-- ---------------------------------------------------------------------
-- PLAN MENSUAL  (+1 mes)
-- ---------------------------------------------------------------------
update public.suscripciones set
  estado             = 'activa',
  plan               = 'mensual',
  periodo_termina_en = greatest(coalesce(periodo_termina_en, now()), now()) + interval '1 month',
  actualizado_en     = now()
where user_id = (select id from auth.users where lower(email) = lower('correo@ejemplo.com'));


-- ---------------------------------------------------------------------
-- PLAN TRIMESTRAL  (+3 meses)
-- ---------------------------------------------------------------------
update public.suscripciones set
  estado             = 'activa',
  plan               = 'trimestral',
  periodo_termina_en = greatest(coalesce(periodo_termina_en, now()), now()) + interval '3 months',
  actualizado_en     = now()
where user_id = (select id from auth.users where lower(email) = lower('correo@ejemplo.com'));


-- ---------------------------------------------------------------------
-- PLAN SEMESTRAL  (+6 meses)
-- ---------------------------------------------------------------------
update public.suscripciones set
  estado             = 'activa',
  plan               = 'semestral',
  periodo_termina_en = greatest(coalesce(periodo_termina_en, now()), now()) + interval '6 months',
  actualizado_en     = now()
where user_id = (select id from auth.users where lower(email) = lower('correo@ejemplo.com'));


-- ---------------------------------------------------------------------
-- PLAN ANUAL  (+12 meses)
-- ---------------------------------------------------------------------
update public.suscripciones set
  estado             = 'activa',
  plan               = 'anual',
  periodo_termina_en = greatest(coalesce(periodo_termina_en, now()), now()) + interval '12 months',
  actualizado_en     = now()
where user_id = (select id from auth.users where lower(email) = lower('correo@ejemplo.com'));


-- =====================================================================
-- OPCIONAL · Registrar el pago en el historial (aparece en "Mi plan")
-- Ajusta plan y monto (USD): mensual 5 · trimestral 13 · semestral 24 · anual 40
-- =====================================================================
insert into public.pagos (user_id, monto, moneda, plan, estado)
select id, 13, 'USD', 'trimestral', 'paid'
from auth.users where lower(email) = lower('correo@ejemplo.com');


-- =====================================================================
-- UTILIDADES
-- =====================================================================

-- Ver el estado de una usuaria:
--   select u.email, s.estado, s.plan, s.trial_termina_en, s.periodo_termina_en
--   from public.suscripciones s
--   join auth.users u on u.id = s.user_id
--   where lower(u.email) = lower('correo@ejemplo.com');

-- Cancelar / desactivar (conserva acceso hasta que venza el período):
--   update public.suscripciones set estado = 'cancelada', actualizado_en = now()
--   where user_id = (select id from auth.users where lower(email) = lower('correo@ejemplo.com'));

-- Cortar el acceso de inmediato:
--   update public.suscripciones set estado = 'vencida', periodo_termina_en = now(), actualizado_en = now()
--   where user_id = (select id from auth.users where lower(email) = lower('correo@ejemplo.com'));

-- Fijar una fecha exacta de fin de acceso (en vez de sumar meses):
--   update public.suscripciones set estado = 'activa', periodo_termina_en = '2027-01-01', actualizado_en = now()
--   where user_id = (select id from auth.users where lower(email) = lower('correo@ejemplo.com'));

-- Acceso VITALICIO (gratis para siempre, p. ej. embajadoras):
--   update public.suscripciones set estado = 'vitalicia', actualizado_en = now()
--   where user_id = (select id from auth.users where lower(email) = lower('correo@ejemplo.com'));
