export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      codici_catastali: {
        Row: {
          codice: string
          luogo_nascita: string
          provincia: string
        }
        Insert: {
          codice: string
          luogo_nascita: string
          provincia: string
        }
        Update: {
          codice?: string
          luogo_nascita?: string
          provincia?: string
        }
        Relationships: []
      }
      laboratori: {
        Row: {
          created_at: string | null
          email: string | null
          id: string
          indirizzo: string | null
          nome: string
          telefono: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id?: string
          indirizzo?: string | null
          nome: string
          telefono?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string
          indirizzo?: string | null
          nome?: string
          telefono?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      pazienti: {
        Row: {
          auth_user_id: string | null
          cellulare: string | null
          codice_fiscale: string | null
          cognome: string
          created_at: string | null
          data_nascita: string | null
          email: string | null
          id: string
          luogo_nascita_codice: string | null
          luogo_nascita_comune: string | null
          luogo_nascita_provincia: string | null
          nome: string
          privacy_acquisita_da: string | null
          privacy_firmata: boolean
          privacy_firmata_il: string | null
          privacy_note: string | null
          sesso: string | null
          updated_at: string | null
        }
        Insert: {
          auth_user_id?: string | null
          cellulare?: string | null
          codice_fiscale?: string | null
          cognome: string
          created_at?: string | null
          data_nascita?: string | null
          email?: string | null
          id?: string
          luogo_nascita_codice?: string | null
          luogo_nascita_comune?: string | null
          luogo_nascita_provincia?: string | null
          nome: string
          privacy_acquisita_da?: string | null
          privacy_firmata?: boolean
          privacy_firmata_il?: string | null
          privacy_note?: string | null
          sesso?: string | null
          updated_at?: string | null
        }
        Update: {
          auth_user_id?: string | null
          cellulare?: string | null
          codice_fiscale?: string | null
          cognome?: string
          created_at?: string | null
          data_nascita?: string | null
          email?: string | null
          id?: string
          luogo_nascita_codice?: string | null
          luogo_nascita_comune?: string | null
          luogo_nascita_provincia?: string | null
          nome?: string
          privacy_acquisita_da?: string | null
          privacy_firmata?: boolean
          privacy_firmata_il?: string | null
          privacy_note?: string | null
          sesso?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pazienti_luogo_nascita_codice_fkey"
            columns: ["luogo_nascita_codice"]
            isOneToOne: false
            referencedRelation: "codici_catastali"
            referencedColumns: ["codice"]
          },
          {
            foreignKeyName: "pazienti_privacy_acquisita_da_fk"
            columns: ["privacy_acquisita_da"]
            isOneToOne: false
            referencedRelation: "profili_utenti"
            referencedColumns: ["id"]
          },
        ]
      }
      pazienti_documenti: {
        Row: {
          descrizione: string | null
          id: string
          mime: string | null
          notifica_canale: string | null
          notifica_esito: string | null
          notificato_at: string | null
          paziente_id: string
          pubblicato_at: string | null
          s3_key: string
          scade_at: string | null
          size_bytes: number | null
          titolo: string
          uploaded_at: string
          uploaded_by: string | null
        }
        Insert: {
          descrizione?: string | null
          id?: string
          mime?: string | null
          notifica_canale?: string | null
          notifica_esito?: string | null
          notificato_at?: string | null
          paziente_id: string
          pubblicato_at?: string | null
          s3_key: string
          scade_at?: string | null
          size_bytes?: number | null
          titolo: string
          uploaded_at?: string
          uploaded_by?: string | null
        }
        Update: {
          descrizione?: string | null
          id?: string
          mime?: string | null
          notifica_canale?: string | null
          notifica_esito?: string | null
          notificato_at?: string | null
          paziente_id?: string
          pubblicato_at?: string | null
          s3_key?: string
          scade_at?: string | null
          size_bytes?: number | null
          titolo?: string
          uploaded_at?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pazienti_documenti_paziente_id_fkey"
            columns: ["paziente_id"]
            isOneToOne: false
            referencedRelation: "pazienti"
            referencedColumns: ["id"]
          },
        ]
      }
      pazienti_messaggi: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          letto_at: string | null
          letto_da: string | null
          nascosto: boolean
          paziente_id: string
          pubblicato_at: string | null
          testo: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          letto_at?: string | null
          letto_da?: string | null
          nascosto?: boolean
          paziente_id: string
          pubblicato_at?: string | null
          testo: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          letto_at?: string | null
          letto_da?: string | null
          nascosto?: boolean
          paziente_id?: string
          pubblicato_at?: string | null
          testo?: string
        }
        Relationships: [
          {
            foreignKeyName: "pazienti_messaggi_paziente_id_fkey"
            columns: ["paziente_id"]
            isOneToOne: false
            referencedRelation: "pazienti"
            referencedColumns: ["id"]
          },
        ]
      }
      prelievi: {
        Row: {
          commento: string | null
          created_at: string | null
          data_prelievo: string
          data_stimata_referto: string | null
          descrizione: string | null
          esito_pdf_mime: string | null
          esito_pdf_s3_key: string | null
          esito_pdf_size_bytes: number | null
          esito_pdf_uploaded_at: string | null
          esito_pdf_uploaded_by: string | null
          esito_pdf_url: string | null
          id: string
          laboratorio_id: string
          paziente_id: string
          referto_notifica_canale: string | null
          referto_notifica_esito: string | null
          referto_notificato_at: string | null
          referto_pubblicato_at: string | null
          referto_scade_at: string | null
          referto_ultimo_download_at: string | null
          report_medico: string | null
          rif_interno: string | null
          stato_id: string
          tipo_prelievo_id: string
          updated_at: string | null
        }
        Insert: {
          commento?: string | null
          created_at?: string | null
          data_prelievo: string
          data_stimata_referto?: string | null
          descrizione?: string | null
          esito_pdf_mime?: string | null
          esito_pdf_s3_key?: string | null
          esito_pdf_size_bytes?: number | null
          esito_pdf_uploaded_at?: string | null
          esito_pdf_uploaded_by?: string | null
          esito_pdf_url?: string | null
          id?: string
          laboratorio_id: string
          paziente_id: string
          referto_notifica_canale?: string | null
          referto_notifica_esito?: string | null
          referto_notificato_at?: string | null
          referto_pubblicato_at?: string | null
          referto_scade_at?: string | null
          referto_ultimo_download_at?: string | null
          report_medico?: string | null
          rif_interno?: string | null
          stato_id: string
          tipo_prelievo_id: string
          updated_at?: string | null
        }
        Update: {
          commento?: string | null
          created_at?: string | null
          data_prelievo?: string
          data_stimata_referto?: string | null
          descrizione?: string | null
          esito_pdf_mime?: string | null
          esito_pdf_s3_key?: string | null
          esito_pdf_size_bytes?: number | null
          esito_pdf_uploaded_at?: string | null
          esito_pdf_uploaded_by?: string | null
          esito_pdf_url?: string | null
          id?: string
          laboratorio_id?: string
          paziente_id?: string
          referto_notifica_canale?: string | null
          referto_notifica_esito?: string | null
          referto_notificato_at?: string | null
          referto_pubblicato_at?: string | null
          referto_scade_at?: string | null
          referto_ultimo_download_at?: string | null
          report_medico?: string | null
          rif_interno?: string | null
          stato_id?: string
          tipo_prelievo_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "prelievi_laboratorio_id_fkey"
            columns: ["laboratorio_id"]
            isOneToOne: false
            referencedRelation: "laboratori"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prelievi_paziente_id_fkey"
            columns: ["paziente_id"]
            isOneToOne: false
            referencedRelation: "pazienti"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prelievi_stato_id_fkey"
            columns: ["stato_id"]
            isOneToOne: false
            referencedRelation: "stati_prelievo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prelievi_tipo_prelievo_id_fkey"
            columns: ["tipo_prelievo_id"]
            isOneToOne: false
            referencedRelation: "tipi_prelievo"
            referencedColumns: ["id"]
          },
        ]
      }
      prelievi_notifiche: {
        Row: {
          attempts: number
          canale: string
          created_at: string
          destinatario: string
          id: string
          last_error: string | null
          oggetto: string | null
          paziente_id: string
          prelievo_id: string
          sent_at: string | null
          status: string
          testo: string
        }
        Insert: {
          attempts?: number
          canale: string
          created_at?: string
          destinatario: string
          id?: string
          last_error?: string | null
          oggetto?: string | null
          paziente_id: string
          prelievo_id: string
          sent_at?: string | null
          status?: string
          testo: string
        }
        Update: {
          attempts?: number
          canale?: string
          created_at?: string
          destinatario?: string
          id?: string
          last_error?: string | null
          oggetto?: string | null
          paziente_id?: string
          prelievo_id?: string
          sent_at?: string | null
          status?: string
          testo?: string
        }
        Relationships: [
          {
            foreignKeyName: "prelievi_notifiche_paziente_id_fkey"
            columns: ["paziente_id"]
            isOneToOne: false
            referencedRelation: "pazienti"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prelievi_notifiche_prelievo_id_fkey"
            columns: ["prelievo_id"]
            isOneToOne: false
            referencedRelation: "prelievi"
            referencedColumns: ["id"]
          },
        ]
      }
      privacy_testo: {
        Row: {
          created_at: string
          id: string
          testo: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          testo: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          testo?: string
          updated_at?: string
        }
        Relationships: []
      }
      profili_utenti: {
        Row: {
          attivo: boolean | null
          cognome: string
          created_at: string | null
          id: string
          nome: string
          ruolo: string
          updated_at: string | null
        }
        Insert: {
          attivo?: boolean | null
          cognome: string
          created_at?: string | null
          id: string
          nome: string
          ruolo: string
          updated_at?: string | null
        }
        Update: {
          attivo?: boolean | null
          cognome?: string
          created_at?: string | null
          id?: string
          nome?: string
          ruolo?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      referti_download_logs: {
        Row: {
          created_at: string
          downloaded_at: string
          id: string
          ip_address: unknown
          prelievo_id: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          downloaded_at?: string
          id?: string
          ip_address?: unknown
          prelievo_id: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          downloaded_at?: string
          id?: string
          ip_address?: unknown
          prelievo_id?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "referti_download_logs_prelievo_id_fkey"
            columns: ["prelievo_id"]
            isOneToOne: false
            referencedRelation: "prelievi"
            referencedColumns: ["id"]
          },
        ]
      }
      stati_prelievo: {
        Row: {
          colore: string | null
          created_at: string | null
          id: string
          nome: string
          ordine: number
          updated_at: string | null
        }
        Insert: {
          colore?: string | null
          created_at?: string | null
          id?: string
          nome: string
          ordine: number
          updated_at?: string | null
        }
        Update: {
          colore?: string | null
          created_at?: string | null
          id?: string
          nome?: string
          ordine?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      studio_impostazioni: {
        Row: {
          created_at: string
          id: string
          portale_referti_url: string | null
          studio_cap: string | null
          studio_comune: string | null
          studio_denominazione: string
          studio_email: string | null
          studio_indirizzo: string
          studio_pec: string | null
          studio_provincia: string | null
          studio_telefono: string
          titolare_cf: string | null
          titolare_piva: string | null
          titolare_qualifica: string | null
          titolare_user_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          portale_referti_url?: string | null
          studio_cap?: string | null
          studio_comune?: string | null
          studio_denominazione: string
          studio_email?: string | null
          studio_indirizzo: string
          studio_pec?: string | null
          studio_provincia?: string | null
          studio_telefono: string
          titolare_cf?: string | null
          titolare_piva?: string | null
          titolare_qualifica?: string | null
          titolare_user_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          portale_referti_url?: string | null
          studio_cap?: string | null
          studio_comune?: string | null
          studio_denominazione?: string
          studio_email?: string | null
          studio_indirizzo?: string
          studio_pec?: string | null
          studio_provincia?: string | null
          studio_telefono?: string
          titolare_cf?: string | null
          titolare_piva?: string | null
          titolare_qualifica?: string | null
          titolare_user_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "studio_impostazioni_titolare_user_fk"
            columns: ["titolare_user_id"]
            isOneToOne: false
            referencedRelation: "profili_utenti"
            referencedColumns: ["id"]
          },
        ]
      }
      tipi_prelievo: {
        Row: {
          attivo: boolean | null
          created_at: string | null
          descrizione: string | null
          id: string
          nome: string
          tempo_refertazione_giorni: number | null
          updated_at: string | null
        }
        Insert: {
          attivo?: boolean | null
          created_at?: string | null
          descrizione?: string | null
          id?: string
          nome: string
          tempo_refertazione_giorni?: number | null
          updated_at?: string | null
        }
        Update: {
          attivo?: boolean | null
          created_at?: string | null
          descrizione?: string | null
          id?: string
          nome?: string
          tempo_refertazione_giorni?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calc_documento_scadenza: {
        Args: { pubblicato_at: string }
        Returns: string
      }
      calc_referto_scadenza: {
        Args: { pubblicato_at: string }
        Returns: string
      }
      can_insert_download_log: {
        Args: { _prelievo_id: string }
        Returns: boolean
      }
      current_paziente_id: { Args: never; Returns: string }
      get_schema_constraints: { Args: never; Returns: Json }
      get_schema_foreign_keys: { Args: never; Returns: Json }
      get_schema_functions: { Args: never; Returns: Json }
      get_schema_indexes: { Args: never; Returns: Json }
      get_schema_primary_keys: { Args: never; Returns: Json }
      get_schema_rls_policies: { Args: never; Returns: Json }
      get_schema_rls_status: { Args: never; Returns: Json }
      get_schema_tables: { Args: never; Returns: Json }
      get_schema_triggers: { Args: never; Returns: Json }
      is_admin: { Args: never; Returns: boolean }
      is_paziente: { Args: never; Returns: boolean }
      is_staff: { Args: never; Returns: boolean }
      parse_codice_fiscale: {
        Args: { p_cf: string }
        Returns: {
          birth_date: string
          luogo_nascita_codice: string
          sesso: string
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
