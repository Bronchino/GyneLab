# Specifica Formale: Stati e Transizioni Prelievo

**Versione:** 1.0  
**Data:** 2024-12-15  
**Autore:** Architettura Software  
**Contesto:** Gestionale prelievi ed esiti laboratorio

---

## 1. Definizione Stati

**Stati Disponibili (in ordine):**
1. Eseguito
2. Refertato
3. Notificato ⚠️ (definito ma non implementato - futuro)
4. Visionato
5. Scaricato

---

### 1.1. Eseguito

**Significato operativo:**
- Il prelievo biologico è stato materialmente eseguito presso il laboratorio o lo studio.
- Il campione è stato prelevato dal paziente.
- Nessun referto di laboratorio è ancora disponibile nel sistema.
- Il prelievo è stato registrato nel sistema ma non ha ancora prodotto risultati.

**Caratteristiche:**
- Stato iniziale obbligatorio per ogni nuovo prelievo.
- Lo stato viene impostato automaticamente alla creazione del prelievo.
- Il paziente non può ancora accedere a nessun referto associato.

**Campi rilevanti:**
- `data_prelievo`: data di esecuzione del prelievo
- `referto_pubblicato_at`: NULL (nessun referto disponibile)
- `esito_pdf_s3_key`: NULL

---

### 1.2. Refertato

**Significato operativo:**
- Il laboratorio ha completato l'analisi del campione.
- Il referto di laboratorio (PDF) è stato caricato nel sistema dallo staff medico.
- Il referto è tecnicamente disponibile ma il paziente non è ancora stato informato.
- Lo staff può visualizzare, modificare e gestire il referto.

**Caratteristiche:**
- Stato raggiunto automaticamente quando viene caricato un PDF referto.
- Il referto diventa visibile al paziente nell'area personale.
- Stato intermedio: può evolvere verso "Visionato" o "Scaricato".

