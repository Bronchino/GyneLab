-- Script di debug per capire perché is_admin() e is_staff() restituiscono false
-- Eseguire questo script nel SQL Editor di Supabase mentre si è loggati come admin

-- 1. Verifica auth.uid() - deve restituire l'ID dell'utente loggato
SELECT 
  'auth.uid()' AS check_name,
  auth.uid() AS result;

-- 2. Verifica se il profilo esiste direttamente (senza RLS, come superuser)
-- Nota: questo potrebbe non funzionare se non sei superuser, ma proviamo
SELECT 
  'Direct profilo_utenti query' AS check_name,
  COUNT(*) AS count,
  string_agg(id::text, ', ') AS ids_found
FROM profili_utenti
WHERE id = auth.uid();

-- 3. Verifica il profilo con tutti i campi
SELECT 
  'Profilo completo' AS check_name,
  id,
  nome,
  cognome,
  ruolo,
  attivo,
  created_at
FROM profili_utenti
WHERE id = auth.uid();

-- 4. Test delle funzioni direttamente
SELECT 
  'is_admin()' AS function_name,
  is_admin() AS result;

SELECT 
  'is_staff()' AS function_name,
  is_staff() AS result;

SELECT 
  'is_paziente()' AS function_name,
  is_paziente() AS result;

-- 5. Test manuale della query che dovrebbe essere dentro is_staff()
SELECT 
  'Manual is_staff query' AS check_name,
  EXISTS (
    SELECT 1
    FROM profili_utenti
    WHERE id = auth.uid()
      AND attivo = true
      AND ruolo IN ('admin', 'segretaria')
  ) AS result;

-- 6. Verifica ogni condizione separatamente
SELECT 
  'Check id match' AS check_name,
  EXISTS (SELECT 1 FROM profili_utenti WHERE id = auth.uid()) AS id_exists;

SELECT 
  'Check attivo = true' AS check_name,
  EXISTS (SELECT 1 FROM profili_utenti WHERE id = auth.uid() AND attivo = true) AS is_active;

SELECT 
  'Check ruolo admin' AS check_name,
  EXISTS (SELECT 1 FROM profili_utenti WHERE id = auth.uid() AND ruolo = 'admin') AS is_admin_role;

SELECT 
  'Check ruolo in (admin, segretaria)' AS check_name,
  EXISTS (SELECT 1 FROM profili_utenti WHERE id = auth.uid() AND ruolo IN ('admin', 'segretaria')) AS is_staff_role;

-- 7. Se nessuna query sopra funziona, il problema potrebbe essere che
-- il profilo non esiste o auth.uid() non restituisce il valore corretto.
-- Verifica se ci sono profili utenti nella tabella:
SELECT 
  'All profili_utenti (first 10)' AS check_name,
  COUNT(*) AS total_count
FROM profili_utenti;

-- 8. Verifica se il problema è con RLS - prova a disabilitare temporaneamente RLS
-- (Non eseguire questo in produzione, solo per test)
-- ALTER TABLE profili_utenti DISABLE ROW LEVEL SECURITY;
-- SELECT is_staff();
-- ALTER TABLE profili_utenti ENABLE ROW LEVEL SECURITY;



