-- Script per testare manualmente le policy RLS sui prelievi
-- Eseguire questo script nel database Supabase SQL Editor mentre si è loggati come admin

-- 1. Verifica che is_staff() funzioni
SELECT is_staff() AS is_staff_result;

-- 2. Verifica che is_admin() funzioni
SELECT is_admin() AS is_admin_result;

-- 3. Verifica che auth.uid() restituisca l'ID utente
SELECT auth.uid() AS current_user_id;

-- 4. Verifica il profilo utente
SELECT * FROM profili_utenti WHERE id = auth.uid();

-- 5. Prova a selezionare prelievi direttamente (dovrebbe funzionare se is_staff() = true)
SELECT COUNT(*) FROM prelievi;

-- 6. Verifica le policy RLS attive sulla tabella prelievi
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename = 'prelievi'
ORDER BY cmd, policyname;

-- 7. Verifica se RLS è abilitato sulla tabella
SELECT 
  schemaname,
  tablename,
  rowsecurity AS rls_enabled
FROM pg_tables
WHERE schemaname = 'public' 
  AND tablename = 'prelievi';



