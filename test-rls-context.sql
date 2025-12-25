-- Script per testare se le funzioni SECURITY DEFINER funzionano nel contesto RLS
-- Eseguire questo script nel database Supabase SQL Editor mentre si è loggati come admin

-- 1. Verifica se profili_utenti ha RLS abilitato
SELECT 
  schemaname,
  tablename,
  rowsecurity AS rls_enabled
FROM pg_tables
WHERE schemaname = 'public' 
  AND tablename = 'profili_utenti';

-- 2. Verifica le policy su profili_utenti
SELECT 
  policyname,
  cmd,
  permissive,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename = 'profili_utenti'
ORDER BY cmd, policyname;

-- 3. Test diretto delle funzioni (dovrebbero funzionare)
SELECT 
  is_admin() AS is_admin_result,
  is_staff() AS is_staff_result,
  auth.uid() AS current_user_id;

-- 4. Test se le funzioni possono leggere profili_utenti quando chiamate direttamente
-- (Questo dovrebbe funzionare perché le funzioni hanno SECURITY DEFINER)
SELECT 
  (SELECT COUNT(*) FROM profili_utenti WHERE id = auth.uid()) AS can_read_profili;

-- 5. IMPORTANTE: Verifica se is_staff() funziona quando chiamato in una policy
-- Proviamo a simulare una query con RLS attivo
-- Nota: Questo test potrebbe non essere perfetto, ma ci dà un'idea

-- 6. Verifica le policy sui prelievi in dettaglio
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

-- 7. Se is_staff() non funziona nel contesto RLS, possiamo provare a creare
-- una versione della funzione che bypassa esplicitamente RLS usando SECURITY DEFINER
-- e che forza il bypass della policy usando una query diretta

-- Nota: Le funzioni SECURITY DEFINER dovrebbero già bypassare RLS, ma potrebbe esserci
-- un problema se profili_utenti ha RLS e le policy non permettono la lettura anche
-- con SECURITY DEFINER.



