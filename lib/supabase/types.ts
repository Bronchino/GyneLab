// Tipi basati sui tipi generati automaticamente da Supabase
// Questo file usa i tipi da database.types.ts generati da 'npm run types:sync'
// Quando modifichi il database su Supabase, esegui 'npm run types:sync' per aggiornare i tipi

import { Database } from './database.types'

// Esporta il tipo Database per uso diretto
export type { Database }

// Tipo per i ruoli utente
export type UserRole = 'admin' | 'segretaria' | 'paziente'

// ============================================================================
// Alias dei tipi per compatibilità con il codice esistente
// Questi alias usano i tipi generati automaticamente dal database
// ============================================================================

// Profilo Utente
export type ProfiloUtente = Database['public']['Tables']['profili_utenti']['Row']

// Paziente
export type Paziente = Database['public']['Tables']['pazienti']['Row']
export type NewPaziente = Database['public']['Tables']['pazienti']['Insert']
export type UpdatePaziente = Database['public']['Tables']['pazienti']['Update']

// Prelievo
export type Prelievo = Database['public']['Tables']['prelievi']['Row']
export type NewPrelievo = Database['public']['Tables']['prelievi']['Insert']
export type UpdatePrelievo = Database['public']['Tables']['prelievi']['Update']

// Documento Paziente (pazienti_documenti nel database)
export type PazienteDocumento = Database['public']['Tables']['pazienti_documenti']['Row']
export type NewPazienteDocumento = Database['public']['Tables']['pazienti_documenti']['Insert']
export type UpdatePazienteDocumento = Database['public']['Tables']['pazienti_documenti']['Update']

// Log Download Referto (referti_download_logs nel database)
export type RefertoDownloadLog = Database['public']['Tables']['referti_download_logs']['Row']
export type NewRefertoDownloadLog = Database['public']['Tables']['referti_download_logs']['Insert']
export type UpdateRefertoDownloadLog = Database['public']['Tables']['referti_download_logs']['Update']

// Laboratorio
export type Laboratorio = Database['public']['Tables']['laboratori']['Row']
export type NewLaboratorio = Database['public']['Tables']['laboratori']['Insert']
export type UpdateLaboratorio = Database['public']['Tables']['laboratori']['Update']

// Stato Prelievo (stati_prelievo nel database)
export type StatoPrelievo = Database['public']['Tables']['stati_prelievo']['Row']
export type NewStatoPrelievo = Database['public']['Tables']['stati_prelievo']['Insert']
export type UpdateStatoPrelievo = Database['public']['Tables']['stati_prelievo']['Update']

// Tipo Prelievo (tipi_prelievo nel database)
export type TipoPrelievo = Database['public']['Tables']['tipi_prelievo']['Row']
export type NewTipoPrelievo = Database['public']['Tables']['tipi_prelievo']['Insert']
export type UpdateTipoPrelievo = Database['public']['Tables']['tipi_prelievo']['Update']

// Messaggio Paziente (pazienti_messaggi nel database)
export type PazienteMessaggio = Database['public']['Tables']['pazienti_messaggi']['Row']
export type NewPazienteMessaggio = Database['public']['Tables']['pazienti_messaggi']['Insert']
export type UpdatePazienteMessaggio = Database['public']['Tables']['pazienti_messaggi']['Update']

// Privacy Testo (privacy_testo nel database)
export type PrivacyTesto = Database['public']['Tables']['privacy_testo']['Row']
export type NewPrivacyTesto = Database['public']['Tables']['privacy_testo']['Insert']
export type UpdatePrivacyTesto = Database['public']['Tables']['privacy_testo']['Update']

// Studio Impostazioni (studio_impostazioni nel database)
// Nota: il database usa 'portale_referti_url' ma il codice usa 'studio_portale_referti_url'
export type StudioImpostazioni = Database['public']['Tables']['studio_impostazioni']['Row'] & {
  studio_portale_referti_url?: string | null
}
export type NewStudioImpostazioni = Database['public']['Tables']['studio_impostazioni']['Insert'] & {
  studio_portale_referti_url?: string | null
}
export type UpdateStudioImpostazioni = Database['public']['Tables']['studio_impostazioni']['Update'] & {
  studio_portale_referti_url?: string | null
}

// Notifica Prelievo (prelievi_notifiche nel database)
export type PrelievoNotifica = Database['public']['Tables']['prelievi_notifiche']['Row']
export type NewPrelievoNotifica = Database['public']['Tables']['prelievi_notifiche']['Insert']
export type UpdatePrelievoNotifica = Database['public']['Tables']['prelievi_notifiche']['Update']

// Codice Catastale (codici_catastali nel database)
export type CodiceCatastale = Database['public']['Tables']['codici_catastali']['Row']
export type NewCodiceCatastale = Database['public']['Tables']['codici_catastali']['Insert']
export type UpdateCodiceCatastale = Database['public']['Tables']['codici_catastali']['Update']

