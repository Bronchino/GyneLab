-- Migrazione: Aggiungi campi separati per Rif. Interno, Descrizione e Report Medico nella tabella prelievi
-- Data: 2024
-- Descrizione: Aggiunge colonne separate per gestire rif_interno, descrizione e report_medico invece di combinarli nel campo commento

ALTER TABLE prelievi 
ADD COLUMN IF NOT EXISTS rif_interno TEXT,
ADD COLUMN IF NOT EXISTS descrizione TEXT,
ADD COLUMN IF NOT EXISTS report_medico TEXT;



