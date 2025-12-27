-- Migrazione: Rinomina campo note in commento nella tabella prelievi
-- Data: 2024
-- Descrizione: Rinomina la colonna 'note' in 'commento' per migliorare la chiarezza del nome del campo

ALTER TABLE prelievi RENAME COLUMN note TO commento;

