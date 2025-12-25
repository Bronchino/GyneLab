// Tipi basati sullo schema del database reale
// (da aggiornare con i tipi generati da Supabase se disponibili)

export type UserRole = 'admin' | 'segretaria' | 'paziente'

export interface ProfiloUtente {
  id: string
  nome: string
  cognome: string
  ruolo: UserRole
  attivo: boolean
  created_at?: string
  updated_at?: string
}

export interface Paziente {
  id: string
  nome: string
  cognome: string
  data_nascita: string | null
  luogo_nascita_codice: string | null
  luogo_nascita_comune: string | null
  luogo_nascita_provincia: string | null
  cellulare: string | null
  email: string | null
  codice_fiscale: string | null
  created_at: string | null
  updated_at: string | null
  auth_user_id: string | null
  sesso: string | null
  privacy_firmata: boolean
  privacy_firmata_il: string | null
  privacy_acquisita_da: string | null
  privacy_note: string | null
}

export interface Prelievo {
  id: string
  paziente_id: string
  laboratorio_id: string
  tipo_prelievo_id: string
  stato_id: string
  data_prelievo: string
  esito_pdf_url: string | null
  note: string | null
  created_at: string | null
  updated_at: string | null
  data_stimata_referto: string | null
  esito_pdf_s3_key: string | null
  esito_pdf_uploaded_at: string | null
  esito_pdf_uploaded_by: string | null
  esito_pdf_mime: string | null
  esito_pdf_size_bytes: number | null
  referto_pubblicato_at: string | null
  referto_scade_at: string | null
  referto_notificato_at: string | null
  referto_notifica_canale: string | null
  referto_notifica_esito: string | null
  referto_ultimo_download_at: string | null
}

export interface PazienteDocumento {
  id: string
  paziente_id: string
  titolo: string
  descrizione: string | null
  s3_key: string
  mime: string | null
  size_bytes: number | null
  uploaded_at: string
  uploaded_by: string | null
  pubblicato_at: string | null
  scade_at: string | null
  notificato_at: string | null
  notifica_canale: string | null
  notifica_esito: string | null
}

export interface RefertoDownloadLog {
  id: string
  prelievo_id: string
  user_id: string | null
  downloaded_at: string
  ip_address: string | null
  user_agent: string | null
  created_at: string
}

export interface Laboratorio {
  id: string
  nome: string
  indirizzo: string | null
  telefono: string | null
  email: string | null
  created_at: string | null
  updated_at: string | null
}

export interface StatoPrelievo {
  id: string
  nome: string
  ordine: number
  colore: string | null
  created_at: string | null
  updated_at: string | null
}

export interface TipoPrelievo {
  id: string
  nome: string
  descrizione: string | null
  attivo: boolean | null
  created_at: string | null
  updated_at: string | null
  tempo_refertazione_giorni: number | null
}

export interface PazienteMessaggio {
  id: string
  paziente_id: string
  testo: string
  created_at: string
  created_by: string | null
  letto_at: string | null
  letto_da: string | null
  pubblicato_at: string | null
  nascosto: boolean
}

export interface PrivacyTesto {
  id: string
  testo: string
  created_at: string
  updated_at: string
}

export interface StudioImpostazioni {
  id: string
  titolare_user_id: string
  studio_denominazione: string
  studio_indirizzo: string
  studio_cap: string | null
  studio_comune: string | null
  studio_provincia: string | null
  studio_telefono: string
  studio_email: string | null
  studio_pec: string | null
  studio_portale_referti_url: string | null
  titolare_cf: string | null
  titolare_piva: string | null
  titolare_qualifica: string | null
  created_at: string
  updated_at: string
}

