-- Script per disabilitare RLS su tutte le tabelle e verificare/correggere i permessi
-- Eseguire questo script nel database Supabase SQL Editor

-- 1. Verifica lo stato RLS su tutte le tabelle
SELECT 
  schemaname,
  tablename,
  rowsecurity AS rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- 2. Disabilita RLS su tutte le tabelle del schema public
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN 
        SELECT tablename
        FROM pg_tables
        WHERE schemaname = 'public'
    LOOP
        EXECUTE format('ALTER TABLE %I DISABLE ROW LEVEL SECURITY', r.tablename);
        RAISE NOTICE 'RLS disabilitato su: %', r.tablename;
    END LOOP;
END $$;

-- 3. Verifica che RLS sia stato disabilitato
SELECT 
  schemaname,
  tablename,
  rowsecurity AS rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- 4. Verifica i permessi GRANT sulle tabelle per il ruolo 'authenticated'
-- (Supabase usa il ruolo 'authenticated' per gli utenti loggati)
SELECT 
  schemaname,
  tablename,
  tableowner,
  hasselects,
  hasinserts,
  hasupdates,
  hasdeletes
FROM (
  SELECT 
    n.nspname AS schemaname,
    c.relname AS tablename,
    pg_get_userbyid(c.relowner) AS tableowner,
    has_table_privilege('authenticated', c.oid, 'SELECT') AS hasselects,
    has_table_privilege('authenticated', c.oid, 'INSERT') AS hasinserts,
    has_table_privilege('authenticated', c.oid, 'UPDATE') AS hasupdates,
    has_table_privilege('authenticated', c.oid, 'DELETE') AS hasdeletes
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public'
    AND c.relkind = 'r'  -- solo tabelle
) AS permissions
ORDER BY tablename;

-- 5. Concedi tutti i permessi necessari al ruolo 'authenticated' su tutte le tabelle
-- Questo è necessario perché anche con RLS disabilitato, servono i permessi GRANT
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN 
        SELECT tablename
        FROM pg_tables
        WHERE schemaname = 'public'
    LOOP
        -- Concedi SELECT, INSERT, UPDATE, DELETE
        EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE %I TO authenticated', r.tablename);
        RAISE NOTICE 'Permessi concessi su: %', r.tablename;
    END LOOP;
END $$;

-- 6. Verifica i permessi dopo il GRANT
SELECT 
  schemaname,
  tablename,
  has_table_privilege('authenticated', schemaname||'.'||tablename, 'SELECT') AS can_select,
  has_table_privilege('authenticated', schemaname||'.'||tablename, 'INSERT') AS can_insert,
  has_table_privilege('authenticated', schemaname||'.'||tablename, 'UPDATE') AS can_update,
  has_table_privilege('authenticated', schemaname||'.'||tablename, 'DELETE') AS can_delete
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- NOTA: In Supabase, potresti anche dover concedere permessi al ruolo 'anon'
-- se necessario. Per ora ci concentriamo su 'authenticated' che è usato per utenti loggati.
-- Se servono permessi anche per 'anon', decommentare:

-- DO $$
-- DECLARE
--     r RECORD;
-- BEGIN
--     FOR r IN 
--         SELECT tablename
--         FROM pg_tables
--         WHERE schemaname = 'public'
--     LOOP
--         EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE %I TO anon', r.tablename);
--     END LOOP;
-- END $$;


