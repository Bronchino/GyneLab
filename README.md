# Portal Pazienti - Next.js 14 + Supabase

Portale per gestione pazienti con autenticazione e ruoli (admin, segretaria, paziente).

## Setup

### 1. Installazione dipendenze

```bash
npm install
```

### 2. Configurazione Supabase

Crea un file `.env.local` nella root del progetto:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Opzionale: per signed URLs S3 (download referti/documenti)
# SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 3. Database

Il database deve avere lo schema definito nei file CSV/SQL nella cartella `/DB snapshot`. 

**Importante**: Le funzioni RPC devono essere disponibili:
- `is_admin()` - verifica se utente è admin
- `is_staff()` - verifica se utente è staff (admin o segretaria)
- `is_paziente()` - verifica se utente è paziente
- `current_paziente_id()` - restituisce l'ID del paziente corrente

### 4. Avvio sviluppo

```bash
npm run dev
```

Il server sarà disponibile su `http://localhost:3000`

## Struttura Routes

### Pubbliche
- `/login` - Login

### Protette per Ruolo

#### Admin (`/admin/*`)
- Accesso completo a tutte le funzionalità
- Può eliminare pazienti
- Gestisce laboratori, stati prelievo

#### Staff (`/staff/*`)
- Può gestire pazienti (CREATE, READ, UPDATE)
- Può gestire prelievi
- **NON può** eliminare pazienti (solo admin)
- **NON può** gestire documenti/messaggi (solo admin)

#### Paziente (`/paziente/*`)
- `/paziente/referti` - Lista referti e documenti disponibili (read-only)
- Può scaricare referti/documenti pubblicati e non scaduti

## Funzionalità Implementate (MVP)

### A) Autenticazione e Ruoli
- ✅ Login con Supabase Auth
- ✅ Determinazione ruolo tramite `profili_utenti` table
- ✅ Guard/redirect basati su ruolo
- ✅ Middleware per protezione route

### B) Pagine Paziente
- ✅ `/paziente/referti` - Lista referti e documenti disponibili
- ✅ Download referti (con log automatico in `referti_download_logs`)
- ✅ RLS: paziente vede solo documenti pubblicati e non scaduti

### C) Pagine Staff
- ✅ `/staff/pazienti` - Lista pazienti (SELECT tutti)
- ✅ `/staff/pazienti/nuovo` - Crea nuovo paziente (INSERT)
- ✅ `/staff/pazienti/[id]` - Dettaglio paziente
- ✅ `/staff/pazienti/[id]/edit` - Modifica paziente (UPDATE)
- ✅ `/staff/pazienti/[id]/delete` - Elimina paziente (solo admin, DELETE)

## RLS (Row Level Security)

Tutte le query rispettano le policy RLS del database:

- **pazienti**: staff può SELECT/INSERT/UPDATE, admin può DELETE
- **prelievi**: staff può tutto, paziente può SELECT solo propri prelievi
- **pazienti_documenti**: admin può tutto, paziente può SELECT solo documenti pubblicati e non scaduti
- **pazienti_messaggi**: admin può tutto, paziente può SELECT solo messaggi pubblicati

## Download File S3

Gli endpoint di download (`/api/download/referto/[id]` e `/api/download/documento/[id]`) sono stub.

Per implementarli correttamente serve:

1. Service Role Key in `.env.local`:
   ```env
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

2. Implementare la generazione signed URL:
   ```typescript
   const supabaseAdmin = createClient(
     process.env.NEXT_PUBLIC_SUPABASE_URL!,
     process.env.SUPABASE_SERVICE_ROLE_KEY!,
     { auth: { autoRefreshToken: false, persistSession: false } }
   )
   
   const { data } = await supabaseAdmin
     .storage
     .from('referti') // nome bucket
     .createSignedUrl(s3Key, 3600) // URL valido 1 ora
   ```

## Note Importanti

- **NON modificare** tabelle/campi che non esistono nello snapshot del database
- **Ogni query** deve essere compatibile con le policy RLS esistenti
- **Non creare UI** che permetta operazioni non consentite dalle RLS
- Il codice fiscale viene parsato automaticamente tramite trigger `trg_pazienti_apply_cf`
- I documenti e referti scadono dopo 45 giorni dal `pubblicato_at`

## Stack Tecnologico

- Next.js 14 (App Router)
- TypeScript
- Supabase (PostgreSQL + Auth)
- Tailwind CSS
- date-fns (formattazione date)



