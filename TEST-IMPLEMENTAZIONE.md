# Test Implementazione: Upload Referti e Gestione Stati

## Checklist Testing

### 1. Upload Referti PDF ✅

**File:** `app/api/upload-referto/[id]/route.ts`

- [ ] Verifica permessi (solo staff/admin)
- [ ] Validazione file PDF (solo PDF, max 10MB)
- [ ] Upload a Supabase Storage bucket `referti`
- [ ] Eliminazione vecchio file se esiste già un referto
- [ ] Aggiornamento tabella `prelievi` con tutti i campi:
  - `esito_pdf_s3_key`
  - `esito_pdf_mime`: `application/pdf`
  - `esito_pdf_size_bytes`
  - `esito_pdf_uploaded_at`
  - `esito_pdf_uploaded_by`
  - `referto_pubblicato_at`
  - `referto_scade_at` (45 giorni dopo)
- [ ] Cambio automatico stato → "Refertato"

**Test Manuale:**
1. Vai a `/admin/esami/[id]` per un prelievo esistente
2. Clicca "+ Aggiungi Referto"
3. Seleziona un file PDF (max 10MB)
4. Verifica che il file venga caricato
5. Verifica che lo stato del prelievo cambi a "Refertato"
6. Verifica che i campi referto siano aggiornati nel database

### 2. Componente Upload Form ✅

**File:** `app/admin/esami/[id]/upload-referto-form.tsx`

- [ ] Validazione client-side file PDF
- [ ] Validazione dimensione file (10MB)
- [ ] Progress indicator durante upload
- [ ] Messaggio di errore se upload fallisce
- [ ] Messaggio di successo se upload riuscito
- [ ] Refresh pagina dopo upload riuscito
- [ ] Reset form dopo upload

**Test Manuale:**
1. Prova a caricare file non PDF → deve mostrare errore
2. Prova a caricare file > 10MB → deve mostrare errore
3. Carica file PDF valido → deve mostrare progress e successo

### 3. Download Referti ✅

**File:** `app/api/download/referto/[id]/route.ts`

- [ ] Verifica che il prelievo esista
- [ ] Verifica che ci sia un referto caricato (`esito_pdf_s3_key`)
- [ ] Verifica scadenza referto
- [ ] Generazione signed URL con `createAdminClient()`
- [ ] Signed URL valido per 1 ora
- [ ] Redirect al signed URL
- [ ] Cambio automatico stato → "Scaricato" (se corrente è "Refertato" o "Visionato")
- [ ] Aggiornamento `referto_ultimo_download_at`

**Test Manuale:**
1. Come paziente, vai a `/paziente/referti`
2. Clicca "Scarica" su un referto disponibile
3. Verifica che il PDF si apra/scarichi
4. Verifica che lo stato del prelievo cambi a "Scaricato"
5. Verifica che `referto_ultimo_download_at` sia aggiornato

### 4. Gestione Stati Prelievo ✅

**File:** `app/api/prelievi/[id]/update-stato/route.ts`

- [ ] Verifica permessi (solo staff/admin)
- [ ] Validazione transizioni consentite
- [ ] Verifica che lo stato corrente esista
- [ ] Verifica che il nuovo stato esista
- [ ] Blocca transizioni non consentite con messaggio di errore
- [ ] Aggiornamento stato se transizione valida
- [ ] Audit trail (timestamp `updated_at`)

**File:** `app/admin/esami/[id]/cambio-stato-prelievo.tsx`

- [ ] Dropdown mostra solo stati raggiungibili
- [ ] Dropdown include stato corrente
- [ ] Cambio stato funziona correttamente
- [ ] Messaggio di errore se cambio fallisce
- [ ] Loading state durante cambio
- [ ] Refresh pagina dopo cambio riuscito

**File:** `lib/utils/validate-stato-transition.ts`

- [ ] Funzione `isValidStatoTransition()` valida correttamente
- [ ] Funzione `getAvailableNextStates()` restituisce stati corretti
- [ ] Transizioni consentite secondo specifica
- [ ] Transizioni vietate bloccate correttamente

