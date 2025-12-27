-- Migration: Aggiunge campo referto_visionato_at alla tabella prelievi
-- Data: 2024-12-15
-- Descrizione: Campo per tracciare quando il paziente ha visualizzato il referto

ALTER TABLE public.prelievi
ADD COLUMN IF NOT EXISTS referto_visionato_at timestamp with time zone;

COMMENT ON COLUMN public.prelievi.referto_visionato_at IS 'Timestamp di quando il paziente ha visualizzato il referto nell''area personale. Usato per transizione automatica stato da Refertato a Visionato.';

