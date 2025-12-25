-- Script per aggiungere SECURITY DEFINER alle funzioni is_admin, is_staff, is_paziente
-- Questo permette alle funzioni di bypassare RLS e leggere profili_utenti

-- Fix is_admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.profili_utenti p
    WHERE p.id = (SELECT auth.uid())
      AND p.attivo = true
      AND p.ruolo = 'admin'
  );
$function$;

-- Fix is_staff
CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.profili_utenti p
    WHERE p.id = (SELECT auth.uid())
      AND p.attivo = true
      AND p.ruolo IN ('admin', 'segretaria')
  );
$function$;

-- Fix is_paziente
CREATE OR REPLACE FUNCTION public.is_paziente()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.profili_utenti p
    WHERE p.id = (SELECT auth.uid())
      AND p.attivo = true
      AND p.ruolo = 'paziente'
  );
$function$;



