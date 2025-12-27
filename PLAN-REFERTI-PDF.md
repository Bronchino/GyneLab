---
name: Associazione Referti PDF Esami
overview: "Implementazione completa per associare referti PDF agli esami: upload manuale da parte del medico, salvataggio su Supabase Storage, generazione automatica credenziali pazienti, e visualizzazione nella area personale del paziente."
todos: []
---

# Implementazione Associazione Referti PDF agli Esami

## Obiettivi

1. Permettere al medico di caricare manualmente un PDF referto e associarlo a un esame

2. Salvare i PDF su Supabase Storage (bucket `referti`)

3. Generare automaticamente credenziali paziente alla creazione di una nuova anagrafica

4. Permettere al paziente di visualizzare e scaricare i propri referti nell'area personale

## Architettura

```mermaid
flowchart TD
    A[Medico carica PDF] --> B[API /api/upload-referto]
    B --> C[Supabase Storage bucket referti]
    C --> D[Aggiorna prelievi.esito_pdf_s3_key]
    D --> E[Imposta referto_pubblicato_at]
    
    F[Nuovo Paziente] --> G[API /api/create-paziente-auth]
    G --> H[Genera username da CF]
    G --> I[Genera password random]
    G --> J[Crea Supabase Auth User]
    J --> K[Aggiorna pazienti.auth_user_id]
    
    L[Paziente accede] --> M[Area Personale /paziente/referti]
    M --> N[Lista prelievi con referti]
    N --> O[Click Download]
    O --> P[API /api/download/referto]
    P --> Q[Genera Signed URL Supabase Storage]
    Q --> R[Redirect al PDF]
```

## File da Modificare/Creare

### 1. Generazione Credenziali Paziente

**File:** `app/api/create-paziente-auth/route.ts` (NUOVO)

- API route per creare credenziali quando viene creato un paziente

- Genera username dal codice fiscale (o fallback se mancante)

- Genera password random sicura

- Crea utente in Supabase Auth

- Aggiorna `pazienti.auth_user_id`

- Restituisce username e password allo staff

**File:** `app/admin/pazienti/nuovo/nuovo-paziente-form.tsx`

- Dopo creazione paziente, chiama API per generare credenziali

- Mostra modal/dialog con username e password generati

- Permette copia credenziali

**File:** `app/staff/pazienti/nuovo/nuovo-paziente-form.tsx`

- Stessa logica del form admin

### 2. Upload Referti PDF

**File:** `app/api/upload-referto/[id]/route.ts` (NUOVO)

- Endpoint POST per upload PDF

- Verifica permessi (solo staff/admin)
- Valida file (solo PDF, max size)

- Upload a Supabase Storage bucket `referti` con path: `{prelievo_id}/{timestamp}-{filename}`

- Aggiorna tabella `prelievi`:

- `esito_pdf_s3_key`: path nel bucket

- `esito_pdf_mime`: `application/pdf`

- `esito_pdf_size_bytes`: dimensione file

- `esito_pdf_uploaded_at`: timestamp

- `esito_pdf_uploaded_by`: user_id corrente

- `referto_pubblicato_at`: timestamp (pubblicazione immediata)

- `referto_scade_at`: calcolato (45 giorni dopo)

**File:** `app/admin/esami/[id]/page.tsx`

- Abilita bottone "Aggiungi Referto"

- Aggiunge componente upload PDF

**File:** `app/admin/esami/[id]/upload-referto-form.tsx` (NUOVO)

- Componente client-side per upload

- Input file con validazione

- Progress indicator durante upload

- Mostra errore/successo

- Refresh pagina dopo upload riuscito

### 3. Download Referti (Implementazione Completa)

**File:** `app/api/download/referto/[id]/route.ts`

- Rimuove stub, implementa download reale

- Usa `createAdminClient()` per service role

- Genera signed URL da Supabase Storage usando `esito_pdf_s3_key`

- URL valido per 1 ora

- Redirect al signed URL

**File:** `app/paziente/referti/prelievo/[id]/download/route.ts`

- Mantiene log download in `referti_download_logs`

- Redirect a `/api/download/referto/[id]` (già presente)

### 4. Configurazione Supabase Storage (DA FARE DOPO)

**Note:** Configurazione manuale rimandata:

- Creare bucket `referti` in Supabase Storage

- Impostare policy RLS per il bucket (da fare successivamente)

- Staff/admin: upload/read

- Pazienti: read solo propri referti (tramite signed URLs)

## Dettagli Implementazione

### Generazione Username/Password

- Username: `codice_fiscale` (uppercase) se presente, altrimenti `paziente_{id}`

- Password: 12 caratteri random (lettere + numeri)

- Email: usa `paziente.email` se presente, altrimenti `paziente_{id}@gynelab.local`

### Path Storage

- Formato: `referti/{prelievo_id}/{timestamp}-{original_filename}`

- Esempio: `referti/abc123/20241215-143022-referto.pdf`

### Validazione Upload

- Tipo file: solo `application/pdf`

- Dimensione max: 10MB

- Verifica che il prelievo esista e appartenga a un paziente valido

### RLS e Sicurezza (DA FARE DOPO)

- Upload: verifica permessi lato applicazione (requireAdmin/requireStaff)

- Download: pazienti vedono solo propri referti (già gestito da RLS su `prelievi`)

- Signed URLs: validità 1 ora, generati server-side

- **Nota:** Policy RLS per Supabase Storage bucket verranno configurate successivamente

## Dipendenze

- `@supabase/supabase-js` (già presente)

- Service Role Key configurata in `.env.local`

## Testing

1. Creare nuovo paziente → verificare generazione credenziali

2. Caricare PDF referto → verificare salvataggio in Storage

3. Accedere come paziente → verificare visualizzazione referti

4. Download referto → verificare signed URL funzionante

## Note Implementazione

- **RLS e Permessi Storage:** La configurazione delle policy RLS per il bucket Supabase Storage verrà fatta successivamente. Per ora l'implementazione si basa su:
- Verifica permessi lato applicazione (requireAdmin/requireStaff)
- Signed URLs generati server-side per i download
- RLS già presente sulla tabella `prelievi` per garantire che i pazienti vedano solo i propri esami


