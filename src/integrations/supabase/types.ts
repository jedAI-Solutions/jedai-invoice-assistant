export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      agenda_mandanten: {
        Row: {
          ansprechpartner: string | null
          bank: string | null
          bic: string | null
          email: string | null
          firmenname: string | null
          hausnummer: string | null
          iban: string | null
          id: number
          mandantennummer: string | null
          name: string | null
          ort: string | null
          plz: string | null
          steuernummer: string | null
          strasse: string | null
          telefon: string | null
          ust_pflichtig: boolean | null
        }
        Insert: {
          ansprechpartner?: string | null
          bank?: string | null
          bic?: string | null
          email?: string | null
          firmenname?: string | null
          hausnummer?: string | null
          iban?: string | null
          id?: number
          mandantennummer?: string | null
          name?: string | null
          ort?: string | null
          plz?: string | null
          steuernummer?: string | null
          strasse?: string | null
          telefon?: string | null
          ust_pflichtig?: boolean | null
        }
        Update: {
          ansprechpartner?: string | null
          bank?: string | null
          bic?: string | null
          email?: string | null
          firmenname?: string | null
          hausnummer?: string | null
          iban?: string | null
          id?: number
          mandantennummer?: string | null
          name?: string | null
          ort?: string | null
          plz?: string | null
          steuernummer?: string | null
          strasse?: string | null
          telefon?: string | null
          ust_pflichtig?: boolean | null
        }
        Relationships: []
      }
      audit_trails: {
        Row: {
          action: string
          audit_id: string
          details: Json | null
          entity_id: string
          entity_type: string
          timestamp: string
          user_id: string | null
        }
        Insert: {
          action: string
          audit_id?: string
          details?: Json | null
          entity_id: string
          entity_type: string
          timestamp?: string
          user_id?: string | null
        }
        Update: {
          action?: string
          audit_id?: string
          details?: Json | null
          entity_id?: string
          entity_type?: string
          timestamp?: string
          user_id?: string | null
        }
        Relationships: []
      }
      belege: {
        Row: {
          beleg_id: string
          belegdatum: string | null
          created_at: string
          ki_buchungsvorschlag: Json | null
          konfidenz: number | null
          mandant_id: string
          ocr_data: Json | null
          original_filename: string
          status: string
          updated_at: string
          upload_date: string
        }
        Insert: {
          beleg_id?: string
          belegdatum?: string | null
          created_at?: string
          ki_buchungsvorschlag?: Json | null
          konfidenz?: number | null
          mandant_id: string
          ocr_data?: Json | null
          original_filename: string
          status?: string
          updated_at?: string
          upload_date?: string
        }
        Update: {
          beleg_id?: string
          belegdatum?: string | null
          created_at?: string
          ki_buchungsvorschlag?: Json | null
          konfidenz?: number | null
          mandant_id?: string
          ocr_data?: Json | null
          original_filename?: string
          status?: string
          updated_at?: string
          upload_date?: string
        }
        Relationships: []
      }
      buchungshistorie: {
        Row: {
          beleg_id: string | null
          belegart: string | null
          belegnummer: string | null
          betrag: number
          buchung_id: string
          buchungsdatum: string
          buchungstext: string | null
          created_at: string
          gegenkonto: string
          konto: string
          name: string | null
          steuerkennzeichen: string | null
          uststeuerzahl: string | null
          vector_embedding: string | null
          waehrung: string | null
        }
        Insert: {
          beleg_id?: string | null
          belegart?: string | null
          belegnummer?: string | null
          betrag: number
          buchung_id?: string
          buchungsdatum: string
          buchungstext?: string | null
          created_at?: string
          gegenkonto: string
          konto: string
          name?: string | null
          steuerkennzeichen?: string | null
          uststeuerzahl?: string | null
          vector_embedding?: string | null
          waehrung?: string | null
        }
        Update: {
          beleg_id?: string | null
          belegart?: string | null
          belegnummer?: string | null
          betrag?: number
          buchung_id?: string
          buchungsdatum?: string
          buchungstext?: string | null
          created_at?: string
          gegenkonto?: string
          konto?: string
          name?: string | null
          steuerkennzeichen?: string | null
          uststeuerzahl?: string | null
          vector_embedding?: string | null
          waehrung?: string | null
        }
        Relationships: []
      }
      export_queue: {
        Row: {
          buchung_id: string
          created_at: string
          export_format: string
          export_id: string
          mandant_id: string
          status: string
        }
        Insert: {
          buchung_id: string
          created_at?: string
          export_format: string
          export_id?: string
          mandant_id: string
          status?: string
        }
        Update: {
          buchung_id?: string
          created_at?: string
          export_format?: string
          export_id?: string
          mandant_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "export_queue_buchung_id_fkey"
            columns: ["buchung_id"]
            isOneToOne: false
            referencedRelation: "buchungshistorie"
            referencedColumns: ["buchung_id"]
          },
        ]
      }
      ki_trainingsdaten: {
        Row: {
          beleg_id: string | null
          created_at: string
          feedback: Json
          mandant_id: string
          training_id: string
        }
        Insert: {
          beleg_id?: string | null
          created_at?: string
          feedback: Json
          mandant_id: string
          training_id?: string
        }
        Update: {
          beleg_id?: string | null
          created_at?: string
          feedback?: Json
          mandant_id?: string
          training_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ki_trainingsdaten_beleg_id_fkey"
            columns: ["beleg_id"]
            isOneToOne: false
            referencedRelation: "belege"
            referencedColumns: ["beleg_id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      binary_quantize: {
        Args: { "": string } | { "": unknown }
        Returns: unknown
      }
      halfvec_avg: {
        Args: { "": number[] }
        Returns: unknown
      }
      halfvec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      halfvec_send: {
        Args: { "": unknown }
        Returns: string
      }
      halfvec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      hnsw_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_sparsevec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnswhandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflat_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflat_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflathandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      l2_norm: {
        Args: { "": unknown } | { "": unknown }
        Returns: number
      }
      l2_normalize: {
        Args: { "": string } | { "": unknown } | { "": unknown }
        Returns: unknown
      }
      sparsevec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      sparsevec_send: {
        Args: { "": unknown }
        Returns: string
      }
      sparsevec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      vector_avg: {
        Args: { "": number[] }
        Returns: string
      }
      vector_dims: {
        Args: { "": string } | { "": unknown }
        Returns: number
      }
      vector_norm: {
        Args: { "": string }
        Returns: number
      }
      vector_out: {
        Args: { "": string }
        Returns: unknown
      }
      vector_send: {
        Args: { "": string }
        Returns: string
      }
      vector_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
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
  public: {
    Enums: {},
  },
} as const
