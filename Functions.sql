proname,function_definition
calc_documento_scadenza,"CREATE OR REPLACE FUNCTION public.calc_documento_scadenza(pubblicato_at timestamp with time zone)
 RETURNS timestamp with time zone
 LANGUAGE sql
 STABLE
 SET search_path TO 'public', 'extensions'
AS $function$
  SELECT pubblicato_at + INTERVAL '45 days'
$function$
"
calc_referto_scadenza,"CREATE OR REPLACE FUNCTION public.calc_referto_scadenza(pubblicato_at timestamp with time zone)
 RETURNS timestamp with time zone
 LANGUAGE sql
 STABLE
 SET search_path TO 'public', 'extensions'
AS $function$
  SELECT pubblicato_at + INTERVAL '45 days'
$function$
"
calcola_data_stimata_referto,"CREATE OR REPLACE FUNCTION public.calcola_data_stimata_referto()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'extensions'
AS $function$
BEGIN
  IF NEW.data_prelievo IS NOT NULL AND NEW.tipo_prelievo_id IS NOT NULL THEN
    SELECT NEW.data_prelievo + COALESCE(tp.tempo_refertazione_giorni, 0) INTO NEW.data_stimata_referto
    FROM tipi_prelievo tp
    WHERE tp.id = NEW.tipo_prelievo_id;
  END IF;
  RETURN NEW;
END;
$function$
"
can_insert_download_log,"CREATE OR REPLACE FUNCTION public.can_insert_download_log(_prelievo_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE
 SET search_path TO 'public', 'extensions'
AS $function$
  SELECT
    (SELECT public.is_staff())
    OR EXISTS (
      SELECT 1
      FROM public.prelievi pr
      JOIN public.pazienti pa ON pa.id = pr.paziente_id
      WHERE pr.id = _prelievo_id
        AND pa.auth_user_id = (SELECT auth.uid())
        AND pr.referto_pubblicato_at IS NOT NULL
        AND (pr.referto_scade_at IS NULL OR pr.referto_scade_at > now())
    );
$function$
"
current_paziente_id,"CREATE OR REPLACE FUNCTION public.current_paziente_id()
 RETURNS uuid
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
  SELECT auth_user_id
  FROM public.pazienti
  WHERE auth_user_id = auth.uid()
  LIMIT 1;
$function$
"
enqueue_notifiche_prelievo_notificato,"CREATE OR REPLACE FUNCTION public.enqueue_notifiche_prelievo_notificato()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
  v_notificato_id uuid;
  v_cognome text;
  v_email text;
  v_cellulare text;

  v_portal_url text := 'https://pazienti.rossiginecologo.it';
  v_portal_domain text := 'pazienti.rossiginecologo.it';

  v_oggetto_email text := 'Il suo referto è disponibile nell’Area Paziente';
  v_testo_email text;
  v_testo_sms text;
