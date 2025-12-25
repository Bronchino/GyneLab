-- Script per diagnosticare e risolvere il problema di accesso ai prelievi
-- Eseguire questo script nel database Supabase SQL Editor

-- 1. Verifica se RLS è abilitato sulla tabella prelievi
SELECT 
  schemaname,
  tablename,
  rowsecurity AS rls_enabled
FROM pg_tables
WHERE schemaname = 'public' 
  AND tablename = 'prelievi';

-- 2. Verifica quali policies esistono sulla tabella prelievi
SELECT 
  policyname,
  cmd,
  permissive,
  roles,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename = 'prelievi'
ORDER BY cmd, policyname;

-- 3. Verifica che le funzioni is_staff e is_admin funzionino
SELECT 
  'is_admin' AS function_name,
  is_admin() AS result
UNION ALL
SELECT 
  'is_staff' AS function_name,
  is_staff() AS result;

-- 4. Se RLS è abilitato ma non ci sono policies (o le policies sono state eliminate),
--    dobbiamo creare le policies necessarie per permettere l'accesso a staff/admin

-- Elimina eventuali policies esistenti (per ricrearle)
DROP POLICY IF EXISTS prelievi_select_staff ON public.prelievi;
DROP POLICY IF EXISTS prelievi_select_self_patient ON public.prelievi;
DROP POLICY IF EXISTS prelievi_write_staff ON public.prelievi;
DROP POLICY IF EXISTS prelievi_update_staff ON public.prelievi;
DROP POLICY IF EXISTS prelievi_delete_staff ON public.prelievi;

-- Crea le policies necessarie per prelievi
-- Policy per SELECT: staff può vedere tutti i prelievi, pazienti solo i propri
CREATE POLICY prelievi_select_staff ON public.prelievi
  FOR SELECT
  TO authenticated
  USING (is_staff());

CREATE POLICY prelievi_select_self_patient ON public.prelievi
  FOR SELECT
  TO authenticated
  USING (is_paziente() AND paziente_id = current_paziente_id());

-- Policy per INSERT: solo staff può inserire prelievi
CREATE POLICY prelievi_write_staff ON public.prelievi
  FOR INSERT
  TO authenticated
  WITH CHECK (is_staff());

-- Policy per UPDATE: solo staff può aggiornare prelievi
CREATE POLICY prelievi_update_staff ON public.prelievi
  FOR UPDATE
  TO authenticated
  USING (is_staff())
  WITH CHECK (is_staff());

-- Policy per DELETE: solo staff può eliminare prelievi
CREATE POLICY prelievi_delete_staff ON public.prelievi
  FOR DELETE
  TO authenticated
  USING (is_staff());

-- 5. Verifica che le policies siano state create correttamente
SELECT 
  policyname,
  cmd,
  permissive,
  roles,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename = 'prelievi'
ORDER BY cmd, policyname;

-- 6. Verifica/correzione della funzione current_paziente_id()
-- La funzione dovrebbe restituire l'ID del paziente (chiave primaria), non auth_user_id
-- Se la funzione restituisce auth_user_id invece di id, correggila:

-- Verifica la definizione attuale:
SELECT 
  p.proname,
  pg_get_functiondef(p.oid) AS definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname = 'current_paziente_id';

-- CORREZIONE: current_paziente_id() deve restituire l'ID del paziente (chiave primaria), non auth_user_id
-- Questo è necessario perché prelievi.paziente_id punta a pazienti.id, non a pazienti.auth_user_id
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

-- Se il problema persiste dopo aver creato le policies, potrebbe essere necessario:
-- - Verificare che le funzioni is_staff(), is_admin(), is_paziente() siano SECURITY DEFINER
-- - Verificare che current_paziente_id() restituisca l'ID del paziente (id), non auth_user_id
-- - Disabilitare temporaneamente RLS per test: ALTER TABLE prelievi DISABLE ROW LEVEL SECURITY;

