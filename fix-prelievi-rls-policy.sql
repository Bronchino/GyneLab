-- Script per verificare e correggere le policy RLS sui prelievi
-- Eseguire questo script nel database Supabase SQL Editor

-- Prima, verifichiamo lo stato attuale delle policy
SELECT 
  policyname,
  cmd,
  permissive,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename = 'prelievi'
ORDER BY cmd, policyname;

-- Se is_staff() non funziona correttamente nelle policy RLS,
-- possiamo creare una policy esplicita per admin
-- (Nota: admin dovrebbe essere coperto da is_staff(), ma aggiungiamo per sicurezza)

-- Opzione 1: Creare una policy esplicita per admin (se non esiste già)
-- DROP POLICY IF EXISTS prelievi_select_admin ON prelievi;
-- CREATE POLICY prelievi_select_admin ON prelievi
--   FOR SELECT
--   TO authenticated
--   USING (is_admin());

-- In realtà, is_staff() dovrebbe già coprire admin perché admin è incluso in ('admin', 'segretaria')
-- Quindi il problema potrebbe essere che is_staff() non funziona quando viene chiamato dalle policy.

-- Verifichiamo se le funzioni funzionano direttamente:
SELECT 
  'is_admin' AS function_name,
  is_admin() AS result
UNION ALL
SELECT 
  'is_staff' AS function_name,
  is_staff() AS result;

-- Se le funzioni restituiscono true ma le policy non funzionano,
-- potrebbe essere un problema con il contesto di sicurezza.
-- Proviamo a ricreare la policy per essere sicuri che sia corretta:

-- Prima eliminiamo e ricreiamo la policy (se necessario)
-- DROP POLICY IF EXISTS prelievi_select_staff ON prelievi;
-- CREATE POLICY prelievi_select_staff ON prelievi
--   FOR SELECT
--   TO authenticated
--   USING (is_staff());

-- Nota: Non eseguire DROP/CREATE se non necessario, perché potrebbe causare downtime.
-- Usa questo script solo per diagnosticare il problema.