BEGIN
  -- trova id dello stato ""Notificato""
  SELECT id INTO v_notificato_id
  FROM public.stati_prelievo
  WHERE nome = 'Notificato'
  LIMIT 1;

  IF v_notificato_id IS NULL THEN
    RAISE EXCEPTION 'Stato ""Notificato"" non trovato in stati_prelievo';
  END IF;

  -- scatta solo quando si passa a Notificato
  IF NOT (OLD.stato_id IS DISTINCT FROM NEW.stato_id AND NEW.stato_id = v_notificato_id) THEN
    RETURN NEW;
  END IF;

  -- deve essere pubblicato (disponibile)
  IF NEW.referto_pubblicato_at IS NULL THEN
    RAISE EXCEPTION 'Impossibile notificare: referto_pubblicato_at è NULL per prelievo %', NEW.id;
  END IF;

  -- leggo destinatari
  SELECT p.cognome, NULLIF(btrim(p.email), ''), NULLIF(btrim(p.cellulare), '')
  INTO v_cognome, v_email, v_cellulare
  FROM public.pazienti p
  WHERE p.id = NEW.paziente_id;

  -- preparo testi
  v_testo_email :=
    'Gentile Sig.ra ' || COALESCE(v_cognome,'') || E',\n\n' ||
    'la informiamo che il referto relativo al suo esame è disponibile nell’Area Paziente.' || E'\n\n' ||
    'Per consultarlo in modo sicuro, acceda con le credenziali che le sono state consegnate al momento dell’esecuzione dell’esame:' || E'\n' ||
    v_portal_url || E'\n\n' ||
    'Qualora non fosse in possesso delle credenziali o riscontrasse difficoltà di accesso, può contattare lo studio per assistenza.' || E'\n\n' ||
    'Cordiali saluti' || E'\n' ||
    'Dr. Claudio Rossi';

  v_testo_sms :=
    'Studio Dr. Rossi: il referto è disponibile nell’Area Paziente. ' ||
    'Acceda con le credenziali consegnate al momento dell’esecuzione dell’esame: ' ||
    v_portal_domain;

  -- se non ho nessun contatto
  IF v_email IS NULL AND v_cellulare IS NULL THEN
    NEW.referto_notifica_esito := 'NO_RECIPIENTS';
    NEW.referto_notificato_at := COALESCE(NEW.referto_notificato_at, now());
    RETURN NEW;
  END IF;

  -- accodo EMAIL se ho email
  IF v_email IS NOT NULL THEN
    INSERT INTO public.prelievi_notifiche (prelievo_id, paziente_id, canale, destinatario, oggetto, testo)
    VALUES (NEW.id, NEW.paziente_id, 'EMAIL', v_email, v_oggetto_email, v_testo_email)
    ON CONFLICT (prelievo_id, canale) DO NOTHING;
  END IF;

  -- accodo SMS se ho cellulare
  IF v_cellulare IS NOT NULL THEN
    INSERT INTO public.prelievi_notifiche (prelievo_id, paziente_id, canale, destinatario, oggetto, testo)
    VALUES (NEW.id, NEW.paziente_id, 'SMS', v_cellulare, NULL, v_testo_sms)
    ON CONFLICT (prelievo_id, canale) DO NOTHING;
  END IF;

  NEW.referto_notifica_esito :=
    CASE
      WHEN v_email IS NOT NULL AND v_cellulare IS NOT NULL THEN 'ENQUEUED'
      WHEN v_email IS NOT NULL THEN 'ENQUEUED_EMAIL_ONLY'
      ELSE 'ENQUEUED_SMS_ONLY'
    END;

  NEW.referto_notificato_at := COALESCE(NEW.referto_notificato_at, now());
  RETURN NEW;
END;
$function$
"
get_schema_constraints,"CREATE OR REPLACE FUNCTION public.get_schema_constraints()
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
  result JSON;
BEGIN
  SELECT json_agg(
    json_build_object(
      'table_name', tc.table_name,
      'constraint_name', tc.constraint_name,
      'constraint_type', tc.constraint_type,
      'check_clause', cc.check_clause
    ) ORDER BY tc.table_name, tc.constraint_name
  )
  INTO result
  FROM information_schema.table_constraints tc
  LEFT JOIN information_schema.check_constraints cc 
    ON tc.constraint_name = cc.constraint_name
    AND tc.constraint_schema = cc.constraint_schema
  WHERE tc.table_schema = 'public'
    AND tc.constraint_type IN ('CHECK', 'UNIQUE');
  
  RETURN COALESCE(result, '[]'::json);
END;
$function$
"
get_schema_foreign_keys,"CREATE OR REPLACE FUNCTION public.get_schema_foreign_keys()
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
  result JSON;
BEGIN
  SELECT json_agg(
    json_build_object(
      'table_name', tc.table_name,
      'column_name', kcu.column_name,
      'foreign_table_name', ccu.table_name,
      'foreign_column_name', ccu.column_name,
      'constraint_name', tc.constraint_name
    ) ORDER BY tc.table_name, kcu.column_name
  )
  INTO result
  FROM information_schema.table_constraints AS tc
  JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
  JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
  WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public';
  
  RETURN COALESCE(result, '[]'::json);
END;
$function$
"
get_schema_functions,"CREATE OR REPLACE FUNCTION public.get_schema_functions()
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
  result JSON;
BEGIN
  SELECT json_agg(
    json_build_object(
      'function_name', p.proname,
      'return_type', pg_get_function_result(p.oid)::text,
      'language', l.lanname,
      'definition', pg_get_functiondef(p.oid)
    ) ORDER BY p.proname
  )
  INTO result
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  JOIN pg_language l ON p.prolang = l.oid
  WHERE n.nspname = 'public'
    AND p.prokind = 'f';
  
  RETURN COALESCE(result, '[]'::json);
