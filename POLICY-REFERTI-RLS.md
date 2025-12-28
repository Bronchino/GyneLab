# Policy RLS e Storage da Implementare - Referti PDF

**⚠️ NOTA IMPORTANTE:** Le policy Storage in questo documento verranno implementate **DOPO** l'implementazione base di upload/download referti. L'implementazione base funziona senza queste policy grazie a signed URLs generati server-side con service role.

---

## 1. Policy RLS Esistenti (Già Implementate) ✅

### Tabella `prelievi` - Già Corrette

Le seguenti policy sono già implementate e funzionanti:

```sql
-- SELECT: Staff può vedere tutti i prelievi
CREATE POLICY prelievi_select_staff ON public.prelievi
  FOR SELECT TO authenticated
  USING (is_staff());

-- SELECT: Pazienti vedono solo i propri prelievi
CREATE POLICY prelievi_select_self_patient ON public.prelievi
  FOR SELECT TO authenticated
  USING (is_paziente() AND paziente_id = current_paziente_id());

-- INSERT: Solo staff può inserire prelievi
CREATE POLICY prelievi_write_staff ON public.prelievi
  FOR INSERT TO authenticated
  WITH CHECK (is_staff());

-- UPDATE: Solo staff può aggiornare prelievi
CREATE POLICY prelievi_update_staff ON public.prelievi
  FOR UPDATE TO authenticated
  USING (is_staff())
  WITH CHECK (is_staff());

-- DELETE: Solo staff può eliminare prelievi
CREATE POLICY prelievi_delete_staff ON public.prelievi
  FOR DELETE TO authenticated
  USING (is_staff());
```

**Nota:** I pazienti vedono solo i propri prelievi tramite `current_paziente_id()`. Il controllo su referto pubblicato e non scaduto va fatto a livello applicativo o con una policy più restrittiva.

---

## 2. Policy Storage da Implementare (Bucket `referti`) ❌

### Bucket Storage: `referti`

**⚠️ PRIORITÀ BASSA - DA FARE DOPO:**
- Queste policy verranno implementate **DOPO** l'implementazione base di upload/download referti
- L'implementazione base funziona senza policy Storage (usa signed URLs con service role)
- Le policy Storage aggiungono un livello di sicurezza aggiuntivo ma non sono necessarie per il funzionamento base
- Possono essere aggiunte successivamente senza modificare il codice esistente

**IMPORTANTE:** Queste policy devono essere create dopo aver creato il bucket `referti` in Supabase Storage.

```sql
-- ============================================
-- POLICY STORAGE: BUCKET 'referti'
-- ============================================

-- 1. Policy INSERT: Solo staff/admin può caricare referti
CREATE POLICY "Staff può caricare referti"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'referti' 
  AND is_staff()
);

-- 2. Policy SELECT: Staff può leggere tutti i referti
CREATE POLICY "Staff può leggere tutti i referti"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'referti' 
  AND is_staff()
);

-- 3. Policy SELECT: Pazienti possono leggere solo i propri referti
-- (basato sul path che contiene il prelievo_id, che appartiene al paziente)
CREATE POLICY "Pazienti possono leggere propri referti"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'referti'
  AND is_paziente()
  AND EXISTS (
    SELECT 1
    FROM public.prelievi pr
    JOIN public.pazienti pa ON pa.id = pr.paziente_id
    WHERE pr.esito_pdf_s3_key = (storage.objects.name)
      AND pa.auth_user_id = auth.uid()
      AND pr.referto_pubblicato_at IS NOT NULL
      AND (pr.referto_scade_at IS NULL OR pr.referto_scade_at > now())
  )
);

-- 4. Policy UPDATE: Solo staff può aggiornare referti
CREATE POLICY "Staff può aggiornare referti"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'referti' 
  AND is_staff()
)
WITH CHECK (
  bucket_id = 'referti' 
  AND is_staff()
);

-- 5. Policy DELETE: Solo admin può eliminare referti
CREATE POLICY "Admin può eliminare referti"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'referti' 
  AND is_admin()
);
```

---

