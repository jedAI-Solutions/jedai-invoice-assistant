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
      approved_invoices: {
        Row: {
          begruendung: string | null
          belegdatum: string
          belegnummer: string
          betrag: number
          buchungstext: string
          classified_invoice_id: number | null
          created_at: string | null
          gegenkonto: string
          id: number
          konfidenz: number
          konto: string
          lernfeedback: string | null
          mandant: string
          mandant_id: number | null
          mandant_nr: string
          pruefhinweise: string[] | null
          uststeuerzahl: string
        }
        Insert: {
          begruendung?: string | null
          belegdatum: string
          belegnummer: string
          betrag: number
          buchungstext: string
          classified_invoice_id?: number | null
          created_at?: string | null
          gegenkonto: string
          id?: never
          konfidenz: number
          konto: string
          lernfeedback?: string | null
          mandant: string
          mandant_id?: number | null
          mandant_nr: string
          pruefhinweise?: string[] | null
          uststeuerzahl: string
        }
        Update: {
          begruendung?: string | null
          belegdatum?: string
          belegnummer?: string
          betrag?: number
          buchungstext?: string
          classified_invoice_id?: number | null
          created_at?: string | null
          gegenkonto?: string
          id?: never
          konfidenz?: number
          konto?: string
          lernfeedback?: string | null
          mandant?: string
          mandant_id?: number | null
          mandant_nr?: string
          pruefhinweise?: string[] | null
          uststeuerzahl?: string
        }
        Relationships: [
          {
            foreignKeyName: "approved_invoices_classified_invoice_id_fkey"
            columns: ["classified_invoice_id"]
            isOneToOne: false
            referencedRelation: "classified_invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "approved_invoices_mandant_id_fkey"
            columns: ["mandant_id"]
            isOneToOne: false
            referencedRelation: "mandantenstammdaten"
            referencedColumns: ["id"]
          },
        ]
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
      booking_history: {
        Row: {
          belegdatum: string
          belegnummer: string
          betrag: number
          buchungstext: string
          created_at: string | null
          gegenkonto: string
          id: number
          konto: string
          mandant: string
          mandant_id: number | null
          mandant_nr: string
          updated_at: string | null
          uststeuerzahl: string
        }
        Insert: {
          belegdatum: string
          belegnummer: string
          betrag: number
          buchungstext: string
          created_at?: string | null
          gegenkonto: string
          id?: never
          konto: string
          mandant: string
          mandant_id?: number | null
          mandant_nr: string
          updated_at?: string | null
          uststeuerzahl: string
        }
        Update: {
          belegdatum?: string
          belegnummer?: string
          betrag?: number
          buchungstext?: string
          created_at?: string | null
          gegenkonto?: string
          id?: never
          konto?: string
          mandant?: string
          mandant_id?: number | null
          mandant_nr?: string
          updated_at?: string | null
          uststeuerzahl?: string
        }
        Relationships: [
          {
            foreignKeyName: "booking_history_mandant_id_fkey"
            columns: ["mandant_id"]
            isOneToOne: false
            referencedRelation: "mandantenstammdaten"
            referencedColumns: ["id"]
          },
        ]
      }
      classified_invoices: {
        Row: {
          begruendung: string | null
          belegdatum: string
          belegnummer: string
          betrag: number
          buchungstext: string
          created_at: string | null
          gegenkonto: string
          id: number
          konfidenz: number
          konto: string
          lernfeedback: string | null
          mandant: string
          mandant_id: number | null
          mandant_nr: string
          pruefhinweise: string[]
          uststeuerzahl: string
        }
        Insert: {
          begruendung?: string | null
          belegdatum: string
          belegnummer: string
          betrag: number
          buchungstext: string
          created_at?: string | null
          gegenkonto: string
          id?: never
          konfidenz: number
          konto: string
          lernfeedback?: string | null
          mandant: string
          mandant_id?: number | null
          mandant_nr: string
          pruefhinweise: string[]
          uststeuerzahl: string
        }
        Update: {
          begruendung?: string | null
          belegdatum?: string
          belegnummer?: string
          betrag?: number
          buchungstext?: string
          created_at?: string | null
          gegenkonto?: string
          id?: never
          konfidenz?: number
          konto?: string
          lernfeedback?: string | null
          mandant?: string
          mandant_id?: number | null
          mandant_nr?: string
          pruefhinweise?: string[]
          uststeuerzahl?: string
        }
        Relationships: [
          {
            foreignKeyName: "classified_invoices_mandant_id_fkey"
            columns: ["mandant_id"]
            isOneToOne: false
            referencedRelation: "mandantenstammdaten"
            referencedColumns: ["id"]
          },
        ]
      }
      embeddings: {
        Row: {
          content: string
          created_at: string | null
          embedding: string
          id: number
        }
        Insert: {
          content: string
          created_at?: string | null
          embedding: string
          id?: never
        }
        Update: {
          content?: string
          created_at?: string | null
          embedding?: string
          id?: never
        }
        Relationships: []
      }
      ki_trainingsdaten: {
        Row: {
          beleg_id: string | null
          created_at: string
          feedback: Json
          mandant_id: string
          mandant_id_uuid: string | null
          training_id: string
        }
        Insert: {
          beleg_id?: string | null
          created_at?: string
          feedback: Json
          mandant_id: string
          mandant_id_uuid?: string | null
          training_id?: string
        }
        Update: {
          beleg_id?: string | null
          created_at?: string
          feedback?: Json
          mandant_id?: string
          mandant_id_uuid?: string | null
          training_id?: string
        }
        Relationships: []
      }
      mandantenstammdaten: {
        Row: {
          angelegt: string | null
          bankname: string | null
          bearbeiter: string | null
          bic: string | null
          created_at: string | null
          email: string | null
          fa_nr: string | null
          finanzamt: string | null
          geaendert: string | null
          geschaeftsfuehrer: string | null
          hrb_nr: string | null
          iban: string | null
          id: number
          internet: string | null
          kontenrahmen: string | null
          land: string | null
          mandant_nr: string
          mandantentyp: string
          name1: string
          name2: string | null
          ort: string
          plz: string | null
          rechtsform: string | null
          registergericht: string | null
          steuer_nr: string | null
          strasse: string | null
          telefon: string | null
          updated_at: string | null
          ust_idnr: string | null
          ust_zeitraum: string | null
          versteuerung: string | null
          wj_beginn: string | null
          wj_ende: string | null
          zusatz: string | null
        }
        Insert: {
          angelegt?: string | null
          bankname?: string | null
          bearbeiter?: string | null
          bic?: string | null
          created_at?: string | null
          email?: string | null
          fa_nr?: string | null
          finanzamt?: string | null
          geaendert?: string | null
          geschaeftsfuehrer?: string | null
          hrb_nr?: string | null
          iban?: string | null
          id?: number
          internet?: string | null
          kontenrahmen?: string | null
          land?: string | null
          mandant_nr: string
          mandantentyp: string
          name1: string
          name2?: string | null
          ort: string
          plz?: string | null
          rechtsform?: string | null
          registergericht?: string | null
          steuer_nr?: string | null
          strasse?: string | null
          telefon?: string | null
          updated_at?: string | null
          ust_idnr?: string | null
          ust_zeitraum?: string | null
          versteuerung?: string | null
          wj_beginn?: string | null
          wj_ende?: string | null
          zusatz?: string | null
        }
        Update: {
          angelegt?: string | null
          bankname?: string | null
          bearbeiter?: string | null
          bic?: string | null
          created_at?: string | null
          email?: string | null
          fa_nr?: string | null
          finanzamt?: string | null
          geaendert?: string | null
          geschaeftsfuehrer?: string | null
          hrb_nr?: string | null
          iban?: string | null
          id?: number
          internet?: string | null
          kontenrahmen?: string | null
          land?: string | null
          mandant_nr?: string
          mandantentyp?: string
          name1?: string
          name2?: string | null
          ort?: string
          plz?: string | null
          rechtsform?: string | null
          registergericht?: string | null
          steuer_nr?: string | null
          strasse?: string | null
          telefon?: string | null
          updated_at?: string | null
          ust_idnr?: string | null
          ust_zeitraum?: string | null
          versteuerung?: string | null
          wj_beginn?: string | null
          wj_ende?: string | null
          zusatz?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_mandantenstammdaten: {
        Args: Record<PropertyKey, never>
        Returns: {
          name1: string
          mandant_nr: string
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
  public: {
    Enums: {},
  },
} as const