END;
$function$
"
get_schema_indexes,"CREATE OR REPLACE FUNCTION public.get_schema_indexes()
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
  result JSON;
BEGIN
  WITH index_data AS (
    SELECT
      t.relname AS table_name,
      i.relname AS index_name,
      array_agg(a.attname ORDER BY array_position(ix.indkey, a.attnum)) AS columns,
      ix.indisunique AS is_unique
    FROM pg_class t
    JOIN pg_index ix ON t.oid = ix.indrelid
    JOIN pg_class i ON i.oid = ix.indexrelid
    JOIN unnest(ix.indkey) WITH ORDINALITY AS k(attnum, ord) ON true
    JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = k.attnum
    WHERE t.relkind = 'r'
      AND t.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
      AND i.relname NOT LIKE 'pg_%'
      AND a.attnum > 0
    GROUP BY t.relname, i.relname, ix.indisunique
  )
  SELECT json_agg(
    json_build_object(
      'table_name', table_name,
      'index_name', index_name,
      'columns', columns,
      'is_unique', is_unique
    ) ORDER BY table_name, index_name
  )
  INTO result
  FROM index_data;
  
  RETURN COALESCE(result, '[]'::json);
END;
$function$
"
get_schema_primary_keys,"CREATE OR REPLACE FUNCTION public.get_schema_primary_keys()
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
  result JSON;
BEGIN
  SELECT json_agg(
    json_build_object(
      'table_name', tc.table_name,
      'primary_key', ku.column_name
    ) ORDER BY tc.table_name
  )
  INTO result
  FROM information_schema.table_constraints tc
  JOIN information_schema.key_column_usage ku 
    ON tc.constraint_name = ku.constraint_name
    AND tc.table_schema = ku.table_schema
  WHERE tc.constraint_type = 'PRIMARY KEY'
    AND tc.table_schema = 'public';
  
  RETURN COALESCE(result, '[]'::json);
END;
$function$
"
get_schema_rls_policies,"CREATE OR REPLACE FUNCTION public.get_schema_rls_policies()
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
  result JSON;
BEGIN
  SELECT json_agg(
    json_build_object(
      'table_name', tablename,
      'policy_name', policyname,
      'permissive', permissive,
      'roles', roles,
      'cmd', cmd,
      'qual', qual,
      'with_check', with_check
    ) ORDER BY tablename, policyname
  )
  INTO result
  FROM pg_policies
  WHERE schemaname = 'public';
  
  RETURN COALESCE(result, '[]'::json);
END;
$function$
"
get_schema_rls_status,"CREATE OR REPLACE FUNCTION public.get_schema_rls_status()
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
  result JSON;
BEGIN
  SELECT json_agg(
    json_build_object(
      'table_name', tablename,
      'rls_enabled', rowsecurity
    ) ORDER BY tablename
  )
  INTO result
  FROM pg_tables
  WHERE schemaname = 'public';
  
  RETURN COALESCE(result, '[]'::json);
END;
$function$
"
get_schema_tables,"CREATE OR REPLACE FUNCTION public.get_schema_tables()
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
  result JSON;
BEGIN
  SELECT json_agg(
    json_build_object(
      'table_name', t.table_name,
      'columns', (
        SELECT json_agg(
          json_build_object(
            'column_name', c.column_name,
            'data_type', c.data_type,
            'character_maximum_length', c.character_maximum_length,
            'is_nullable', c.is_nullable = 'YES',
            'column_default', c.column_default,
            'is_primary_key', EXISTS (
              SELECT 1
              FROM information_schema.table_constraints tc
              JOIN information_schema.key_column_usage ku 
                ON tc.constraint_name = ku.constraint_name
                AND tc.table_schema = ku.table_schema
              WHERE tc.table_name = c.table_name
                AND tc.table_schema = c.table_schema
                AND tc.constraint_type = 'PRIMARY KEY'
                AND ku.column_name = c.column_name
            )
          ) ORDER BY c.ordinal_position
        )
        FROM information_schema.columns c
        WHERE c.table_schema = 'public'
          AND c.table_name = t.table_name
      )
    ) ORDER BY t.table_name
  )
  INTO result
  FROM information_schema.tables t
  WHERE t.table_schema = 'public'
    AND t.table_type = 'BASE TABLE';
  
  RETURN COALESCE(result, '[]'::json);