**Campi rilevanti:**
- `esito_pdf_s3_key`: valorizzato (path nel bucket Storage)
- `esito_pdf_uploaded_at`: timestamp upload
- `esito_pdf_uploaded_by`: ID utente che ha caricato il referto
- `referto_pubblicato_at`: timestamp pubblicazione (impostato all'upload)
- `referto_scade_at`: calcolato (45 giorni dopo pubblicazione)

**Trigger automatico:**
- Quando viene completato l'upload di un PDF referto tramite `/api/upload-referto/[id]`

---

### 1.3. Notificato ⚠️ (Definito ma Non Implementato)

**Significato operativo:**
- Il paziente è stato informato della disponibilità del referto tramite notifica (email, SMS, etc.).
- Il sistema ha inviato una notifica al paziente informandolo che il referto è disponibile.
- Rappresenta l'invio della notifica, non la sua lettura da parte del paziente.
- Il paziente non ha ancora visualizzato il referto nel portale.

**Caratteristiche:**
- Stato intermedio tra "Refertato" e "Visionato".
- Raggiunto automaticamente quando viene inviata una notifica al paziente.
- Stato intermedio: può evolvere verso "Visionato" o direttamente "Scaricato".

**Campi rilevanti:**
- `referto_notificato_at`: timestamp invio notifica
- `referto_notifica_canale`: canale usato (email, SMS, etc.)
- `referto_notifica_esito`: esito notifica (inviata, fallita, etc.)
- Tabella `prelievi_notifiche`: log dettagliato delle notifiche

**Trigger automatico (FUTURO):**
- Quando viene inviata una notifica al paziente tramite sistema di notifiche (da implementare)

**Nota Implementazione:**
- ⚠️ **Questo stato è definito ma NON verrà implementato in questa fase.**
- Il sistema di notifiche verrà sviluppato successivamente.
- Per ora, si passa direttamente da "Refertato" a "Visionato" o "Scaricato".

---

### 1.4. Visionato

**Significato operativo:**
- Il paziente ha aperto/visualizzato il referto PDF nell'area personale del portale.
- Il paziente ha acceduto alla pagina di dettaglio del referto o ha aperto il PDF in anteprima.
- Indica che il paziente è a conoscenza della disponibilità del referto.

**Caratteristiche:**
- Stato raggiunto automaticamente quando il paziente accede alla visualizzazione del referto.
- Non è necessario che il paziente scarichi il file: basta l'apertura/visualizzazione.
- Stato intermedio: può evolvere verso "Scaricato".

**Campi rilevanti:**
- Nessun campo dedicato (stato deriva da log di accesso o da timestamp di visualizzazione)
- Si potrebbe tracciare con un campo `referto_visionato_at` (da implementare se necessario)

**Trigger automatico:**
- Quando il paziente accede a `/paziente/referti/prelievo/[id]` o visualizza il PDF
- Implementazione futura: endpoint API che registra la visualizzazione

---

### 1.5. Scaricato

**Significato operativo:**
- Il paziente ha effettuato il download effettivo del file PDF referto.
- Il file è stato scaricato sul dispositivo del paziente.
- Rappresenta la conferma definitiva che il paziente ha ottenuto il referto.

**Caratteristiche:**
- Stato terminale: rappresenta il completamento del ciclo di vita del referto.
- Non può evolvere verso altri stati (stato finale del workflow).
- Stato raggiunto automaticamente quando il paziente scarica il PDF.

**Campi rilevanti:**
- `referto_ultimo_download_at`: timestamp ultimo download
- Log in `referti_download_logs` (IP, user_agent, timestamp)

**Trigger automatico:**
- Quando il paziente accede a `/paziente/referti/prelievo/[id]/download`
- Log già presente nella route esistente

---

## 2. Transizioni Consentite

### 2.1. Regole Generali

1. **Progressione lineare**: Gli stati seguono un ordine sequenziale crescente (Eseguito → Refertato → Notificato ⚠️ → Visionato → Scaricato). Nota: "Notificato" è definito ma non implementato.
2. **Nessuna regressione automatica**: Lo stato non può mai regredire automaticamente a stati precedenti.
3. **Tracciabilità**: Ogni transizione deve essere auditabile (timestamp, user_id quando applicabile).
4. **Azione paziente non altera stati clinici**: Le azioni del paziente (visionare/scaricare) sono eventi di tracciamento, non modifiche cliniche.

### 2.2. Transizioni Forward (Progressione)

| Stato Attuale | Stato Successivo | Evento Scatenante | Tipo | Descrizione |
|---------------|------------------|-------------------|------|-------------|
| **Eseguito** | **Refertato** | Upload PDF referto da parte dello staff | Automatico (su azione manuale staff) | Quando staff/admin carica il PDF referto, lo stato passa automaticamente a "Refertato". Imposta `referto_pubblicato_at` e calcola `referto_scade_at`. |
| **Refertato** | **Notificato** ⚠️ | Invio notifica al paziente | Automatico (sistema notifiche) | Quando sistema invia notifica al paziente, lo stato passa a "Notificato". ⚠️ **NON IMPLEMENTATO** - per ora si salta questo stato. |
| **Refertato** | **Visionato** | Paziente accede/visualizza referto | Automatico (su azione paziente) | Quando paziente apre la pagina del referto o visualizza il PDF, lo stato passa a "Visionato". Se "Notificato" non è implementato, questa transizione può partire da "Refertato". |
| **Notificato** ⚠️ | **Visionato** | Paziente accede/visualizza referto | Automatico (su azione paziente) | Quando paziente apre la pagina del referto, lo stato passa da "Notificato" a "Visionato". ⚠️ **NON IMPLEMENTATO**. |
| **Refertato** | **Scaricato** | Paziente scarica PDF referto (skip Visionato) | Automatico (su azione paziente) | Se paziente scarica direttamente senza visionare prima, si può passare da "Refertato" direttamente a "Scaricato" (saltando "Visionato" e "Notificato" se non implementato). |
| **Notificato** ⚠️ | **Scaricato** | Paziente scarica PDF referto (skip Visionato) | Automatico (su azione paziente) | Se paziente scarica direttamente dopo notifica, si passa da "Notificato" a "Scaricato". ⚠️ **NON IMPLEMENTATO**. |
| **Visionato** | **Scaricato** | Paziente scarica PDF referto | Automatico (su azione paziente) | Quando paziente effettua il download del PDF, lo stato passa a "Scaricato". Stato terminale. |

### 2.3. Transizioni Backward (Regressione Manuale)

| Stato Attuale | Stato Precedente | Evento Scatenante | Tipo | Descrizione | Condizioni |
|---------------|------------------|-------------------|------|-------------|------------|
| **Refertato** | **Eseguito** | Staff rimuove/cancella referto PDF | Manuale (solo admin) | Se staff cancella il referto caricato (rimuove PDF e azzera campi referto), lo stato può regredire a "Eseguito". | Solo se `esito_pdf_s3_key` viene rimosso/nullato. Operazione rara, richiede audit trail. |
| **Notificato** ⚠️ | **Refertato** | N/A | Non consentita | Non ha senso logico regredire da "Notificato" a "Refertato". Una volta inviata la notifica, questa informazione non può essere annullata. ⚠️ **NON IMPLEMENTATO**. | - |
| **Visionato** | **Refertato/Notificato** | N/A | Non consentita | Non ha senso logico regredire da "Visionato" a stati precedenti. Una volta che il paziente ha visto il referto, questa informazione non può essere annullata. | - |
| **Scaricato** | Qualsiasi stato precedente | N/A | Non consentita | "Scaricato" è stato terminale. Non può regredere. | - |

**Nota sulla regressione:**
- Le regressioni sono ammesse SOLO in casi eccezionali e gestite manualmente dallo staff/admin.
- Richiedono audit trail completo (chi, quando, perché).
- La regressione da "Refertato" a "Eseguito" è consentita solo se il referto viene completamente rimosso (PDF cancellato, campi azzerati).

---

## 3. Transizioni Vietate e Motivazioni

### 3.1. Transizioni Vietate

| Da Stato | A Stato | Motivazione |
|----------|---------|-------------|
| **Eseguito** | **Visionato/Notificato/Scaricato** | Impossibile: non esiste referto da visionare/scaricare. |
| **Notificato** ⚠️ | **Eseguito** | Coerenza clinica: una volta inviata la notifica, non si può "dimenticare" questa informazione. ⚠️ **NON IMPLEMENTATO**. |
| **Visionato** | **Eseguito/Refertato/Notificato** | Coerenza clinica: una volta che il paziente ha visionato, non si può "dimenticare" questa informazione. |
| **Scaricato** | Qualsiasi stato | Stato terminale: rappresenta il completamento definitivo del workflow. Non può regredere. |
| **Refertato** | **Visionato/Notificato** (senza azione paziente/sistema) | Tracciabilità: "Visionato" richiede un'azione del paziente, "Notificato" richiede invio notifica. Non possono essere impostati automaticamente senza l'evento corrispondente. |

### 3.2. Principi di Coerenza

1. **Sequenzialità logica**: Gli stati devono seguire l'ordine naturale del processo clinico.
2. **Immutabilità delle azioni paziente**: Se il paziente ha visto o scaricato, questa informazione è permanente per audit e tracciabilità.
3. **Integrità referto**: Se un referto è stato pubblicato (`referto_pubblicato_at` non NULL), lo stato non può essere "Eseguito" (inconsistenza dati).

---

## 4. Stati Terminali e Evoluzione

### 4.1. Stato Terminale

**Scaricato** è l'unico stato terminale definitivo:
- Rappresenta il completamento completo del ciclo di vita del referto.
- Non può evolvere ulteriormente.
- Il paziente ha ottenuto il referto e il processo è concluso.

### 4.2. Stati Intermedi

- **Eseguito**: Stato iniziale, deve evolvere verso "Refertato".
- **Refertato**: Stato intermedio, può evolvere verso "Notificato" (futuro), "Visionato" o direttamente "Scaricato".
- **Notificato** ⚠️: Stato intermedio futuro, può evolvere verso "Visionato" o direttamente "Scaricato". **NON IMPLEMENTATO**.
- **Visionato**: Stato intermedio, può evolvere solo verso "Scaricato".

---

## 5. Tabella Riassuntiva Transizioni

### 5.1. Matrice delle Transizioni

| Da/Per | Eseguito | Refertato | Notificato ⚠️ | Visionato | Scaricato |
|--------|----------|-----------|---------------|-----------|-----------|
| **Eseguito** | - | ✅ Auto (upload referto) | ❌ Vietato | ❌ Vietato | ❌ Vietato |
| **Refertato** | ⚠️ Manuale (solo se referto rimosso) | - | ✅ Auto (notifica) ⚠️ | ✅ Auto (visione paziente) | ✅ Auto (download paziente) |
| **Notificato** ⚠️ | ❌ Vietato | ❌ Vietato | - | ✅ Auto (visione paziente) ⚠️ | ✅ Auto (download paziente) ⚠️ |
| **Visionato** | ❌ Vietato | ❌ Vietato | ❌ Vietato | - | ✅ Auto (download paziente) |
| **Scaricato** | ❌ Vietato | ❌ Vietato | ❌ Vietato | ❌ Vietato | - |

**Legenda:**
- ✅ = Transizione consentita
- ❌ = Transizione vietata
- ⚠️ = Transizione consentita solo in casi eccezionali (manual, audit trail)

### 5.2. Tabella Eventi e Transizioni

| Evento | Stato Iniziale | Stato Finale | Tipo | Chi | Audit Trail |
|--------|----------------|--------------|------|-----|-------------|
| Creazione prelievo | - | Eseguito | Automatico | Sistema | `created_at` |
| Upload PDF referto | Eseguito | Refertato | Automatico (su azione manuale) | Staff/Admin | `esito_pdf_uploaded_at`, `esito_pdf_uploaded_by`, `referto_pubblicato_at` |
| Invio notifica ⚠️ | Refertato | Notificato | Automatico (sistema notifiche) | Sistema | `referto_notificato_at`, `referto_notifica_canale`, `prelievi_notifiche` |
| Rimozione referto | Refertato | Eseguito | Manuale | Admin | Log separato (da implementare) |
| Visualizzazione referto (paziente) | Refertato/Notificato ⚠️ | Visionato | Automatico (su azione paziente) | Paziente | Campo `referto_visionato_at` (da implementare) |
| Download referto (paziente) | Refertato/Notificato ⚠️/Visionato | Scaricato | Automatico (su azione paziente) | Paziente | `referto_ultimo_download_at`, `referti_download_logs` |

---

## 6. Diagramma State Machine

```
                    [Eseguito]
                       |
                       | (Upload PDF referto da staff)
                       v
                   [Refertato]
                       |
        +--------------+--------------+--------------+
        |              |              |              |
        | (Invio       | (Visualizza  | (Download    |
        |  notifica)   |  referto)    |  diretto)    |
        |  ⚠️ FUTURO   |              |              |
        v              v              v              |
   [Notificato] ⚠️  [Visionato]  [Scaricato]        |
        |              |              |              |
        | (Visualizza) | (Download)   | (TERMINALE)  |
        |  ⚠️ FUTURO   |              |              |
        v              v              |              |
   [Visionato] ⚠️  [Scaricato] <------+              |
        |              |                             |
        | (Download)   | (TERMINALE)                 |
        |  ⚠️ FUTURO   |                             |
        v              |                             |
   [Scaricato] ⚠️ <-----+                             |
        |                                            |
        | (TERMINALE - nessuna transizione)          |
        +--------------------------------------------+

⚠️ = Stati/Transizioni definite ma NON IMPLEMENTATE (futuro)

Transizioni backward (solo manuali, casi eccezionali):
[Refertato] --(Rimuovi referto, solo admin)--> [Eseguito]
```

---

## 7. Implementazione Tecnica

### 7.1. Campi Database

**Tabella `prelievi`:**
- `stato_id` (FK → `stati_prelievo.id`): stato corrente del prelievo
- `esito_pdf_uploaded_at`: timestamp upload referto (trigger per → Refertato)
- `referto_pubblicato_at`: timestamp pubblicazione referto
- `referto_ultimo_download_at`: timestamp ultimo download (trigger per → Scaricato)
- `referto_visionato_at`: **DA IMPLEMENTARE** - timestamp visualizzazione (trigger per → Visionato)

### 7.2. Funzioni/Trigger da Implementare

1. **Trigger automatico "Refertato"**:
   - Quando `esito_pdf_s3_key` viene valorizzato E `referto_pubblicato_at` viene impostato
   - Aggiorna `stato_id` → stato "Refertato"

2. **Trigger automatico "Visionato"**:
   - Quando paziente accede a visualizzazione referto (endpoint API dedicato)
   - Se stato corrente è "Refertato", aggiorna a "Visionato"
   - Imposta `referto_visionato_at`

3. **Trigger automatico "Scaricato"**:
   - Quando paziente scarica referto (già presente in `/paziente/referti/prelievo/[id]/download`)
   - Se stato corrente è "Refertato" o "Visionato", aggiorna a "Scaricato"
   - Aggiorna `referto_ultimo_download_at`

### 7.3. API Endpoints Necessari

1. **POST `/api/upload-referto/[id]`** (già pianificato)
   - Upload PDF referto
   - Imposta stato → "Refertato"
   - Aggiorna campi referto

2. **POST `/api/prelievi/[id]/registra-visualizzazione`** (da implementare)
   - Registra visualizzazione referto da parte paziente
   - Imposta stato → "Visionato" (se corrente è "Refertato")
   - Imposta `referto_visionato_at`

3. **GET `/paziente/referti/prelievo/[id]/download`** (già presente)
   - Aggiorna stato → "Scaricato" (se corrente è "Refertato" o "Visionato")
   - Aggiorna `referto_ultimo_download_at`

4. **PUT `/api/prelievi/[id]/update-stato`** (da implementare)
   - Cambio stato manuale (solo admin/staff)
   - Con validazione transizioni consentite
   - Con audit trail

---

## 8. Stato "Notificato" - Definizione (Non Implementato)

### 8.1. Stato "Notificato" ⚠️

**Posizione nel workflow:** Dopo "Refertato", prima di "Visionato"

**Status:** ⚠️ **DEFINITO MA NON IMPLEMENTATO** - Verrà sviluppato quando il sistema di notifiche sarà implementato.

**Significato:**
- Il paziente è stato informato della disponibilità del referto (email, SMS, etc.)
- Rappresenta l'invio della notifica, non la sua lettura da parte del paziente.

**Transizioni con "Notificato":**
- Refertato → Notificato (automatico quando notifica inviata) ⚠️ NON IMPLEMENTATO
- Notificato → Visionato (automatico quando paziente visualizza) ⚠️ NON IMPLEMENTATO
- Notificato → Scaricato (se paziente scarica senza visionare) ⚠️ NON IMPLEMENTATO

**Campi Database Esistenti (già presenti):**
- Tabella `prelievi_notifiche` già presente nel database
- Campo `referto_notificato_at` già presente in `prelievi`
- Campo `referto_notifica_canale` già presente in `prelievi`
- Campo `referto_notifica_esito` già presente in `prelievi`

**Workflow Attuale (senza "Notificato"):**
- Per ora, si passa direttamente da "Refertato" a "Visionato" o "Scaricato"
- Quando il sistema di notifiche sarà implementato, si inserirà lo stato "Notificato" nel workflow

---

## 9. Miglioramenti Suggeriti (Opzionali)

### 9.1. Stato "Annullato" (Opzionale)

**Scopo:** Gestire prelievi annullati o non completati

**Caratteristiche:**
- Stato terminale alternativo
- Può essere raggiunto solo da "Eseguito" (prima che ci sia un referto)
- Non può evolvere verso altri stati
- Il referto non sarà mai disponibile

**Transizione:**
- Eseguito → Annullato (manuale, solo admin)

**Campo database:**
- `prelievo_annullato_at`: timestamp annullamento
- `prelievo_annullato_motivo`: motivo annullamento (opzionale)

**Valutazione:** Utile per audit e gestione casi eccezionali, ma non strettamente necessario per il workflow base.

---

## 10. Riepilogo Implementazione

### 10.1. Cosa Implementare Subito

1. ✅ **Upload referto PDF** → imposta stato "Refertato"
2. ✅ **Cambio stato manuale** → UI per staff/admin con validazione transizioni
3. ⚠️ **Registrazione visualizzazione** → endpoint per tracciare quando paziente visualizza referto
4. ✅ **Download referto** → aggiorna stato "Scaricato" (già presente, da completare)

**NOTA:** Lo stato "Notificato" è definito nella specifica ma **NON verrà implementato** in questa fase. Il sistema di notifiche verrà sviluppato successivamente. Per ora, il workflow salta lo stato "Notificato" e passa direttamente da "Refertato" a "Visionato" o "Scaricato".

### 10.2. Campi Database da Aggiungere

- `referto_visionato_at` (timestamp, nullable) → per tracciare visualizzazione

### 10.3. Validazione Transizioni

Creare funzione di validazione che controlla:
- Se la transizione richiesta è consentita (tabella transizioni)
- Se l'utente ha i permessi (staff/admin per manuale, paziente per automatiche)
- Se ci sono condizioni speciali (es. referto deve essere presente per "Refertato")

---

## 11. Audit Trail

Ogni transizione di stato deve essere tracciabile:

1. **Transizioni automatiche:**
   - Timestamp (campo stato-specifico: `referto_pubblicato_at`, `referto_visionato_at`, `referto_ultimo_download_at`)
   - User ID quando applicabile (`esito_pdf_uploaded_by`)

2. **Transizioni manuali:**
   - Timestamp
   - User ID (chi ha cambiato lo stato)
   - Motivo (opzionale, da valutare)
   - Tabella di log separata (opzionale, per audit avanzato)

3. **Stato corrente:**
   - Campo `stato_id` nella tabella `prelievi`
   - Aggiornato automaticamente alle transizioni

---

**Fine Specifica**

