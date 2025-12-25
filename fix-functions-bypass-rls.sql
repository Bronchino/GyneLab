-- Script per correggere le funzioni is_admin, is_staff, is_paziente
-- per assicurarsi che possano leggere profili_utenti anche se la tabella ha RLS
-- Le funzioni SECURITY DEFINER dovrebbero già bypassare RLS, ma questo script
-- assicura che funzionino correttamente usando SET LOCAL row_security = off

-- Fix is_admin con bypass esplicito di RLS
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $function$
BEGIN
  -- SECURITY DEFINER dovrebbe già bypassare RLS, ma usiamo SET LOCAL per sicurezza
  PERFORM set_config('row_security', 'off', false);
  
  RETURN EXISTS (
    SELECT 1
    FROM public.profili_utenti p
    WHERE p.id = auth.uid()
      AND p.attivo = true
      AND p.ruolo = 'admin'
  );
END;
$function$;

-- Fix is_staff con bypass esplicito di RLS
CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $function$
BEGIN
  -- SECURITY DEFINER dovrebbe già bypassare RLS, ma usiamo SET LOCAL per sicurezza
  PERFORM set_config('row_security', 'off', false);
  
  RETURN EXISTS (
    SELECT 1
    FROM public.profili_utenti p
    WHERE p.id = auth.uid()
      AND p.attivo = true
      AND p.ruolo IN ('admin', 'segretaria')
  );
END;
$function$;

-- Fix is_paziente con bypass esplicito di RLS
CREATE OR REPLACE FUNCTION public.is_paziente()
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $function$
BEGIN
  -- SECURITY DEFINER dovrebbe già bypassare RLS, ma usiamo SET LOCAL per sicurezza
  PERFORM set_config('row_security', 'off', false);
  
  RETURN EXISTS (
    SELECT 1
    FROM public.profili_utenti p
    WHERE p.id = auth.uid()
      AND p.attivo = true
      AND p.ruolo = 'paziente'
  );
END;
$function$;

-- Nota: In realtà, set_config potrebbe non funzionare come vogliamo.
-- Una soluzione migliore è usare direttamente SQL con SECURITY DEFINER,
-- che dovrebbe già bypassare RLS. Proviamo prima con una versione semplificata.

-- Versione alternativa (più semplice, dovrebbe funzionare con SECURITY DEFINER):
-- CREATE OR REPLACE FUNCTION public.is_staff()
-- RETURNS boolean
-- LANGUAGE sql
-- STABLE
-- SECURITY DEFINER
-- SET search_path TO 'public', 'extensions'
-- AS $function$
--   SELECT EXISTS (
--     SELECT 1
--     FROM public.profili_utenti p
--     WHERE p.id = (SELECT auth.uid())
--       AND p.attivo = true
--       AND p.ruolo IN ('admin', 'segretaria')
--   );
-- $function$;

-- Se la versione SQL semplice non funziona, potrebbe essere necessario
-- modificare le policy su profili_utenti per permettere alle funzioni
-- SECURITY DEFINER di leggere senza dipendenze circolari.



