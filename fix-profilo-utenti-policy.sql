-- Script per correggere le policy su profili_utenti per evitare dipendenze circolari
-- 
-- Il problema: la policy profili_utenti_select_staff_or_self usa is_staff(),
-- ma is_staff() cerca di leggere profili_utenti, creando un ciclo.
--
-- Soluzione: Modifichiamo la policy per permettere alle funzioni SECURITY DEFINER
-- di leggere profili_utenti senza dipendere da is_staff().

-- Prima, verifichiamo le policy attuali
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename = 'profili_utenti';

-- La policy attuale è:
-- profili_utenti_select_staff_or_self: (is_staff() OR (id = auth.uid()))
--
-- Questa crea un ciclo perché is_staff() cerca di leggere profili_utenti.
--
-- Soluzione: Dato che le funzioni SECURITY DEFINER dovrebbero già bypassare RLS,
-- il problema potrebbe essere che le funzioni non sono eseguite correttamente.
-- 
-- Ma un'altra soluzione è modificare la policy per permettere la lettura basandosi
-- solo su auth.uid() quando necessario, oppure rimuovere la dipendenza da is_staff()
-- per le query dirette.

-- Tuttavia, la policy attuale Dovrebbe funzionare perché is_staff() con SECURITY DEFINER
-- dovrebbe bypassare RLS. Se non funziona, potrebbe essere un problema di configurazione.

-- Verifica alternativa: forse il problema è che il function owner non ha i permessi
-- o che le funzioni non sono realmente SECURITY DEFINER nel database.

-- Prima di modificare le policy, verifichiamo se le funzioni funzionano quando chiamate
-- direttamente (non da una policy):
-- SELECT is_staff(); -- Dovrebbe funzionare

-- Se le funzioni funzionano quando chiamate direttamente ma non nelle policy,
-- il problema è che PostgreSQL applica ancora RLS quando le funzioni SECURITY DEFINER
-- vengono chiamate nel contesto di una policy.

-- Soluzione: Non possiamo facilmente modificare le policy perché is_staff() è necessario
-- per altre query. Invece, assicuriamoci che le funzioni SECURITY DEFINER funzionino
-- correttamente.

-- Verifica che le funzioni siano realmente SECURITY DEFINER:
SELECT 
  p.proname AS function_name,
  CASE WHEN p.prosecdef THEN 'YES' ELSE 'NO' END AS security_definer,
  pg_get_userbyid(p.proowner) AS function_owner
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname IN ('is_admin', 'is_staff', 'is_paziente');

-- Se le funzioni hanno SECURITY DEFINER ma il function_owner non è un superuser,
-- potrebbe essere necessario assicurarsi che il function_owner abbia i permessi
-- necessari sulla tabella profili_utenti.

-- Alternativa: Se il problema persiste, possiamo creare una policy specifica
-- che permette la lettura basandosi solo su auth.uid() per evitare la dipendenza circolare,
-- ma questo richiederebbe di modificare la logica delle policy.

-- Per ora, esegui fix-functions-no-circular-dependency.sql per assicurarti
-- che le funzioni siano definite correttamente come SECURITY DEFINER con plpgsql.