## 3. Policy RLS Aggiuntive (Opzionali, per Sicurezza Extra)

### Policy più restrittiva per pazienti (opzionale)

Se si vuole che i pazienti vedano solo prelievi con referto pubblicato e non scaduto anche a livello RLS:

```sql
-- Policy alternativa più restrittiva per pazienti
DROP POLICY IF EXISTS prelievi_select_self_patient ON public.prelievi;

CREATE POLICY prelievi_select_self_patient ON public.prelievi
  FOR SELECT
  TO authenticated
  USING (
    is_paziente() 
    AND paziente_id = current_paziente_id()
    AND referto_pubblicato_at IS NOT NULL
    AND (referto_scade_at IS NULL OR referto_scade_at > now())
  );
```

**Nota:** Questa policy limita i pazienti a vedere solo prelievi con referto pubblicato. Se serve vedere anche prelievi senza referto, mantenere la policy esistente e gestire il filtro a livello applicativo.

---

## 4. Configurazione Storage Bucket

Prima di creare le policy, creare il bucket:

```sql
-- Creare il bucket 'referti' in Supabase Storage
-- (Questo va fatto tramite Supabase Dashboard o API)

-- Configurazioni bucket:
-- - Nome: 'referti'
-- - Pubblico: NO (accesso solo tramite signed URLs o policy)
-- - File size limit: 10MB (configurabile)
-- - Allowed MIME types: application/pdf
```

---

## 5. Funzioni Helper Necessarie

Verificare che queste funzioni esistano e siano `SECURITY DEFINER`:

```sql
-- Verifica che is_staff() esista e funzioni
SELECT is_staff();

-- Verifica che is_admin() esista e funzioni  
SELECT is_admin();

-- Verifica che is_paziente() esista e funzioni
SELECT is_paziente();

-- Verifica che current_paziente_id() restituisca l'ID corretto
SELECT current_paziente_id();
```

---

## 6. Checklist Implementazione

- [ ] Creare bucket `referti` in Supabase Storage
- [ ] Configurare bucket (privato, size limit, MIME types)
- [ ] Creare policy INSERT per staff
- [ ] Creare policy SELECT per staff
- [ ] Creare policy SELECT per pazienti (con controllo referto pubblicato)
- [ ] Creare policy UPDATE per staff
- [ ] Creare policy DELETE per admin
- [ ] Testare upload referto come staff
- [ ] Testare download referto come paziente (solo propri, pubblicati, non scaduti)
- [ ] Verificare che signed URLs funzionino correttamente

---

## 7. Note Importanti

1. **Path Storage:** Il path nel bucket deve seguire il formato `{prelievo_id}/{timestamp}-{filename}` per facilitare i controlli nelle policy.

2. **Signed URLs:** Per i download, generare signed URLs server-side con validità 1 ora, bypassando le policy Storage.

3. **Service Role:** L'upload/download deve usare `createAdminClient()` con service role per bypassare RLS quando necessario.

4. **Validazione:** Validare a livello applicativo che:
   - Il file sia PDF
   - La dimensione sia ≤ 10MB
   - Il prelievo appartenga a un paziente valido

---

## 8. Struttura Database - Campi Referto

La tabella `prelievi` ha già tutti i campi necessari:

- `esito_pdf_s3_key` (text, nullable) - Chiave nel bucket Supabase Storage
- `esito_pdf_mime` (text, nullable) - Tipo MIME (es. `application/pdf`)
- `esito_pdf_size_bytes` (bigint, nullable) - Dimensione file
- `esito_pdf_uploaded_at` (timestamp, nullable) - Data/ora upload
- `esito_pdf_uploaded_by` (uuid, nullable) - ID utente che ha caricato
- `referto_pubblicato_at` (timestamp, nullable) - Quando è stato pubblicato
- `referto_scade_at` (timestamp, nullable) - Scadenza (45 giorni dopo pubblicazione)
- `referto_ultimo_download_at` (timestamp, nullable) - Ultimo download

---

**Data creazione:** 2024-12-15  
**Ultimo aggiornamento:** 2024-12-15

