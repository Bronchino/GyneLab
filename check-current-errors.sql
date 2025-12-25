-- Script per diagnosticare problemi di accesso alle tabelle
-- Eseguire questo script mentre sei loggato come utente che vede gli errori

-- 1. Verifica lo stato RLS su tutte le tabelle
SELECT 
  'RLS Status' AS check_type,
  tablename,
  rowsecurity AS rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- 2. Verifica i permessi GRANT per il ruolo corrente
SELECT 
  'Permissions' AS check_type,
  schemaname||'.'||tablename AS full_table_name,
  has_table_privilege(current_user, schemaname||'.'||tablename, 'SELECT') AS can_select,
  has_table_privilege(current_user, schemaname||'.'||tablename, 'INSERT') AS can_insert,
  has_table_privilege(current_user, schemaname||'.'||tablename, 'UPDATE') AS can_update,
  has_table_privilege(current_user, schemaname||'.'||tablename, 'DELETE') AS can_delete
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- 3. Verifica i permessi per il ruolo 'authenticated' (usato da Supabase)
SELECT 
  'Authenticated Role Permissions' AS check_type,
  schemaname||'.'||tablename AS full_table_name,
  has_table_privilege('authenticated', schemaname||'.'||tablename, 'SELECT') AS can_select,
  has_table_privilege('authenticated', schemaname||'.'||tablename, 'INSERT') AS can_insert,
  has_table_privilege('authenticated', schemaname||'.'||tablename, 'UPDATE') AS can_update,
  has_table_privilege('authenticated', schemaname||'.'||tablename, 'DELETE') AS can_delete
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- 4. Verifica utente corrente e ruoli
SELECT 
  'Current User' AS check_type,
  current_user AS user_name,
  session_user AS session_user_name,
  current_database() AS database_name;

-- 5. Lista dei ruoli disponibili
SELECT 
  'Available Roles' AS check_type,
  rolname,
  rolsuper,
  rolcreaterole,
  rolcreatedb,
  rolcanlogin
FROM pg_roles
WHERE rolname IN ('authenticated', 'anon', 'service_role', current_user)
ORDER BY rolname;

-- 6. Prova query diretta sulla tabella prelievi (dovrebbe funzionare se tutto è configurato)
-- NOTA: Questa query potrebbe fallire se non hai i permessi, ma ci dirà l'errore esatto
SELECT 
  'Test Query' AS check_type,
  COUNT(*) AS prelievi_count
FROM prelievi;

