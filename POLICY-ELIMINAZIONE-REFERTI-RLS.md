# Policy RLS per Eliminazione Referti Paziente

**⚠️ NOTA IMPORTANTE:** Queste policy RLS verranno implementate **DOPO** l'implementazione base dell'eliminazione referti. L'implementazione base funziona senza queste policy grazie alla verifica dei permessi lato server tramite `requirePaziente()` e `current_paziente_id()`.

---

## Policy da Implementare

### Tabella `prelievi` - Policy DELETE per Pazienti

Questa policy permette ai pazienti di eliminare i propri referti pubblicati.

```sql
-- Policy per permettere ai pazienti di eliminare i propri prelievi
-- Solo se hanno referto pubblicato (per sicurezza)
CREATE POLICY prelievi_delete_patient_own ON public.prelievi
  FOR DELETE
  TO authenticated
  USING (
    is_paziente() 
    AND paziente_id = current_paziente_id()
    AND referto_pubblicato_at IS NOT NULL
  );
```

**Note:**
- La policy esistente `prelievi_delete_staff` rimane per staff/admin
- I pazienti possono eliminare solo i propri prelievi con referto pubblicato
- Non possono eliminare prelievi senza referto o referti di altri pazienti
- La verifica `referto_pubblicato_at IS NOT NULL` garantisce che solo referti pubblicati possano essere eliminati

---

## Verifica Funzioni Necessarie

Prima di implementare la policy, verificare che queste funzioni esistano e funzionino correttamente:

```sql
-- Verifica che is_paziente() esista e funzioni
SELECT is_paziente();

-- Verifica che current_paziente_id() restituisca l'ID corretto
SELECT current_paziente_id();
```

---

## Checklist Implementazione (Futura)

- [ ] Verificare che le funzioni `is_paziente()` e `current_paziente_id()` esistano e funzionino
- [ ] Eseguire la query CREATE POLICY su Supabase SQL Editor
- [ ] Testare eliminazione referto come paziente (solo propri, pubblicati)
- [ ] Verificare che pazienti non possano eliminare referti di altri pazienti
- [ ] Verificare che pazienti non possano eliminare prelievi senza referto
- [ ] Verificare che staff/admin possano ancora eliminare prelievi (policy `prelievi_delete_staff`)

---

## Comportamento Attuale (Senza Policy RLS)

Attualmente, l'eliminazione referti è gestita lato server tramite:

1. **Verifica autenticazione**: `requirePaziente()` garantisce che l'utente sia un paziente
2. **Verifica proprietà**: Controllo che `prelievo.paziente_id = current_paziente_id()`
3. **Verifica referto pubblicato**: Controllo che `referto_pubblicato_at IS NOT NULL`
4. **Eliminazione file Storage**: Rimozione file da Supabase Storage (se presente)
5. **Aggiornamento record**: Rimozione campi referto dal record `prelievi` (non eliminazione del prelievo)

Questa implementazione è sicura e funziona correttamente. Le policy RLS aggiungono un livello di sicurezza aggiuntivo a livello database.

---

**Data creazione:** 2024-12-15  
**Ultimo aggiornamento:** 2024-12-15

