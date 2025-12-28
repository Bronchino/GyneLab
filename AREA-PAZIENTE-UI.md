# Area Paziente - UI da Implementare

## Stato Attuale vs Design Target

### ✅ Cosa Esiste
- Layout base area paziente (`app/paziente/layout.tsx`)
- Pagina referti (`app/paziente/referti/page.tsx`)
- Componente lista referti (`app/paziente/referti/referti-list.tsx`)
- Login form (`app/login/login-form.tsx`)

### ❌ Cosa Manca/Modificare

---

## 1. Header - Layout Paziente

### Attuale:
- Testo semplice "Area Paziente"
- Pulsante "Logout"

### Target (dalle immagini):
- **Logo "GyneLab - Referti on line"**:
  - "GyneLab" in box nero con testo bianco
  - "- Referti on line" in box teal/turchese con testo bianco
- **Pulsanti header**:
  - "Info" (grigio, testo bianco)
  - "Disconnetti" (teal, testo bianco) - invece di "Logout"

**File da modificare:** `app/paziente/layout.tsx`

---

## 2. Saluto Personalizzato

### Attuale:
- Nessun saluto

### Target:
- **"Buongiorno, [Nome]!"** (es. "Buongiorno, Cka Rossi!")
- Mostrare nome del paziente (nome + cognome)

**File da modificare:** `app/paziente/referti/page.tsx` o `app/paziente/layout.tsx`

**Dati necessari:**
- Recuperare nome e cognome del paziente da `pazienti` usando `current_paziente_id()`

---

## 3. Sezione Referti - Tabella

### Attuale:
Colonne:
- Data Prelievo
- Pubblicato il
- Scade il
- Dimensione
- Azioni (solo Scarica)

### Target:
Colonne:
- **Esame** (nome tipo prelievo, es. "Pap test")
- **Data Esame** (data_prelievo) con freccia per ordinamento
- **Descrizione** (commento o descrizione)
- **Referto dal** (referto_pubblicato_at)
- **Stato** (badge verde "Refertato")

**Righe espandibili:**
- Icona chevron per espandere/contrarre
- Quando espansa mostra:
  - **Data Referto:** data referto
  - **Note:** note/commento
  - **Pulsanti:**
    - "Scarica" (teal, testo bianco)
    - "Elimina" (rosso, testo bianco)

**File da modificare:** `app/paziente/referti/referti-list.tsx`

**Dati necessari:**
- Join con `tipi_prelievo` per ottenere nome esame
- Gestione stato espanso/collassato per ogni riga
- Funzionalità eliminazione (se richiesta)

---

## 4. Pagina Login

### Attuale:
- Titolo: "Accesso Area Riservata"
- Input: "Username o Email" e "Password"
- Pulsante: "Accedi" (blu)

### Target (dalle immagini):
- **Logo "GyneLab - Referti on line"** (stesso stile dell'header)
- **Titolo:** "Benvenuto in GyneLab - Referti on line!"
- **Istruzioni:** "Accedi utilizzando le credenziali fornite dal tuo medico."
- **Input:**
  - "Username" (placeholder)
  - "Password" (placeholder) con icona occhio per mostrare/nascondere
- **Pulsante:** "ACCEDI" (teal, testo bianco, maiuscolo)

**File da modificare:** `app/login/page.tsx` e `app/login/login-form.tsx`

---

## 5. Stile e Colori

### Palette Colori Target:
- **Teal/Turchese:** `#14b8a6` o `#0d9488` (Tailwind: `teal-500` o `teal-600`)
- **Nero:** `#000000` (per logo GyneLab)
- **Bianco:** `#ffffff`
- **Grigio:** per testi secondari

### Componenti UI:
- Badge stato: verde per "Refertato"
- Pulsanti: teal per azioni principali, rosso per eliminazione
- Icone: chevron per espandere, occhio per password

---

## Checklist Implementazione

### Priorità Alta:
- [ ] Aggiungere logo "GyneLab - Referti on line" nell'header paziente
- [ ] Modificare pulsanti header (Info, Disconnetti)
- [ ] Aggiungere saluto personalizzato con nome paziente
- [ ] Ristrutturare tabella referti con colonne corrette
- [ ] Aggiungere join con `tipi_prelievo` per nome esame
- [ ] Implementare righe espandibili con dettagli
- [ ] Aggiungere badge "Refertato" verde
- [ ] Modificare pulsanti azioni (Scarica teal, Elimina rosso)

### Priorità Media:
- [ ] Aggiornare pagina login con logo e stile
- [ ] Aggiungere icona occhio per password
- [ ] Implementare ordinamento tabella (Data Esame)

### Priorità Bassa:
- [ ] Implementare funzionalità eliminazione referto (se richiesta)

---

## Note Tecniche

### Query Dati Necessarie:
```typescript
// Per ottenere nome esame, serve join con tipi_prelievo
const { data: prelievi } = await supabase
  .from('prelievi')
  .select(`
    *,
    tipo_prelievo:tipi_prelievo(nome)
  )
  .eq('paziente_id', currentPazienteId)
```

### Componenti UI da Creare:
- Logo component (riutilizzabile)
- Badge stato component
- Riga espandibile component
- Toggle password visibility

### Funzionalità Eliminazione:
- Verificare se i pazienti possono eliminare i propri referti
- Se sì, implementare endpoint DELETE
- Se no, rimuovere pulsante "Elimina"

---

**Data creazione:** 2024-12-15  
**Ultimo aggiornamento:** 2024-12-15