END;
$function$
"
get_schema_triggers,"CREATE OR REPLACE FUNCTION public.get_schema_triggers()
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
  result JSON;
BEGIN
  SELECT json_agg(
    json_build_object(
      'trigger_name', t.tgname,
      'table_name', c.relname,
      'function_name', p.proname
    ) ORDER BY c.relname, t.tgname
  )
  INTO result
  FROM pg_trigger t
  JOIN pg_class c ON t.tgrelid = c.oid
  JOIN pg_proc p ON t.tgfoid = p.oid
  JOIN pg_namespace n ON c.relnamespace = n.oid
  WHERE n.nspname = 'public'
    AND NOT t.tgisinternal;
  
  RETURN COALESCE(result, '[]'::json);
END;
$function$
"
is_admin,"CREATE OR REPLACE FUNCTION public.is_admin()
 RETURNS boolean
 LANGUAGE sql
 STABLE
 SET search_path TO 'public', 'extensions'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.profili_utenti p
    WHERE p.id = (SELECT auth.uid())
      AND p.attivo = true
      AND p.ruolo = 'admin'
  );
$function$
"
is_paziente,"CREATE OR REPLACE FUNCTION public.is_paziente()
 RETURNS boolean
 LANGUAGE sql
 STABLE
 SET search_path TO 'public', 'extensions'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.profili_utenti p
    WHERE p.id = (SELECT auth.uid())
      AND p.attivo = true
      AND p.ruolo = 'paziente'
  );
$function$
"
is_staff,"CREATE OR REPLACE FUNCTION public.is_staff()
 RETURNS boolean
 LANGUAGE sql
 STABLE
 SET search_path TO 'public', 'extensions'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.profili_utenti p
    WHERE p.id = (SELECT auth.uid())
      AND p.attivo = true
      AND p.ruolo IN ('admin', 'segretaria')
  );
$function$
"
parse_codice_fiscale,"CREATE OR REPLACE FUNCTION public.parse_codice_fiscale(p_cf text)
 RETURNS TABLE(birth_date date, sesso text, luogo_nascita_codice text)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
  cf text;
  yy int;
  mm_char char(1);
  mm int;
  dd_raw int;
  dd int;
  year_full int;
  current_yy int;
BEGIN
  IF p_cf IS NULL THEN
    RAISE EXCEPTION 'Codice fiscale NULL';
  END IF;

  -- normalizzazione (maiuscolo, niente spazi)
  cf := upper(regexp_replace(btrim(p_cf), '\s+', '', 'g'));

  IF length(cf) <> 16 THEN
    RAISE EXCEPTION 'Codice fiscale non valido: lunghezza % (atteso 16)', length(cf);
  END IF;

  -- Estrazioni standard:
  -- pos 7-8  = anno (2 cifre)
  -- pos 9    = mese (lettera)
  -- pos 10-11= giorno+sesso (01-31 M; 41-71 F)
  -- pos 12-15= codice catastale (4 caratteri)
  yy := substring(cf from 7 for 2)::int;
  mm_char := substring(cf from 9 for 1);
  dd_raw := substring(cf from 10 for 2)::int;
  luogo_nascita_codice := substring(cf from 12 for 4);

  -- Mese (tabella ufficiale CF)
  mm := CASE mm_char
    WHEN 'A' THEN 1
    WHEN 'B' THEN 2
    WHEN 'C' THEN 3
    WHEN 'D' THEN 4
    WHEN 'E' THEN 5
    WHEN 'H' THEN 6
    WHEN 'L' THEN 7
    WHEN 'M' THEN 8
    WHEN 'P' THEN 9
    WHEN 'R' THEN 10
    WHEN 'S' THEN 11
    WHEN 'T' THEN 12
    ELSE NULL
  END;

  IF mm IS NULL THEN
    RAISE EXCEPTION 'Codice fiscale non valido: lettera mese ""%"" sconosciuta', mm_char;
  END IF;

  -- Giorno + sesso
  IF dd_raw BETWEEN 1 AND 31 THEN
    sesso := 'M';
    dd := dd_raw;
  ELSIF dd_raw BETWEEN 41 AND 71 THEN
    sesso := 'F';
    dd := dd_raw - 40;
  ELSE
    RAISE EXCEPTION 'Codice fiscale non valido: giorno/sesso fuori range (%)', dd_raw;
  END IF;

  -- Anno a 4 cifre (regola deterministica)
  current_yy := (extract(year from current_date)::int % 100);

  IF yy > current_yy THEN
    year_full := 1900 + yy;
  ELSE
    year_full := 2000 + yy;
  END IF;

  -- costruzione data (se data impossibile -> Postgres alza errore)
  birth_date := make_date(year_full, mm, dd);

  RETURN NEXT;
