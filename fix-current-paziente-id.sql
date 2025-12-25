-- Script per correggere current_paziente_id()
-- La funzione deve restituire l'ID del paziente (chiave primaria), non auth_user_id
-- Questo è necessario perché prelievi.paziente_id punta a pazienti.id

-- Verifica la definizione attuale
SELECT 
  p.proname,
  pg_get_functiondef(p.oid) AS definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname = 'current_paziente_id';

-- Correzione: restituisce id invece di auth_user_id
CREATE OR REPLACE FUNCTION public.current_paziente_id()
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $function$
  SELECT id
  FROM public.pazienti
  WHERE auth_user_id = auth.uid()
  LIMIT 1;
$function$;

-- Verifica che la funzione sia stata corretta
SELECT 
  p.proname,
  pg_get_functiondef(p.oid) AS definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname = 'current_paziente_id';


