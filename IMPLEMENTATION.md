# Dettaglio Implementazione MVP

## ✅ Funzionalità Completate

### 1. Autenticazione e Ruoli

#### File implementati:
- `lib/auth/get-user-role.ts` - Utility per determinare ruolo utente
- `lib/auth/require-role.ts` - Guard per verificare permessi
- `lib/auth/get-current-user.ts` - Ottiene utente corrente
- `middleware.ts` - Middleware Next.js per protezione route

#### Funzionamento:
1. Login tramite Supabase Auth (`/login`)
2. Ruolo determinato dalla tabella `profili_utenti` (id = auth.uid())
3. Funzioni RPC usate: `is_admin()`, `is_staff()`, `is_paziente()`, `current_paziente_id()`
4. Redirect automatico in base al ruolo dopo login

### 2. Guard/Redirect

#### Implementazione:
- `requireRole()` - Verifica ruolo specifico, redirecta a `/unauthorized` se non autorizzato
- `requireAdmin()` - Solo admin
- `requireStaff()` - Admin o segretaria
- `requirePaziente()` - Solo paziente
- Middleware protegge tutte le route tranne `/login` e `/api/auth`

#### Pagine di gestione:
- `/unauthorized` - Pagina 403 per accesso negato
- Redirect a `/login` se non autenticato (con parametro `redirect` per tornare dopo login)

### 3. Pagina `/paziente/referti`

#### Funzionalità:
- **Lista Referti**: Prelevati da tabella `prelievi` con `referto_pubblicato_at IS NOT NULL`
- **Lista Documenti**: Prelevati da tabella `pazienti_documenti` con `pubblicato_at IS NOT NULL`
- **Filtri RLS**:
  - Solo prelievi del paziente corrente (`paziente_id = current_paziente_id()`)
  - Solo documenti pubblicati E non scaduti (`scade_at IS NULL OR scade_at > now()`)
- **Download**: 
  - Route `/paziente/referti/prelievo/[id]/download`
  - Route `/paziente/referti/documento/[id]/download`
  - Log automatico in `referti_download_logs` (RLS permette insert per paziente se referto valido)

#### File:
- `app/paziente/referti/page.tsx` - Server component principale
- `app/paziente/referti/referti-list.tsx` - Client component per visualizzazione
- `app/paziente/referti/prelievo/[id]/download/route.ts` - Download referto
- `app/paziente/referti/documento/[id]/download/route.ts` - Download documento
- `app/api/download/referto/[id]/route.ts` - STUB per signed URL S3
- `app/api/download/documento/[id]/route.ts` - STUB per signed URL S3

### 4. Pagina `/staff/pazienti`

#### Funzionalità CRUD:

##### CREATE (INSERT)
- **Route**: `/staff/pazienti/nuovo`
- **Permesso RLS**: Staff può INSERT (`is_staff()`)
- **Campi**: Tutti i campi della tabella `pazienti` (convalida lato client)
- **Trigger DB**: `trg_pazienti_apply_cf` parsa automaticamente codice fiscale

##### READ (SELECT)
- **Route**: `/staff/pazienti` - Lista tutti i pazienti
- **Route**: `/staff/pazienti/[id]` - Dettaglio singolo paziente
- **Permesso RLS**: Staff può SELECT tutti (`is_staff()`)
- **Ordinamento**: Per cognome, nome

##### UPDATE
- **Route**: `/staff/pazienti/[id]/edit`
- **Permesso RLS**: Staff può UPDATE (`is_staff()`)
- **Campi**: Tutti i campi modificabili (esclusi id, created_at)

##### DELETE
- **Route**: `/staff/pazienti/[id]/delete` (POST)
- **Permesso RLS**: **Solo admin** può DELETE (`is_admin()`)
- **UI**: Bottone "Elimina" visibile solo se `canDelete = true` (verifica `is_admin()`)

#### File:
- `app/staff/pazienti/page.tsx` - Lista pazienti
- `app/staff/pazienti/pazienti-list.tsx` - Client component tabella
- `app/staff/pazienti/nuovo/page.tsx` - Form nuovo paziente
- `app/staff/pazienti/nuovo/nuovo-paziente-form.tsx` - Form component
- `app/staff/pazienti/[id]/page.tsx` - Dettaglio paziente
- `app/staff/pazienti/[id]/edit/page.tsx` - Modifica paziente
- `app/staff/pazienti/[id]/edit/edit-paziente-form.tsx` - Form modifica
- `app/staff/pazienti/[id]/delete/route.ts` - DELETE route (solo admin)

## 🔒 RLS Compliance

Tutte le query rispettano le policy RLS del database:

### Pazienti
- ✅ SELECT: Staff vede tutti, paziente vede solo se stesso
- ✅ INSERT: Solo staff
- ✅ UPDATE: Solo staff
- ✅ DELETE: Solo admin

### Prelievi
- ✅ SELECT: Staff vede tutti, paziente vede solo propri
- ✅ INSERT/UPDATE/DELETE: Solo staff

### Documenti
- ✅ SELECT: Admin vede tutti, paziente vede solo pubblicati e non scaduti
- ✅ INSERT/UPDATE/DELETE: Solo admin

### Messaggi
- ✅ SELECT: Admin vede tutti, paziente vede solo pubblicati
- ✅ INSERT/UPDATE/DELETE: Solo admin

## 📝 Note Implementazione

### Download S3 (Stub)
Gli endpoint di download S3 sono stub perché richiedono:
1. Service Role Key (non anon key)
2. Configurazione Supabase Storage
3. Generazione signed URLs

Vedi commenti in `app/api/download/referto/[id]/route.ts` per dettagli implementazione.

### Codice Fiscale
Il parsing del codice fiscale è gestito automaticamente dal trigger `trg_pazienti_apply_cf` nel database che:
- Estrae data nascita, sesso, luogo nascita
- Popola automaticamente i campi derivati
- Gestisce nati in Italia vs estero

### Scadenze
- Documenti e referti scadono dopo 45 giorni dal `pubblicato_at`
- Calcolo automatico tramite funzioni `calc_documento_scadenza()` e `calc_referto_scadenza()`

## 🚀 Prossimi Passi (Non MVP)

1. Implementare signed URLs S3 per download
2. Aggiungere paginazione per liste lunghe
3. Aggiungere ricerca/filtri per pazienti
4. Gestione prelievi (lista, creazione, modifica)
5. Gestione documenti/messaggi per admin
6. Dashboard con statistiche