END;
$function$
"
set_doc_scadenza_default,"CREATE OR REPLACE FUNCTION public.set_doc_scadenza_default()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'extensions'
AS $function$
begin
  if new.pubblicato_at is not null and new.scade_at is null then
    new.scade_at := public.calc_referto_scadenza(new.pubblicato_at); -- +45 giorni
  end if;
  return new;
end;
$function$
"
set_documento_scadenza_default,"CREATE OR REPLACE FUNCTION public.set_documento_scadenza_default()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'extensions'
AS $function$
BEGIN
  IF NEW.pubblicato_at IS NOT NULL AND NEW.scade_at IS NULL THEN
    NEW.scade_at := public.calc_documento_scadenza(NEW.pubblicato_at);
  END IF;
  RETURN NEW;
END;
$function$
"
set_referto_scadenza_default,"CREATE OR REPLACE FUNCTION public.set_referto_scadenza_default()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'extensions'
AS $function$
BEGIN
  IF NEW.referto_pubblicato_at IS NOT NULL AND NEW.referto_scade_at IS NULL THEN
    NEW.referto_scade_at := public.calc_referto_scadenza(NEW.referto_pubblicato_at);
  END IF;
  RETURN NEW;
END;
$function$
"
trg_pazienti_apply_cf,"CREATE OR REPLACE FUNCTION public.trg_pazienti_apply_cf()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
  v_birth_date date;
  v_sesso char(1);
  v_luogo_code text;  -- 4 caratteri: H501 o Z100 ecc.
BEGIN
  -- se CF nullo/non valido: non forzo (lascia gestire a livello applicativo)
  IF NEW.codice_fiscale IS NULL THEN
    RETURN NEW;
  END IF;

  -- parse_codice_fiscale deve restituire almeno: birth_date, sesso, luogo_nascita_codice
  SELECT p.birth_date, p.sesso, p.luogo_nascita_codice
    INTO v_birth_date, v_sesso, v_luogo_code
  FROM public.parse_codice_fiscale(NEW.codice_fiscale) p;

  NEW.data_nascita := v_birth_date;
  NEW.sesso := v_sesso;

  -- Estero: codice luogo = Z###
  IF v_luogo_code ~ '^Z[0-9]{3}$' THEN
    NEW.nato_estero := true;
    NEW.stato_nascita_codice := v_luogo_code;

    -- opzionale: valorizza nome stato
    SELECT s.nome_it INTO NEW.stato_nascita_nome
    FROM public.stati_esteri s
    WHERE s.codice = v_luogo_code;

    -- pulisco i campi ""Italia""
    NEW.luogo_nascita_codice := NULL;
    NEW.luogo_nascita_comune := NULL;
    NEW.luogo_nascita_provincia := NULL;

  ELSE
    -- Italia
    NEW.nato_estero := false;
    NEW.stato_nascita_codice := NULL;
    NEW.stato_nascita_nome := NULL;

    NEW.luogo_nascita_codice := v_luogo_code;

    -- valorizza comune/provincia da codici_catastali
    SELECT c.comune, c.provincia
      INTO NEW.luogo_nascita_comune, NEW.luogo_nascita_provincia
    FROM public.codici_catastali c
    WHERE c.codice = v_luogo_code;
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- se parse_codice_fiscale lancia eccezioni, qui decide lei se bloccare o no.
    -- Io scelgo di bloccare: evita dati incoerenti.
    RAISE;
END;
$function$
"
update_referto_ultimo_download,"CREATE OR REPLACE FUNCTION public.update_referto_ultimo_download()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'extensions'
AS $function$
BEGIN
  UPDATE public.prelievi
  SET referto_ultimo_download_at = NEW.downloaded_at
  WHERE id = NEW.prelievo_id;
  RETURN NEW;
END;
$function$
"