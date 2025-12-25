-- Script FINALE per correggere le funzioni is_admin, is_staff, is_paziente
-- 
-- Problema identificato: Dipendenza circolare tra policy RLS su profili_utenti
-- e le funzioni is_staff/is_admin che cercano di leggere quella tabella.
--
-- Soluzione: Le funzioni SECURITY DEFINER dovrebbero bypassare RLS, ma PostgreSQL
-- potrebbe ancora applicare RLS quando le funzioni vengono chiamate nel contesto
-- di una policy che dipende da loro.
--
-- La policy su profili_utenti è: (is_staff() OR (id = auth.uid()))
-- Quindi possiamo sfruttare la parte (id = auth.uid()) per far funzionare le funzioni
-- senza dipendere da is_staff().

-- Versione ottimizzata che sfrutta auth.uid() per evitare dipendenze circolari
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $function$
  -- SECURITY DEFINER dovrebbe bypassare RLS, ma usiamo una query che sfrutta
  -- la parte (id = auth.uid()) della policy per evitare dipendenze circolari
  SELECT EXISTS (
    SELECT 1
    FROM public.profili_utenti
    WHERE id = auth.uid()
      AND attivo = true
      AND ruolo = 'admin'
  );
$function$;

CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $function$
  -- SECURITY DEFINER dovrebbe bypassare RLS, ma usiamo una query che sfrutta
  -- la parte (id = auth.uid()) della policy per evitare dipendenze circolari
  SELECT EXISTS (
    SELECT 1
    FROM public.profili_utenti
    WHERE id = auth.uid()
      AND attivo = true
      AND ruolo IN ('admin', 'segretaria')
  );
$function$;

CREATE OR REPLACE FUNCTION public.is_paziente()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $function$
  -- SECURITY DEFINER dovrebbe bypassare RLS, ma usiamo una query che sfrutta
  -- la parte (id = auth.uid()) della policy per evitare dipendenze circolari
  SELECT EXISTS (
    SELECT 1
    FROM public.profili_utenti
    WHERE id = auth.uid()
      AND attivo = true
      AND ruolo = 'paziente'
  );
$function$;

-- Dopo aver eseguito questo script, verifica:
-- SELECT is_admin(), is_staff(), is_paziente();
-- 
-- Se le funzioni restituiscono ancora false, il problema potrebbe essere che:
-- 1. Il profilo utente non esiste o non è attivo
-- 2. Il ruolo nel profilo non corrisponde
-- 3. auth.uid() non restituisce l'ID corretto
--
-- Verifica anche:
-- SELECT * FROM profili_utenti WHERE id = auth.uid();



