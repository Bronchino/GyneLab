-- Script per eliminare tutte le RLS policies dal database
-- ATTENZIONE: Questo script eliminerà tutte le policy RLS su tutte le tabelle del schema public

-- Metodo 1: Eliminazione dinamica di tutte le policies
-- Questo comando genera e esegue DROP POLICY per ogni policy esistente
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN 
        SELECT schemaname, tablename, policyname
        FROM pg_policies
        WHERE schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 
            r.policyname, r.schemaname, r.tablename);
        RAISE NOTICE 'Eliminata policy: %.%.%', r.schemaname, r.tablename, r.policyname;
    END LOOP;
END $$;

-- Metodo 2: Eliminazione statica (se preferisci controllare manualmente)
-- Decommentare le righe seguenti e commentare il metodo 1 se vuoi usare questo approccio

-- DROP POLICY IF EXISTS codici_catastali_select_staff ON public.codici_catastali;
-- DROP POLICY IF EXISTS laboratori_all_admin ON public.laboratori;
-- DROP POLICY IF EXISTS pazienti_delete_admin ON public.pazienti;
-- DROP POLICY IF EXISTS pazienti_insert_staff ON public.pazienti;
-- DROP POLICY IF EXISTS pazienti_select_staff_or_self ON public.pazienti;
-- DROP POLICY IF EXISTS pazienti_update_staff ON public.pazienti;
-- DROP POLICY IF EXISTS pazienti_documenti_delete_admin ON public.pazienti_documenti;
-- DROP POLICY IF EXISTS pazienti_documenti_insert_admin ON public.pazienti_documenti;
-- DROP POLICY IF EXISTS pazienti_documenti_select_admin_or_patient_published ON public.pazienti_documenti;
-- DROP POLICY IF EXISTS pazienti_documenti_update_admin ON public.pazienti_documenti;
-- DROP POLICY IF EXISTS pazienti_messaggi_delete_admin ON public.pazienti_messaggi;
-- DROP POLICY IF EXISTS pazienti_messaggi_insert_admin ON public.pazienti_messaggi;
-- DROP POLICY IF EXISTS pazienti_messaggi_select_admin_or_patient_published ON public.pazienti_messaggi;
-- DROP POLICY IF EXISTS pazienti_messaggi_update_admin ON public.pazienti_messaggi;
-- DROP POLICY IF EXISTS prelievi_delete_staff ON public.prelievi;
-- DROP POLICY IF EXISTS prelievi_select_self_patient ON public.prelievi;
-- DROP POLICY IF EXISTS prelievi_select_staff ON public.prelievi;
-- DROP POLICY IF EXISTS prelievi_update_staff ON public.prelievi;
-- DROP POLICY IF EXISTS prelievi_write_staff ON public.prelievi;
-- DROP POLICY IF EXISTS profili_utenti_select_staff_or_self ON public.profili_utenti;
-- DROP POLICY IF EXISTS profili_utenti_update_staff ON public.profili_utenti;
-- DROP POLICY IF EXISTS referti_download_logs_delete_admin ON public.referti_download_logs;
-- DROP POLICY IF EXISTS referti_download_logs_insert_gate ON public.referti_download_logs;
-- DROP POLICY IF EXISTS referti_download_logs_select_admin ON public.referti_download_logs;
-- DROP POLICY IF EXISTS stati_prelievo_all_admin ON public.stati_prelievo;
-- DROP POLICY IF EXISTS tipi_prelievo_all_staff ON public.tipi_prelievo;

-- Verifica che tutte le policies siano state eliminate
SELECT 
    schemaname,
    tablename,
    policyname
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Se la query sopra non restituisce risultati, tutte le policies sono state eliminate con successo


