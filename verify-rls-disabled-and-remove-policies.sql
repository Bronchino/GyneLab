-- Script per verificare che RLS sia disabilitato e rimuovere eventuali policies residue
-- Eseguire questo script nel database Supabase SQL Editor

-- 1. Verifica lo stato RLS su tutte le tabelle (dovrebbe essere false per tutte)
SELECT 
  'RLS Status Check' AS check_type,
  tablename,
  rowsecurity AS rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- 2. Verifica se ci sono ancora policies attive (non dovrebbero esserci se RLS è disabilitato)
SELECT 
  'Existing Policies' AS check_type,
  schemaname,
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 3. Disabilita RLS su tutte le tabelle (anche se già disabilitato, questo assicura che sia disabilitato)
DO $$
DECLARE
    r RECORD;
    disabled_count INTEGER := 0;
BEGIN
    FOR r IN 
        SELECT tablename
        FROM pg_tables
        WHERE schemaname = 'public'
    LOOP
        BEGIN
            EXECUTE format('ALTER TABLE %I DISABLE ROW LEVEL SECURITY', r.tablename);
            disabled_count := disabled_count + 1;
            RAISE NOTICE 'RLS disabilitato (o già disabilitato) su: %', r.tablename;
        EXCEPTION
            WHEN OTHERS THEN
                RAISE NOTICE 'Errore su %: %', r.tablename, SQLERRM;
        END;
    END LOOP;
    RAISE NOTICE 'Totale tabelle processate: %', disabled_count;
END $$;

-- 4. Rimuovi tutte le policies residue (anche se RLS è disabilitato, è meglio rimuoverle)
DO $$
DECLARE
    r RECORD;
    removed_count INTEGER := 0;
BEGIN
    FOR r IN 
        SELECT schemaname, tablename, policyname
        FROM pg_policies
        WHERE schemaname = 'public'
    LOOP
        BEGIN
            EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 
                r.policyname, r.schemaname, r.tablename);
            removed_count := removed_count + 1;
            RAISE NOTICE 'Policy rimossa: %.%.%', r.schemaname, r.tablename, r.policyname;
        EXCEPTION
            WHEN OTHERS THEN
                RAISE NOTICE 'Errore rimozione policy %.%.%: %', r.schemaname, r.tablename, r.policyname, SQLERRM;
        END;
    END LOOP;
    IF removed_count = 0 THEN
        RAISE NOTICE 'Nessuna policy trovata da rimuovere';
    ELSE
        RAISE NOTICE 'Totale policies rimosse: %', removed_count;
    END IF;
END $$;

-- 5. Verifica finale: RLS dovrebbe essere disabilitato
SELECT 
  'Final RLS Status' AS check_type,
  tablename,
  rowsecurity AS rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- 6. Verifica finale: non dovrebbero esserci policies
SELECT 
  'Final Policies Check' AS check_type,
  COUNT(*) AS remaining_policies
FROM pg_policies
WHERE schemaname = 'public';

-- 7. Test query diretta sulla tabella prelievi (dovrebbe funzionare ora)
SELECT 
  'Test Query' AS check_type,
  COUNT(*) AS prelievi_count
FROM prelievi;