**Test Manuale:**
1. Vai a `/admin/esami/[id]`
2. Prova a cambiare stato a uno stato non raggiungibile → deve mostrare errore
3. Prova a cambiare stato a uno stato raggiungibile → deve funzionare
4. Verifica che il dropdown mostri solo stati validi

### 5. Registrazione Visualizzazione ✅

**File:** `app/api/prelievi/[id]/registra-visualizzazione/route.ts`

- [ ] Verifica permessi (solo paziente)
- [ ] Verifica che il prelievo appartenga al paziente
- [ ] Verifica che il referto sia pubblicato e non scaduto
- [ ] Idempotente (non fallisce se già visualizzato)
- [ ] Cambio automatico stato → "Visionato" (se corrente è "Refertato")
- [ ] Aggiornamento `referto_visionato_at`

**Nota:** Questo endpoint è implementato ma non ancora integrato nella UI paziente.
Per testarlo, chiamarlo manualmente via API o integrarlo nella pagina referti paziente.

### 6. Database ✅

**Migration:** `migrations/add-referto-visionato-at.sql`

- [x] Campo `referto_visionato_at` aggiunto alla tabella `prelievi`
- [ ] Verificare che il campo sia nullable
- [ ] Verificare che il campo sia di tipo `timestamp with time zone`

### 7. Integrazione UI ✅

**File:** `app/admin/esami/[id]/page.tsx`

- [ ] Bottone "Aggiungi Referto" presente e funzionante
- [ ] Componente upload form integrato
- [ ] Componente cambio stato integrato nella sezione "Dettagli Esame"
- [ ] Stati disponibili caricati correttamente
- [ ] Stato corrente mostrato correttamente

## Test Scenario Completo

### Scenario 1: Upload e Download Referto

1. **Staff carica referto:**
   - Vai a `/admin/esami/[ID]`
   - Clicca "+ Aggiungi Referto"
   - Seleziona file PDF
   - Carica
   - ✅ Verifica: stato prelievo → "Refertato"
   - ✅ Verifica: campi referto aggiornati

2. **Paziente scarica referto:**
   - Login come paziente
   - Vai a `/paziente/referti`
   - Clicca "Scarica" sul referto
   - ✅ Verifica: PDF si apre/scarica
   - ✅ Verifica: stato prelievo → "Scaricato"

### Scenario 2: Cambio Stato Manuale

1. **Admin cambia stato:**
   - Vai a `/admin/esami/[ID]`
   - Cambia stato nel dropdown
   - ✅ Verifica: stato aggiornato correttamente
   - ✅ Verifica: solo transizioni consentite permesse

2. **Tentativo transizione vietata:**
   - Prova a cambiare da "Scaricato" a "Eseguito"
   - ✅ Verifica: errore mostrato
   - ✅ Verifica: stato non cambia

### Scenario 3: Sostituzione Referto

1. **Staff sostituisce referto esistente:**
   - Prelievo con referto già caricato
   - Clicca "Sostituisci Referto"
   - Carica nuovo PDF
   - ✅ Verifica: vecchio file eliminato
   - ✅ Verifica: nuovo file caricato
   - ✅ Verifica: campi aggiornati con nuovo file

## Note Implementazione

- ✅ Tutti i file sono stati creati/modificati
- ✅ Migration database eseguita
- ✅ Nessun errore di linting
- ⚠️ Bucket `referti` deve essere creato in Supabase Storage
- ⚠️ `SUPABASE_SERVICE_ROLE_KEY` deve essere configurata
- ⚠️ Endpoint registrazione visualizzazione non ancora integrato in UI paziente (opzionale per ora)

## Stato Implementazione

✅ **Completato:**
- Upload referti PDF
- Download referti con signed URLs
- Gestione stati prelievo (manuale)
- Validazione transizioni stato
- UI cambio stato (pagina dettaglio esame)

⚠️ **Opzionale/Prossimi Passi:**
- Integrare endpoint registrazione visualizzazione in UI paziente
- Aggiungere UI cambio stato in pagina elenco esami
- Configurare policy RLS Storage (priorità bassa)

