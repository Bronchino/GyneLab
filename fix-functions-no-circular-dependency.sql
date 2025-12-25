-- Script per correggere le funzioni is_admin, is_staff, is_paziente
-- per evitare dipendenze circolari con le policy RLS su profili_utenti
-- 
-- Il problema: le policy su profili_utenti usano is_staff(), ma is_staff() 
-- cerca di leggere profili_utenti, creando un ciclo.
--
-- Soluzione: Le funzioni SECURITY DEFINER dovrebbero già bypassare RLS,
-- ma se non funziona, possiamo modificare le funzioni per usare
-- una query che bypassa esplicitamente RLS usando il ruolo del function owner.

-- IMPORTANTE: Assicurati che il ruolo che possiede le funzioni (di solito postgres o supabase_admin)
-- abbia i permessi necessari su profili_utenti.

-- Versione con plpgsql che forza il bypass di RLS usando SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
  result boolean;
BEGIN
  -- SECURITY DEFINER dovrebbe già bypassare RLS quando eseguita dal function owner
  -- Ma per sicurezza, usiamo una query diretta
  SELECT EXISTS (
    SELECT 1
    FROM public.profili_utenti p
    WHERE p.id = auth.uid()
      AND p.attivo = true
      AND p.ruolo = 'admin'
  ) INTO result;
  
  RETURN COALESCE(result, false);
END;
$function$;

CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
  result boolean;
BEGIN
  -- SECURITY DEFINER dovrebbe già bypassare RLS quando eseguita dal function owner
  SELECT EXISTS (
    SELECT 1
    FROM public.profili_utenti p
    WHERE p.id = auth.uid()
      AND p.attivo = true
      AND p.ruolo IN ('admin', 'segretaria')
  ) INTO result;
  
  RETURN COALESCE(result, false);
END;
$function$;

CREATE OR REPLACE FUNCTION public.is_paziente()
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
  result boolean;
BEGIN
  -- SECURITY DEFINER dovrebbe già bypassare RLS quando eseguita dal function owner
  SELECT EXISTS (
    SELECT 1
    FROM public.profili_utenti p
    WHERE p.id = auth.uid()
      AND p.attivo = true
      AND p.ruolo = 'paziente'
  ) INTO result;
  
  RETURN COALESCE(result, false);
END;
$function$;

-- Dopo aver eseguito questo script, verifica che le funzioni funzionino:
-- SELECT is_admin(), is_staff(), is_paziente();



