-- Script per creare/aggiornare il profilo admin
-- Sostituisci '55af82d3-fcfc-476b-a71b-aa11c87a0e4c' con l'UUID reale dell'utente se diverso

-- Verifica se esiste già un record
SELECT id, nome, cognome, ruolo, attivo 
FROM profili_utenti 
WHERE id = '55af82d3-fcfc-476b-a71b-aa11c87a0e4c';

-- Se non esiste, inserisci il record (sostituisci con i dati reali)
INSERT INTO profili_utenti (id, nome, cognome, ruolo, attivo)
VALUES (
  '55af82d3-fcfc-476b-a71b-aa11c87a0e4c',  -- UUID dell'utente autenticato
  'Claudio',                                -- Nome
  'Rossi',                                  -- Cognome
  'admin',                                  -- Ruolo
  true                                      -- Attivo
)
ON CONFLICT (id) DO UPDATE
SET 
  ruolo = 'admin',
  attivo = true,
  updated_at = now();

-- Verifica che il record sia stato creato correttamente
SELECT id, nome, cognome, ruolo, attivo 
FROM profili_utenti 
WHERE id = '55af82d3-fcfc-476b-a71b-aa11c87a0e4c';



