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
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      ai_classifications: {
        Row: {
          ai_model: string | null
          ai_result: Json | null
          belegdatum: string
          belegnummer: string | null
          betrag: number
          buchungstext: string
          check_notes: string | null
          created_at: string | null
          document_id: string | null
          document_url: string | null
          feedback_required: boolean | null
          gegenkonto: string
          historical_context_used: boolean | null
          id: string
          konto: string
          mandant_confidence: number | null
          mandant_id: string | null
          mandant_resolved: string | null
          ocr_result_id: string | null
          overall_confidence: number
          processing_time_ms: number | null
          reasoning: string | null
          status: string | null
          uncertainty_factors: string[] | null
          updated_at: string | null
          uststeuerzahl: string | null
        }
        Insert: {
          ai_model?: string | null
          ai_result?: Json | null
          belegdatum: string
          belegnummer?: string | null
          betrag: number
          buchungstext: string
          check_notes?: string | null
          created_at?: string | null
          document_id?: string | null
          document_url?: string | null
          feedback_required?: boolean | null
          gegenkonto: string
          historical_context_used?: boolean | null
          id?: string
          konto: string
          mandant_confidence?: number | null
          mandant_id?: string | null
          mandant_resolved?: string | null
          ocr_result_id?: string | null
          overall_confidence: number
          processing_time_ms?: number | null
          reasoning?: string | null
          status?: string | null
          uncertainty_factors?: string[] | null
          updated_at?: string | null
          uststeuerzahl?: string | null
        }
        Update: {
          ai_model?: string | null
          ai_result?: Json | null
          belegdatum?: string
          belegnummer?: string | null
          betrag?: number
          buchungstext?: string
          check_notes?: string | null
          created_at?: string | null
          document_id?: string | null
          document_url?: string | null
          feedback_required?: boolean | null
          gegenkonto?: string
          historical_context_used?: boolean | null
          id?: string
          konto?: string
          mandant_confidence?: number | null
          mandant_id?: string | null
          mandant_resolved?: string | null
          ocr_result_id?: string | null
          overall_confidence?: number
          processing_time_ms?: number | null
          reasoning?: string | null
          status?: string | null
          uncertainty_factors?: string[] | null
          updated_at?: string | null
          uststeuerzahl?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_classifications_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "document_registry"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_classifications_mandant_id_fkey"
            columns: ["mandant_id"]
            isOneToOne: false
            referencedRelation: "mandant_public_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_classifications_mandant_id_fkey"
            columns: ["mandant_id"]
            isOneToOne: false
            referencedRelation: "mandant_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_classifications_mandant_id_fkey"
            columns: ["mandant_id"]
            isOneToOne: false
            referencedRelation: "mandants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_classifications_mandant_id_fkey"
            columns: ["mandant_id"]
            isOneToOne: false
            referencedRelation: "v_agenda_mandants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_classifications_ocr_result_id_fkey"
            columns: ["ocr_result_id"]
            isOneToOne: false
            referencedRelation: "ocr_results"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_feedback_loop: {
        Row: {
          classification_id: string | null
          corrected_by: string | null
          correction_reason: string | null
          created_at: string | null
          document_id: string | null
          feedback_created_at: string | null
          feedback_impact: string | null
          feedback_verified: boolean | null
          human_correction: Json | null
          id: string
          learning_priority: number | null
          original_confidence: number | null
          original_prediction: Json
          processed_at: string | null
          processed_for_training: boolean | null
          processing_notes: string | null
          verification_notes: string | null
          verified_by: string | null
        }
        Insert: {
          classification_id?: string | null
          corrected_by?: string | null
          correction_reason?: string | null
          created_at?: string | null
          document_id?: string | null
          feedback_created_at?: string | null
          feedback_impact?: string | null
          feedback_verified?: boolean | null
          human_correction?: Json | null
          id?: string
          learning_priority?: number | null
          original_confidence?: number | null
          original_prediction: Json
          processed_at?: string | null
          processed_for_training?: boolean | null
          processing_notes?: string | null
          verification_notes?: string | null
          verified_by?: string | null
        }
        Update: {
          classification_id?: string | null
          corrected_by?: string | null
          correction_reason?: string | null
          created_at?: string | null
          document_id?: string | null
          feedback_created_at?: string | null
          feedback_impact?: string | null
          feedback_verified?: boolean | null
          human_correction?: Json | null
          id?: string
          learning_priority?: number | null
          original_confidence?: number | null
          original_prediction?: Json
          processed_at?: string | null
          processed_for_training?: boolean | null
          processing_notes?: string | null
          verification_notes?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_feedback_loop_classification_id_fkey"
            columns: ["classification_id"]
            isOneToOne: false
            referencedRelation: "ai_classifications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_feedback_loop_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "document_registry"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_model_versions: {
        Row: {
          accuracy: number | null
          benchmark_scores: Json | null
          created_at: string | null
          deployed_at: string | null
          deployment_status: string | null
          f1_score: number | null
          hyperparameters: Json | null
          id: string
          model_name: string
          model_type: string | null
          model_version: string
          precision_score: number | null
          recall: number | null
          training_config: Json | null
          training_data_size: number | null
          training_end_date: string | null
          training_start_date: string | null
          updated_at: string | null
          validation_results: Json | null
        }
        Insert: {
          accuracy?: number | null
          benchmark_scores?: Json | null
          created_at?: string | null
          deployed_at?: string | null
          deployment_status?: string | null
          f1_score?: number | null
          hyperparameters?: Json | null
          id?: string
          model_name: string
          model_type?: string | null
          model_version: string
          precision_score?: number | null
          recall?: number | null
          training_config?: Json | null
          training_data_size?: number | null
          training_end_date?: string | null
          training_start_date?: string | null
          updated_at?: string | null
          validation_results?: Json | null
        }
        Update: {
          accuracy?: number | null
          benchmark_scores?: Json | null
          created_at?: string | null
          deployed_at?: string | null
          deployment_status?: string | null
          f1_score?: number | null
          hyperparameters?: Json | null
          id?: string
          model_name?: string
          model_type?: string | null
          model_version?: string
          precision_score?: number | null
          recall?: number | null
          training_config?: Json | null
          training_data_size?: number | null
          training_end_date?: string | null
          training_start_date?: string | null
          updated_at?: string | null
          validation_results?: Json | null
        }
        Relationships: []
      }
      ai_training_data: {
        Row: {
          accuracy_improvement: number | null
          actual_output: Json | null
          classification_id: string | null
          contains_personal_data: boolean | null
          created_at: string | null
          document_id: string | null
          expected_output: Json
          feedback_quality: number | null
          feedback_source: string | null
          feedback_type: string | null
          id: string
          input_text: string
          mandant_id: string | null
          mandant_nr: string | null
          pseudonymization_applied: boolean | null
          training_date: string | null
          training_weight: number | null
          updated_at: string | null
          used_in_training: boolean | null
        }
        Insert: {
          accuracy_improvement?: number | null
          actual_output?: Json | null
          classification_id?: string | null
          contains_personal_data?: boolean | null
          created_at?: string | null
          document_id?: string | null
          expected_output: Json
          feedback_quality?: number | null
          feedback_source?: string | null
          feedback_type?: string | null
          id?: string
          input_text: string
          mandant_id?: string | null
          mandant_nr?: string | null
          pseudonymization_applied?: boolean | null
          training_date?: string | null
          training_weight?: number | null
          updated_at?: string | null
          used_in_training?: boolean | null
        }
        Update: {
          accuracy_improvement?: number | null
          actual_output?: Json | null
          classification_id?: string | null
          contains_personal_data?: boolean | null
          created_at?: string | null
          document_id?: string | null
          expected_output?: Json
          feedback_quality?: number | null
          feedback_source?: string | null
          feedback_type?: string | null
          id?: string
          input_text?: string
          mandant_id?: string | null
          mandant_nr?: string | null
          pseudonymization_applied?: boolean | null
          training_date?: string | null
          training_weight?: number | null
          updated_at?: string | null
          used_in_training?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_training_data_classification_id_fkey"
            columns: ["classification_id"]
            isOneToOne: false
            referencedRelation: "ai_classifications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_training_data_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "document_registry"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_training_data_mandant_id_fkey"
            columns: ["mandant_id"]
            isOneToOne: false
            referencedRelation: "mandant_public_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_training_data_mandant_id_fkey"
            columns: ["mandant_id"]
            isOneToOne: false
            referencedRelation: "mandant_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_training_data_mandant_id_fkey"
            columns: ["mandant_id"]
            isOneToOne: false
            referencedRelation: "mandants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_training_data_mandant_id_fkey"
            columns: ["mandant_id"]
            isOneToOne: false
            referencedRelation: "v_agenda_mandants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_training_data_mandant_nr_fkey"
            columns: ["mandant_nr"]
            isOneToOne: false
            referencedRelation: "mandant_public_view"
            referencedColumns: ["mandant_nr"]
          },
          {
            foreignKeyName: "ai_training_data_mandant_nr_fkey"
            columns: ["mandant_nr"]
            isOneToOne: false
            referencedRelation: "mandant_summary"
            referencedColumns: ["mandant_nr"]
          },
          {
            foreignKeyName: "ai_training_data_mandant_nr_fkey"
            columns: ["mandant_nr"]
            isOneToOne: false
            referencedRelation: "mandants"
            referencedColumns: ["mandant_nr"]
          },
          {
            foreignKeyName: "ai_training_data_mandant_nr_fkey"
            columns: ["mandant_nr"]
            isOneToOne: false
            referencedRelation: "v_agenda_mandants"
            referencedColumns: ["mandant_nr"]
          },
        ]
      }
      approval_queue: {
        Row: {
          assigned_to: string | null
          classification_id: string | null
          complexity_score: number | null
          confidence_score: number | null
          created_at: string | null
          document_id: string | null
          gobd_human_oversight: boolean | null
          id: string
          mandant_id: string | null
          modifications_made: Json | null
          priority: string | null
          queue_entry_time: string | null
          review_completion_time: string | null
          review_reason: string
          review_required_by_law: boolean | null
          review_start_time: string | null
          review_status: string | null
          reviewer_notes: string | null
          target_completion_time: string | null
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          classification_id?: string | null
          complexity_score?: number | null
          confidence_score?: number | null
          created_at?: string | null
          document_id?: string | null
          gobd_human_oversight?: boolean | null
          id?: string
          mandant_id?: string | null
          modifications_made?: Json | null
          priority?: string | null
          queue_entry_time?: string | null
          review_completion_time?: string | null
          review_reason: string
          review_required_by_law?: boolean | null
          review_start_time?: string | null
          review_status?: string | null
          reviewer_notes?: string | null
          target_completion_time?: string | null
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          classification_id?: string | null
          complexity_score?: number | null
          confidence_score?: number | null
          created_at?: string | null
          document_id?: string | null
          gobd_human_oversight?: boolean | null
          id?: string
          mandant_id?: string | null
          modifications_made?: Json | null
          priority?: string | null
          queue_entry_time?: string | null
          review_completion_time?: string | null
          review_reason?: string
          review_required_by_law?: boolean | null
          review_start_time?: string | null
          review_status?: string | null
          reviewer_notes?: string | null
          target_completion_time?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "approval_queue_classification_id_fkey"
            columns: ["classification_id"]
            isOneToOne: false
            referencedRelation: "ai_classifications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "approval_queue_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "document_registry"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "approval_queue_mandant_id_fkey"
            columns: ["mandant_id"]
            isOneToOne: false
            referencedRelation: "mandant_public_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "approval_queue_mandant_id_fkey"
            columns: ["mandant_id"]
            isOneToOne: false
            referencedRelation: "mandant_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "approval_queue_mandant_id_fkey"
            columns: ["mandant_id"]
            isOneToOne: false
            referencedRelation: "mandants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "approval_queue_mandant_id_fkey"
            columns: ["mandant_id"]
            isOneToOne: false
            referencedRelation: "v_agenda_mandants"
            referencedColumns: ["id"]
          },
        ]
      }
      approved_bookings: {
        Row: {
          approval_id: string | null
          approval_method: string | null
          approved_by: string
          belegdatum: string
          belegnummer: string
          betrag: number
          buchungstext: string
          classification_id: string | null
          created_at: string | null
          document_id: string | null
          export_batch_id: string | null
          export_status: string | null
          exported_at: string | null
          final_confidence: number | null
          gegenkonto: string
          id: string
          konto: string
          mandant_id: string
          mandant_name: string
          mandant_nr: string
          qa_checked: boolean | null
          qa_notes: string | null
          updated_at: string | null
          uststeuerzahl: string | null
        }
        Insert: {
          approval_id?: string | null
          approval_method?: string | null
          approved_by: string
          belegdatum: string
          belegnummer: string
          betrag: number
          buchungstext: string
          classification_id?: string | null
          created_at?: string | null
          document_id?: string | null
          export_batch_id?: string | null
          export_status?: string | null
          exported_at?: string | null
          final_confidence?: number | null
          gegenkonto: string
          id?: string
          konto: string
          mandant_id: string
          mandant_name: string
          mandant_nr: string
          qa_checked?: boolean | null
          qa_notes?: string | null
          updated_at?: string | null
          uststeuerzahl?: string | null
        }
        Update: {
          approval_id?: string | null
          approval_method?: string | null
          approved_by?: string
          belegdatum?: string
          belegnummer?: string
          betrag?: number
          buchungstext?: string
          classification_id?: string | null
          created_at?: string | null
          document_id?: string | null
          export_batch_id?: string | null
          export_status?: string | null
          exported_at?: string | null
          final_confidence?: number | null
          gegenkonto?: string
          id?: string
          konto?: string
          mandant_id?: string
          mandant_name?: string
          mandant_nr?: string
          qa_checked?: boolean | null
          qa_notes?: string | null
          updated_at?: string | null
          uststeuerzahl?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "approved_bookings_approval_id_fkey"
            columns: ["approval_id"]
            isOneToOne: false
            referencedRelation: "approval_queue"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "approved_bookings_classification_id_fkey"
            columns: ["classification_id"]
            isOneToOne: false
            referencedRelation: "ai_classifications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "approved_bookings_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "document_registry"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "approved_bookings_mandant_id_fkey"
            columns: ["mandant_id"]
            isOneToOne: false
            referencedRelation: "mandant_public_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "approved_bookings_mandant_id_fkey"
            columns: ["mandant_id"]
            isOneToOne: false
            referencedRelation: "mandant_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "approved_bookings_mandant_id_fkey"
            columns: ["mandant_id"]
            isOneToOne: false
            referencedRelation: "mandants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "approved_bookings_mandant_id_fkey"
            columns: ["mandant_id"]
            isOneToOne: false
            referencedRelation: "v_agenda_mandants"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
          action: string
          created_at: string | null
          details: Json | null
          id: number
          ip_address: unknown | null
          session_id: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          details?: Json | null
          id?: number
          ip_address?: unknown | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          details?: Json | null
          id?: number
          ip_address?: unknown | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          business_transaction_id: string | null
          changes_summary: string | null
          created_at: string | null
          deletion_scheduled_for: string | null
          document_reference: string | null
          entity_id: string
          entity_type: string
          gobd_relevant: boolean | null
          id: string
          ip_address: unknown | null
          new_values: Json | null
          old_values: Json | null
          processing_stage: string | null
          retention_period_years: number | null
          session_id: string | null
          timestamp: string | null
          user_agent: string | null
          user_id: string | null
          user_name: string | null
          workflow_step: string | null
        }
        Insert: {
          action: string
          business_transaction_id?: string | null
          changes_summary?: string | null
          created_at?: string | null
          deletion_scheduled_for?: string | null
          document_reference?: string | null
          entity_id: string
          entity_type: string
          gobd_relevant?: boolean | null
          id?: string
          ip_address?: unknown | null
          new_values?: Json | null
          old_values?: Json | null
          processing_stage?: string | null
          retention_period_years?: number | null
          session_id?: string | null
          timestamp?: string | null
          user_agent?: string | null
          user_id?: string | null
          user_name?: string | null
          workflow_step?: string | null
        }
        Update: {
          action?: string
          business_transaction_id?: string | null
          changes_summary?: string | null
          created_at?: string | null
          deletion_scheduled_for?: string | null
          document_reference?: string | null
          entity_id?: string
          entity_type?: string
          gobd_relevant?: boolean | null
          id?: string
          ip_address?: unknown | null
          new_values?: Json | null
          old_values?: Json | null
          processing_stage?: string | null
          retention_period_years?: number | null
          session_id?: string | null
          timestamp?: string | null
          user_agent?: string | null
          user_id?: string | null
          user_name?: string | null
          workflow_step?: string | null
        }
        Relationships: []
      }
      booking_text_templates: {
        Row: {
          booking_text: string
          category: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          last_used: string | null
          mandant_id: string | null
          mandant_specific: boolean | null
          template_number: number | null
          updated_at: string | null
          usage_count: number | null
        }
        Insert: {
          booking_text: string
          category?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_used?: string | null
          mandant_id?: string | null
          mandant_specific?: boolean | null
          template_number?: number | null
          updated_at?: string | null
          usage_count?: number | null
        }
        Update: {
          booking_text?: string
          category?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_used?: string | null
          mandant_id?: string | null
          mandant_specific?: boolean | null
          template_number?: number | null
          updated_at?: string | null
          usage_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "booking_text_templates_mandant_id_fkey"
            columns: ["mandant_id"]
            isOneToOne: false
            referencedRelation: "mandant_public_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_text_templates_mandant_id_fkey"
            columns: ["mandant_id"]
            isOneToOne: false
            referencedRelation: "mandant_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_text_templates_mandant_id_fkey"
            columns: ["mandant_id"]
            isOneToOne: false
            referencedRelation: "mandants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_text_templates_mandant_id_fkey"
            columns: ["mandant_id"]
            isOneToOne: false
            referencedRelation: "v_agenda_mandants"
            referencedColumns: ["id"]
          },
        ]
      }
      business_partners: {
        Row: {
          account_number: string
          address_type: string | null
          business_purpose: string | null
          company_name: string | null
          created_at: string | null
          eu_country: string | null
          eu_vat_id: string | null
          id: string
          is_active: boolean | null
          name_generic: string | null
          person_firstname: string | null
          person_lastname: string | null
          short_name: string | null
          updated_at: string | null
        }
        Insert: {
          account_number: string
          address_type?: string | null
          business_purpose?: string | null
          company_name?: string | null
          created_at?: string | null
          eu_country?: string | null
          eu_vat_id?: string | null
          id?: string
          is_active?: boolean | null
          name_generic?: string | null
          person_firstname?: string | null
          person_lastname?: string | null
          short_name?: string | null
          updated_at?: string | null
        }
        Update: {
          account_number?: string
          address_type?: string | null
          business_purpose?: string | null
          company_name?: string | null
          created_at?: string | null
          eu_country?: string | null
          eu_vat_id?: string | null
          id?: string
          is_active?: boolean | null
          name_generic?: string | null
          person_firstname?: string | null
          person_lastname?: string | null
          short_name?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      chart_of_accounts: {
        Row: {
          account_class: string | null
          account_name: string
          account_name_long: string | null
          account_number: string
          account_type: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          kontenrahmen: string
          language_id: string | null
          updated_at: string | null
        }
        Insert: {
          account_class?: string | null
          account_name: string
          account_name_long?: string | null
          account_number: string
          account_type?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          kontenrahmen: string
          language_id?: string | null
          updated_at?: string | null
        }
        Update: {
          account_class?: string | null
          account_name?: string
          account_name_long?: string | null
          account_number?: string
          account_type?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          kontenrahmen?: string
          language_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      compliance_violations: {
        Row: {
          created_at: string | null
          description: string
          detected_by: string
          detection_date: string | null
          follow_up_required: boolean | null
          id: string
          mandant_id: string | null
          potential_consequences: string | null
          prevention_measures: string | null
          regulation_reference: string | null
          related_entity_id: string | null
          related_entity_type: string | null
          resolution_description: string | null
          resolution_status: string | null
          resolved_at: string | null
          resolved_by: string | null
          severity: string
          updated_at: string | null
          violation_type: string
        }
        Insert: {
          created_at?: string | null
          description: string
          detected_by: string
          detection_date?: string | null
          follow_up_required?: boolean | null
          id?: string
          mandant_id?: string | null
          potential_consequences?: string | null
          prevention_measures?: string | null
          regulation_reference?: string | null
          related_entity_id?: string | null
          related_entity_type?: string | null
          resolution_description?: string | null
          resolution_status?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity: string
          updated_at?: string | null
          violation_type: string
        }
        Update: {
          created_at?: string | null
          description?: string
          detected_by?: string
          detection_date?: string | null
          follow_up_required?: boolean | null
          id?: string
          mandant_id?: string | null
          potential_consequences?: string | null
          prevention_measures?: string | null
          regulation_reference?: string | null
          related_entity_id?: string | null
          related_entity_type?: string | null
          resolution_description?: string | null
          resolution_status?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          updated_at?: string | null
          violation_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "compliance_violations_mandant_id_fkey"
            columns: ["mandant_id"]
            isOneToOne: false
            referencedRelation: "mandant_public_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compliance_violations_mandant_id_fkey"
            columns: ["mandant_id"]
            isOneToOne: false
            referencedRelation: "mandant_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compliance_violations_mandant_id_fkey"
            columns: ["mandant_id"]
            isOneToOne: false
            referencedRelation: "mandants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compliance_violations_mandant_id_fkey"
            columns: ["mandant_id"]
            isOneToOne: false
            referencedRelation: "v_agenda_mandants"
            referencedColumns: ["id"]
          },
        ]
      }
      data_processing_activities: {
        Row: {
          activity_description: string
          activity_name: string
          created_at: string | null
          data_categories: string[]
          data_subject_categories: string[]
          id: string
          is_active: boolean | null
          legal_basis: string[]
          organizational_measures: string[] | null
          purposes: string[]
          recipient_categories: string[] | null
          retention_period: string
          safeguards: string | null
          special_categories: boolean | null
          technical_measures: string[] | null
          third_country_transfers: boolean | null
          updated_at: string | null
        }
        Insert: {
          activity_description: string
          activity_name: string
          created_at?: string | null
          data_categories: string[]
          data_subject_categories: string[]
          id?: string
          is_active?: boolean | null
          legal_basis: string[]
          organizational_measures?: string[] | null
          purposes: string[]
          recipient_categories?: string[] | null
          retention_period: string
          safeguards?: string | null
          special_categories?: boolean | null
          technical_measures?: string[] | null
          third_country_transfers?: boolean | null
          updated_at?: string | null
        }
        Update: {
          activity_description?: string
          activity_name?: string
          created_at?: string | null
          data_categories?: string[]
          data_subject_categories?: string[]
          id?: string
          is_active?: boolean | null
          legal_basis?: string[]
          organizational_measures?: string[] | null
          purposes?: string[]
          recipient_categories?: string[] | null
          retention_period?: string
          safeguards?: string | null
          special_categories?: boolean | null
          technical_measures?: string[] | null
          third_country_transfers?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      data_retention_policies: {
        Row: {
          auto_delete_enabled: boolean | null
          business_justification: string | null
          created_at: string | null
          deletion_conditions: Json | null
          effective_from: string | null
          effective_until: string | null
          entity_type: string
          id: string
          is_active: boolean | null
          legal_basis: string
          policy_name: string
          regulation_reference: string | null
          retention_period_years: number
          updated_at: string | null
        }
        Insert: {
          auto_delete_enabled?: boolean | null
          business_justification?: string | null
          created_at?: string | null
          deletion_conditions?: Json | null
          effective_from?: string | null
          effective_until?: string | null
          entity_type: string
          id?: string
          is_active?: boolean | null
          legal_basis: string
          policy_name: string
          regulation_reference?: string | null
          retention_period_years: number
          updated_at?: string | null
        }
        Update: {
          auto_delete_enabled?: boolean | null
          business_justification?: string | null
          created_at?: string | null
          deletion_conditions?: Json | null
          effective_from?: string | null
          effective_until?: string | null
          entity_type?: string
          id?: string
          is_active?: boolean | null
          legal_basis?: string
          policy_name?: string
          regulation_reference?: string | null
          retention_period_years?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      document_embeddings: {
        Row: {
          content_hash: string
          content_text: string
          content_type: string | null
          created_at: string | null
          document_category: string | null
          document_id: string | null
          embedding: string | null
          embedding_model: string | null
          id: string
          language: string | null
        }
        Insert: {
          content_hash: string
          content_text: string
          content_type?: string | null
          created_at?: string | null
          document_category?: string | null
          document_id?: string | null
          embedding?: string | null
          embedding_model?: string | null
          id?: string
          language?: string | null
        }
        Update: {
          content_hash?: string
          content_text?: string
          content_type?: string | null
          created_at?: string | null
          document_category?: string | null
          document_id?: string | null
          embedding?: string | null
          embedding_model?: string | null
          id?: string
          language?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "document_embeddings_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "document_registry"
            referencedColumns: ["id"]
          },
        ]
      }
      document_registry: {
        Row: {
          aufbewahrungspflicht: string | null
          created_at: string | null
          digital_signature: string | null
          document_id: string
          eingangsdatum: string
          file_hash: string
          file_size: number | null
          gdpr_processed: boolean | null
          gobd_compliant: boolean | null
          id: string
          immutable_record: Json | null
          integrity_hash: string | null
          loeschvormerkung: string | null
          mandant_id: string | null
          mandant_name: string | null
          manual_review_required: boolean | null
          original_filename: string
          processing_status: string | null
          updated_at: string | null
          upload_source: string | null
          verarbeitungsbeginn: string | null
          verarbeitungsende: string | null
        }
        Insert: {
          aufbewahrungspflicht?: string | null
          created_at?: string | null
          digital_signature?: string | null
          document_id: string
          eingangsdatum?: string
          file_hash: string
          file_size?: number | null
          gdpr_processed?: boolean | null
          gobd_compliant?: boolean | null
          id?: string
          immutable_record?: Json | null
          integrity_hash?: string | null
          loeschvormerkung?: string | null
          mandant_id?: string | null
          mandant_name?: string | null
          manual_review_required?: boolean | null
          original_filename: string
          processing_status?: string | null
          updated_at?: string | null
          upload_source?: string | null
          verarbeitungsbeginn?: string | null
          verarbeitungsende?: string | null
        }
        Update: {
          aufbewahrungspflicht?: string | null
          created_at?: string | null
          digital_signature?: string | null
          document_id?: string
          eingangsdatum?: string
          file_hash?: string
          file_size?: number | null
          gdpr_processed?: boolean | null
          gobd_compliant?: boolean | null
          id?: string
          immutable_record?: Json | null
          integrity_hash?: string | null
          loeschvormerkung?: string | null
          mandant_id?: string | null
          mandant_name?: string | null
          manual_review_required?: boolean | null
          original_filename?: string
          processing_status?: string | null
          updated_at?: string | null
          upload_source?: string | null
          verarbeitungsbeginn?: string | null
          verarbeitungsende?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "document_registry_mandant_id_fkey"
            columns: ["mandant_id"]
            isOneToOne: false
            referencedRelation: "mandant_public_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_registry_mandant_id_fkey"
            columns: ["mandant_id"]
            isOneToOne: false
            referencedRelation: "mandant_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_registry_mandant_id_fkey"
            columns: ["mandant_id"]
            isOneToOne: false
            referencedRelation: "mandants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_registry_mandant_id_fkey"
            columns: ["mandant_id"]
            isOneToOne: false
            referencedRelation: "v_agenda_mandants"
            referencedColumns: ["id"]
          },
        ]
      }
      dtvf_booking_lines: {
        Row: {
          additional_fields: Json | null
          approved_booking_id: string | null
          basis_umsatz: number | null
          belegdatum: string
          belegfeld1: string | null
          belegfeld2: string | null
          beleglink: string | null
          bu_schluessel: string | null
          buchungs_guid: string
          buchungstext: string | null
          created_at: string | null
          diverse_adressnummer: string | null
          eu_land_bestimmung: string | null
          eu_steuersatz_bestimmung: string | null
          export_batch_id: string | null
          gegenkonto: string
          geschaeftspartnerbank: string | null
          herkunft_kz: string | null
          id: string
          konto: string
          kost1_kostenstelle: string | null
          kost2_kostenstelle: string | null
          kurs: number | null
          line_number: number | null
          postensperre: string | null
          sachverhalt: string | null
          sepa_mandatsreferenz: string | null
          skonto: number | null
          soll_haben: string | null
          umsatz: number
          wkz_basis_umsatz: string | null
          wkz_umsatz: string | null
          zinssperre: string | null
        }
        Insert: {
          additional_fields?: Json | null
          approved_booking_id?: string | null
          basis_umsatz?: number | null
          belegdatum: string
          belegfeld1?: string | null
          belegfeld2?: string | null
          beleglink?: string | null
          bu_schluessel?: string | null
          buchungs_guid: string
          buchungstext?: string | null
          created_at?: string | null
          diverse_adressnummer?: string | null
          eu_land_bestimmung?: string | null
          eu_steuersatz_bestimmung?: string | null
          export_batch_id?: string | null
          gegenkonto: string
          geschaeftspartnerbank?: string | null
          herkunft_kz?: string | null
          id?: string
          konto: string
          kost1_kostenstelle?: string | null
          kost2_kostenstelle?: string | null
          kurs?: number | null
          line_number?: number | null
          postensperre?: string | null
          sachverhalt?: string | null
          sepa_mandatsreferenz?: string | null
          skonto?: number | null
          soll_haben?: string | null
          umsatz: number
          wkz_basis_umsatz?: string | null
          wkz_umsatz?: string | null
          zinssperre?: string | null
        }
        Update: {
          additional_fields?: Json | null
          approved_booking_id?: string | null
          basis_umsatz?: number | null
          belegdatum?: string
          belegfeld1?: string | null
          belegfeld2?: string | null
          beleglink?: string | null
          bu_schluessel?: string | null
          buchungs_guid?: string
          buchungstext?: string | null
          created_at?: string | null
          diverse_adressnummer?: string | null
          eu_land_bestimmung?: string | null
          eu_steuersatz_bestimmung?: string | null
          export_batch_id?: string | null
          gegenkonto?: string
          geschaeftspartnerbank?: string | null
          herkunft_kz?: string | null
          id?: string
          konto?: string
          kost1_kostenstelle?: string | null
          kost2_kostenstelle?: string | null
          kurs?: number | null
          line_number?: number | null
          postensperre?: string | null
          sachverhalt?: string | null
          sepa_mandatsreferenz?: string | null
          skonto?: number | null
          soll_haben?: string | null
          umsatz?: number
          wkz_basis_umsatz?: string | null
          wkz_umsatz?: string | null
          zinssperre?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dtvf_booking_lines_approved_booking_id_fkey"
            columns: ["approved_booking_id"]
            isOneToOne: false
            referencedRelation: "approved_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dtvf_booking_lines_export_batch_id_fkey"
            columns: ["export_batch_id"]
            isOneToOne: false
            referencedRelation: "dtvf_export_batches"
            referencedColumns: ["id"]
          },
        ]
      }
      dtvf_configurations: {
        Row: {
          advisor_number: number | null
          auto_export_enabled: boolean | null
          client_code: number | null
          config_name: string
          consultant_code: string | null
          created_at: string | null
          currency: string | null
          date_format: string | null
          decimal_separator: string | null
          encoding: string | null
          export_frequency: string | null
          id: string
          is_active: boolean | null
          last_export_date: string | null
          mandant_id: string | null
          require_complete_data: boolean | null
          updated_at: string | null
          validate_account_numbers: boolean | null
        }
        Insert: {
          advisor_number?: number | null
          auto_export_enabled?: boolean | null
          client_code?: number | null
          config_name: string
          consultant_code?: string | null
          created_at?: string | null
          currency?: string | null
          date_format?: string | null
          decimal_separator?: string | null
          encoding?: string | null
          export_frequency?: string | null
          id?: string
          is_active?: boolean | null
          last_export_date?: string | null
          mandant_id?: string | null
          require_complete_data?: boolean | null
          updated_at?: string | null
          validate_account_numbers?: boolean | null
        }
        Update: {
          advisor_number?: number | null
          auto_export_enabled?: boolean | null
          client_code?: number | null
          config_name?: string
          consultant_code?: string | null
          created_at?: string | null
          currency?: string | null
          date_format?: string | null
          decimal_separator?: string | null
          encoding?: string | null
          export_frequency?: string | null
          id?: string
          is_active?: boolean | null
          last_export_date?: string | null
          mandant_id?: string | null
          require_complete_data?: boolean | null
          updated_at?: string | null
          validate_account_numbers?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "dtvf_configurations_mandant_id_fkey"
            columns: ["mandant_id"]
            isOneToOne: false
            referencedRelation: "mandant_public_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dtvf_configurations_mandant_id_fkey"
            columns: ["mandant_id"]
            isOneToOne: false
            referencedRelation: "mandant_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dtvf_configurations_mandant_id_fkey"
            columns: ["mandant_id"]
            isOneToOne: false
            referencedRelation: "mandants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dtvf_configurations_mandant_id_fkey"
            columns: ["mandant_id"]
            isOneToOne: false
            referencedRelation: "v_agenda_mandants"
            referencedColumns: ["id"]
          },
        ]
      }
      dtvf_export_batches: {
        Row: {
          advisor_number: number | null
          batch_number: string
          client_code: number | null
          client_number: string | null
          consultant_code: string | null
          created_at: string | null
          currency: string | null
          data_category: number | null
          downloaded_at: string | null
          dtvf_version: number | null
          encoding: string | null
          export_status: string | null
          file_hash: string | null
          file_size: number | null
          filename: string
          generated_at: string | null
          id: string
          imported_at: string | null
          mime_type: string | null
          period_description: string | null
          period_from: string | null
          period_to: string | null
          software_origin: string | null
          storage_path: string | null
          storage_uploaded_at: string | null
          total_amount: number | null
          total_bookings: number | null
        }
        Insert: {
          advisor_number?: number | null
          batch_number: string
          client_code?: number | null
          client_number?: string | null
          consultant_code?: string | null
          created_at?: string | null
          currency?: string | null
          data_category?: number | null
          downloaded_at?: string | null
          dtvf_version?: number | null
          encoding?: string | null
          export_status?: string | null
          file_hash?: string | null
          file_size?: number | null
          filename: string
          generated_at?: string | null
          id?: string
          imported_at?: string | null
          mime_type?: string | null
          period_description?: string | null
          period_from?: string | null
          period_to?: string | null
          software_origin?: string | null
          storage_path?: string | null
          storage_uploaded_at?: string | null
          total_amount?: number | null
          total_bookings?: number | null
        }
        Update: {
          advisor_number?: number | null
          batch_number?: string
          client_code?: number | null
          client_number?: string | null
          consultant_code?: string | null
          created_at?: string | null
          currency?: string | null
          data_category?: number | null
          downloaded_at?: string | null
          dtvf_version?: number | null
          encoding?: string | null
          export_status?: string | null
          file_hash?: string | null
          file_size?: number | null
          filename?: string
          generated_at?: string | null
          id?: string
          imported_at?: string | null
          mime_type?: string | null
          period_description?: string | null
          period_from?: string | null
          period_to?: string | null
          software_origin?: string | null
          storage_path?: string | null
          storage_uploaded_at?: string | null
          total_amount?: number | null
          total_bookings?: number | null
        }
        Relationships: []
      }
      dtvf_import_history: {
        Row: {
          created_at: string | null
          error_log: Json | null
          failed_imports: number | null
          file_hash: string
          id: string
          import_completed_at: string | null
          import_filename: string
          import_source: string
          import_started_at: string | null
          import_status: string | null
          successful_imports: number | null
          total_lines_processed: number | null
          warnings: Json | null
        }
        Insert: {
          created_at?: string | null
          error_log?: Json | null
          failed_imports?: number | null
          file_hash: string
          id?: string
          import_completed_at?: string | null
          import_filename: string
          import_source: string
          import_started_at?: string | null
          import_status?: string | null
          successful_imports?: number | null
          total_lines_processed?: number | null
          warnings?: Json | null
        }
        Update: {
          created_at?: string | null
          error_log?: Json | null
          failed_imports?: number | null
          file_hash?: string
          id?: string
          import_completed_at?: string | null
          import_filename?: string
          import_source?: string
          import_started_at?: string | null
          import_status?: string | null
          successful_imports?: number | null
          total_lines_processed?: number | null
          warnings?: Json | null
        }
        Relationships: []
      }
      gdpr_data_subjects: {
        Row: {
          access_requests: number | null
          consent_date: string | null
          consent_withdrawn: boolean | null
          created_at: string | null
          data_categories_processed: string[] | null
          email_hash: string | null
          erasure_requests: number | null
          id: string
          last_request_date: string | null
          legal_basis: string[] | null
          processing_consent: boolean | null
          rectification_requests: number | null
          subject_reference_id: string | null
          subject_type: string | null
          updated_at: string | null
          withdrawal_date: string | null
        }
        Insert: {
          access_requests?: number | null
          consent_date?: string | null
          consent_withdrawn?: boolean | null
          created_at?: string | null
          data_categories_processed?: string[] | null
          email_hash?: string | null
          erasure_requests?: number | null
          id?: string
          last_request_date?: string | null
          legal_basis?: string[] | null
          processing_consent?: boolean | null
          rectification_requests?: number | null
          subject_reference_id?: string | null
          subject_type?: string | null
          updated_at?: string | null
          withdrawal_date?: string | null
        }
        Update: {
          access_requests?: number | null
          consent_date?: string | null
          consent_withdrawn?: boolean | null
          created_at?: string | null
          data_categories_processed?: string[] | null
          email_hash?: string | null
          erasure_requests?: number | null
          id?: string
          last_request_date?: string | null
          legal_basis?: string[] | null
          processing_consent?: boolean | null
          rectification_requests?: number | null
          subject_reference_id?: string | null
          subject_type?: string | null
          updated_at?: string | null
          withdrawal_date?: string | null
        }
        Relationships: []
      }
      knowledge_base: {
        Row: {
          account_type: string | null
          confidence_score: number | null
          content: Json
          created_at: string | null
          created_by: string
          description: string
          examples: Json | null
          id: string
          industry_sector: string | null
          is_active: boolean | null
          knowledge_type: string | null
          last_used: string | null
          mandant_id: string | null
          mandant_specific: boolean | null
          source_reference: string | null
          title: string
          updated_at: string | null
          usage_count: number | null
          verification_status: string | null
        }
        Insert: {
          account_type?: string | null
          confidence_score?: number | null
          content: Json
          created_at?: string | null
          created_by: string
          description: string
          examples?: Json | null
          id?: string
          industry_sector?: string | null
          is_active?: boolean | null
          knowledge_type?: string | null
          last_used?: string | null
          mandant_id?: string | null
          mandant_specific?: boolean | null
          source_reference?: string | null
          title: string
          updated_at?: string | null
          usage_count?: number | null
          verification_status?: string | null
        }
        Update: {
          account_type?: string | null
          confidence_score?: number | null
          content?: Json
          created_at?: string | null
          created_by?: string
          description?: string
          examples?: Json | null
          id?: string
          industry_sector?: string | null
          is_active?: boolean | null
          knowledge_type?: string | null
          last_used?: string | null
          mandant_id?: string | null
          mandant_specific?: boolean | null
          source_reference?: string | null
          title?: string
          updated_at?: string | null
          usage_count?: number | null
          verification_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_base_mandant_id_fkey"
            columns: ["mandant_id"]
            isOneToOne: false
            referencedRelation: "mandant_public_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "knowledge_base_mandant_id_fkey"
            columns: ["mandant_id"]
            isOneToOne: false
            referencedRelation: "mandant_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "knowledge_base_mandant_id_fkey"
            columns: ["mandant_id"]
            isOneToOne: false
            referencedRelation: "mandants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "knowledge_base_mandant_id_fkey"
            columns: ["mandant_id"]
            isOneToOne: false
            referencedRelation: "v_agenda_mandants"
            referencedColumns: ["id"]
          },
        ]
      }
      mandants: {
        Row: {
          adresszusatz: string | null
          agenda_adressattyp: string | null
          agenda_eu_ustid: string | null
          agenda_import_date: string | null
          agenda_import_raw: Json | null
          agenda_konto_nr: string | null
          agenda_last_sync: string | null
          angelegt: string | null
          anrede: string | null
          ansprechpartner: string | null
          auto_approval_threshold: number | null
          bankname: string | null
          bankname2: string | null
          bankname3: string | null
          bearbeiter: string | null
          bic: string | null
          bic2: string | null
          bic3: string | null
          created_at: string | null
          custom_field_1: string | null
          custom_field_2: string | null
          custom_field_3: string | null
          custom_field_4: string | null
          custom_field_5: string | null
          data_retention_years: number | null
          dtvf_export_enabled: boolean | null
          email: string | null
          fa_nr: string | null
          faelligkeit_tage: number | null
          fax: string | null
          finanzamt: string | null
          gdpr_consent_date: string | null
          geaendert: string | null
          geschaeftsfuehrer: string | null
          hrb_nr: string | null
          iban: string | null
          iban2: string | null
          iban3: string | null
          id: string
          internet: string | null
          kontenrahmen: string
          konto_nr: string | null
          kontoinhaber2: string | null
          kontoinhaber3: string | null
          kreditlimit: number | null
          kurzbezeichnung: string | null
          land: string | null
          mahnlimit_betrag: number | null
          mahnlimit_prozent: number | null
          mahnung: boolean | null
          mandant_nr: string
          mandantentyp: string
          name1: string
          name2: string | null
          ort: string
          plz: string | null
          postfach: string | null
          re_adresszusatz: string | null
          re_land: string | null
          re_ort: string | null
          re_plz: string | null
          re_postfach: string | null
          re_strasse: string | null
          re_versandzusatz: string | null
          rechtsform: string | null
          registergericht: string | null
          require_human_review: boolean | null
          sachbearbeiter: string | null
          skonto_prozent: number | null
          sprache: string | null
          status: string | null
          steuer_nr: string | null
          strasse: string | null
          telefon: string | null
          telefon_gl: string | null
          titel: string | null
          unternehmensgegenstand: string | null
          updated_at: string | null
          ust_idnr: string | null
          ust_zeitraum: string | null
          versandzusatz: string | null
          versteuerung: string
          vorname: string | null
          wj_beginn: string | null
          wj_ende: string | null
          zahlungsbedingung: string | null
        }
        Insert: {
          adresszusatz?: string | null
          agenda_adressattyp?: string | null
          agenda_eu_ustid?: string | null
          agenda_import_date?: string | null
          agenda_import_raw?: Json | null
          agenda_konto_nr?: string | null
          agenda_last_sync?: string | null
          angelegt?: string | null
          anrede?: string | null
          ansprechpartner?: string | null
          auto_approval_threshold?: number | null
          bankname?: string | null
          bankname2?: string | null
          bankname3?: string | null
          bearbeiter?: string | null
          bic?: string | null
          bic2?: string | null
          bic3?: string | null
          created_at?: string | null
          custom_field_1?: string | null
          custom_field_2?: string | null
          custom_field_3?: string | null
          custom_field_4?: string | null
          custom_field_5?: string | null
          data_retention_years?: number | null
          dtvf_export_enabled?: boolean | null
          email?: string | null
          fa_nr?: string | null
          faelligkeit_tage?: number | null
          fax?: string | null
          finanzamt?: string | null
          gdpr_consent_date?: string | null
          geaendert?: string | null
          geschaeftsfuehrer?: string | null
          hrb_nr?: string | null
          iban?: string | null
          iban2?: string | null
          iban3?: string | null
          id?: string
          internet?: string | null
          kontenrahmen: string
          konto_nr?: string | null
          kontoinhaber2?: string | null
          kontoinhaber3?: string | null
          kreditlimit?: number | null
          kurzbezeichnung?: string | null
          land?: string | null
          mahnlimit_betrag?: number | null
          mahnlimit_prozent?: number | null
          mahnung?: boolean | null
          mandant_nr: string
          mandantentyp: string
          name1: string
          name2?: string | null
          ort: string
          plz?: string | null
          postfach?: string | null
          re_adresszusatz?: string | null
          re_land?: string | null
          re_ort?: string | null
          re_plz?: string | null
          re_postfach?: string | null
          re_strasse?: string | null
          re_versandzusatz?: string | null
          rechtsform?: string | null
          registergericht?: string | null
          require_human_review?: boolean | null
          sachbearbeiter?: string | null
          skonto_prozent?: number | null
          sprache?: string | null
          status?: string | null
          steuer_nr?: string | null
          strasse?: string | null
          telefon?: string | null
          telefon_gl?: string | null
          titel?: string | null
          unternehmensgegenstand?: string | null
          updated_at?: string | null
          ust_idnr?: string | null
          ust_zeitraum?: string | null
          versandzusatz?: string | null
          versteuerung: string
          vorname?: string | null
          wj_beginn?: string | null
          wj_ende?: string | null
          zahlungsbedingung?: string | null
        }
        Update: {
          adresszusatz?: string | null
          agenda_adressattyp?: string | null
          agenda_eu_ustid?: string | null
          agenda_import_date?: string | null
          agenda_import_raw?: Json | null
          agenda_konto_nr?: string | null
          agenda_last_sync?: string | null
          angelegt?: string | null
          anrede?: string | null
          ansprechpartner?: string | null
          auto_approval_threshold?: number | null
          bankname?: string | null
          bankname2?: string | null
          bankname3?: string | null
          bearbeiter?: string | null
          bic?: string | null
          bic2?: string | null
          bic3?: string | null
          created_at?: string | null
          custom_field_1?: string | null
          custom_field_2?: string | null
          custom_field_3?: string | null
          custom_field_4?: string | null
          custom_field_5?: string | null
          data_retention_years?: number | null
          dtvf_export_enabled?: boolean | null
          email?: string | null
          fa_nr?: string | null
          faelligkeit_tage?: number | null
          fax?: string | null
          finanzamt?: string | null
          gdpr_consent_date?: string | null
          geaendert?: string | null
          geschaeftsfuehrer?: string | null
          hrb_nr?: string | null
          iban?: string | null
          iban2?: string | null
          iban3?: string | null
          id?: string
          internet?: string | null
          kontenrahmen?: string
          konto_nr?: string | null
          kontoinhaber2?: string | null
          kontoinhaber3?: string | null
          kreditlimit?: number | null
          kurzbezeichnung?: string | null
          land?: string | null
          mahnlimit_betrag?: number | null
          mahnlimit_prozent?: number | null
          mahnung?: boolean | null
          mandant_nr?: string
          mandantentyp?: string
          name1?: string
          name2?: string | null
          ort?: string
          plz?: string | null
          postfach?: string | null
          re_adresszusatz?: string | null
          re_land?: string | null
          re_ort?: string | null
          re_plz?: string | null
          re_postfach?: string | null
          re_strasse?: string | null
          re_versandzusatz?: string | null
          rechtsform?: string | null
          registergericht?: string | null
          require_human_review?: boolean | null
          sachbearbeiter?: string | null
          skonto_prozent?: number | null
          sprache?: string | null
          status?: string | null
          steuer_nr?: string | null
          strasse?: string | null
          telefon?: string | null
          telefon_gl?: string | null
          titel?: string | null
          unternehmensgegenstand?: string | null
          updated_at?: string | null
          ust_idnr?: string | null
          ust_zeitraum?: string | null
          versandzusatz?: string | null
          versteuerung?: string
          vorname?: string | null
          wj_beginn?: string | null
          wj_ende?: string | null
          zahlungsbedingung?: string | null
        }
        Relationships: []
      }
      ocr_results: {
        Row: {
          confidence_score: number | null
          created_at: string | null
          document_id: string | null
          extracted_text: string
          id: string
          issues_detected: string[] | null
          language_detected: string | null
          ocr_provider: string | null
          pages_processed: number | null
          processing_time_ms: number | null
          raw_response: Json | null
          text_quality: string | null
        }
        Insert: {
          confidence_score?: number | null
          created_at?: string | null
          document_id?: string | null
          extracted_text: string
          id?: string
          issues_detected?: string[] | null
          language_detected?: string | null
          ocr_provider?: string | null
          pages_processed?: number | null
          processing_time_ms?: number | null
          raw_response?: Json | null
          text_quality?: string | null
        }
        Update: {
          confidence_score?: number | null
          created_at?: string | null
          document_id?: string | null
          extracted_text?: string
          id?: string
          issues_detected?: string[] | null
          language_detected?: string | null
          ocr_provider?: string | null
          pages_processed?: number | null
          processing_time_ms?: number | null
          raw_response?: Json | null
          text_quality?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ocr_results_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "document_registry"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string
          email: string | null
          first_name: string | null
          id: string
          is_active: boolean | null
          last_name: string | null
          pending_since: string | null
          rejection_reason: string | null
          role: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          email?: string | null
          first_name?: string | null
          id: string
          is_active?: boolean | null
          last_name?: string | null
          pending_since?: string | null
          rejection_reason?: string | null
          role?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          email?: string | null
          first_name?: string | null
          id?: string
          is_active?: boolean | null
          last_name?: string | null
          pending_since?: string | null
          rejection_reason?: string | null
          role?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "admin_user_management"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      system_health: {
        Row: {
          created_at: string | null
          details: Json | null
          id: string
          measured_at: string | null
          metric_name: string
          metric_unit: string | null
          metric_value: number | null
          status: string | null
        }
        Insert: {
          created_at?: string | null
          details?: Json | null
          id?: string
          measured_at?: string | null
          metric_name: string
          metric_unit?: string | null
          metric_value?: number | null
          status?: string | null
        }
        Update: {
          created_at?: string | null
          details?: Json | null
          id?: string
          measured_at?: string | null
          metric_name?: string
          metric_unit?: string | null
          metric_value?: number | null
          status?: string | null
        }
        Relationships: []
      }
      tax_calculations: {
        Row: {
          calculation_type: string | null
          created_at: string | null
          filing_status: string | null
          id: number
          input_data: Json
          results: Json
          session_id: string | null
          tax_year: number | null
        }
        Insert: {
          calculation_type?: string | null
          created_at?: string | null
          filing_status?: string | null
          id?: number
          input_data: Json
          results: Json
          session_id?: string | null
          tax_year?: number | null
        }
        Update: {
          calculation_type?: string | null
          created_at?: string | null
          filing_status?: string | null
          id?: number
          input_data?: Json
          results?: Json
          session_id?: string | null
          tax_year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "tax_calculations_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "tax_session_summary"
            referencedColumns: ["session_id"]
          },
          {
            foreignKeyName: "tax_calculations_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "tax_sessions"
            referencedColumns: ["session_id"]
          },
        ]
      }
      tax_documents: {
        Row: {
          confidence_score: number | null
          created_at: string | null
          document_type: string | null
          extracted_data: Json | null
          file_name: string | null
          file_size: number | null
          id: number
          ocr_text: string | null
          processing_status: string | null
          session_id: string | null
        }
        Insert: {
          confidence_score?: number | null
          created_at?: string | null
          document_type?: string | null
          extracted_data?: Json | null
          file_name?: string | null
          file_size?: number | null
          id?: number
          ocr_text?: string | null
          processing_status?: string | null
          session_id?: string | null
        }
        Update: {
          confidence_score?: number | null
          created_at?: string | null
          document_type?: string | null
          extracted_data?: Json | null
          file_name?: string | null
          file_size?: number | null
          id?: number
          ocr_text?: string | null
          processing_status?: string | null
          session_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tax_documents_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "tax_session_summary"
            referencedColumns: ["session_id"]
          },
          {
            foreignKeyName: "tax_documents_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "tax_sessions"
            referencedColumns: ["session_id"]
          },
        ]
      }
      tax_knowledge_base: {
        Row: {
          category: string | null
          content: string
          created_at: string | null
          document_type: string | null
          id: number
          keywords: string[] | null
          last_updated: string | null
          relevance_score: number | null
          search_vector: unknown | null
          source_url: string | null
          subcategory: string | null
          tax_year: number | null
          title: string
        }
        Insert: {
          category?: string | null
          content: string
          created_at?: string | null
          document_type?: string | null
          id?: number
          keywords?: string[] | null
          last_updated?: string | null
          relevance_score?: number | null
          search_vector?: unknown | null
          source_url?: string | null
          subcategory?: string | null
          tax_year?: number | null
          title: string
        }
        Update: {
          category?: string | null
          content?: string
          created_at?: string | null
          document_type?: string | null
          id?: number
          keywords?: string[] | null
          last_updated?: string | null
          relevance_score?: number | null
          search_vector?: unknown | null
          source_url?: string | null
          subcategory?: string | null
          tax_year?: number | null
          title?: string
        }
        Relationships: []
      }
      tax_responses: {
        Row: {
          confidence_score: number | null
          created_at: string | null
          id: number
          model_used: string | null
          processing_time_ms: number | null
          query: string
          response: Json
          session_id: string | null
        }
        Insert: {
          confidence_score?: number | null
          created_at?: string | null
          id?: number
          model_used?: string | null
          processing_time_ms?: number | null
          query: string
          response: Json
          session_id?: string | null
        }
        Update: {
          confidence_score?: number | null
          created_at?: string | null
          id?: number
          model_used?: string | null
          processing_time_ms?: number | null
          query?: string
          response?: Json
          session_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tax_responses_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "tax_session_summary"
            referencedColumns: ["session_id"]
          },
          {
            foreignKeyName: "tax_responses_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "tax_sessions"
            referencedColumns: ["session_id"]
          },
        ]
      }
      tax_sessions: {
        Row: {
          created_at: string | null
          id: number
          locale: string | null
          query: string
          session_id: string
          status: string | null
          updated_at: string | null
          user_context: Json | null
        }
        Insert: {
          created_at?: string | null
          id?: number
          locale?: string | null
          query: string
          session_id: string
          status?: string | null
          updated_at?: string | null
          user_context?: Json | null
        }
        Update: {
          created_at?: string | null
          id?: number
          locale?: string | null
          query?: string
          session_id?: string
          status?: string | null
          updated_at?: string | null
          user_context?: Json | null
        }
        Relationships: []
      }
      user_mandant_assignments: {
        Row: {
          access_level: string | null
          assigned_at: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          mandant_id: string | null
          user_id: string
        }
        Insert: {
          access_level?: string | null
          assigned_at?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          mandant_id?: string | null
          user_id: string
        }
        Update: {
          access_level?: string | null
          assigned_at?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          mandant_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_mandant_assignments_mandant_id_fkey"
            columns: ["mandant_id"]
            isOneToOne: false
            referencedRelation: "mandant_public_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_mandant_assignments_mandant_id_fkey"
            columns: ["mandant_id"]
            isOneToOne: false
            referencedRelation: "mandant_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_mandant_assignments_mandant_id_fkey"
            columns: ["mandant_id"]
            isOneToOne: false
            referencedRelation: "mandants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_mandant_assignments_mandant_id_fkey"
            columns: ["mandant_id"]
            isOneToOne: false
            referencedRelation: "v_agenda_mandants"
            referencedColumns: ["id"]
          },
        ]
      }
      user_preferences: {
        Row: {
          country: string | null
          created_at: string | null
          filing_status: string | null
          id: number
          notification_settings: Json | null
          preferred_language: string | null
          state: string | null
          tax_year: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          country?: string | null
          created_at?: string | null
          filing_status?: string | null
          id?: number
          notification_settings?: Json | null
          preferred_language?: string | null
          state?: string | null
          tax_year?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          country?: string | null
          created_at?: string | null
          filing_status?: string | null
          id?: number
          notification_settings?: Json | null
          preferred_language?: string | null
          state?: string | null
          tax_year?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      workflow_configurations: {
        Row: {
          access_level: string | null
          config_key: string
          config_type: string | null
          config_value: Json
          created_at: string | null
          description: string | null
          id: string
          is_sensitive: boolean | null
          previous_value: Json | null
          updated_at: string | null
          version: number | null
        }
        Insert: {
          access_level?: string | null
          config_key: string
          config_type?: string | null
          config_value: Json
          created_at?: string | null
          description?: string | null
          id?: string
          is_sensitive?: boolean | null
          previous_value?: Json | null
          updated_at?: string | null
          version?: number | null
        }
        Update: {
          access_level?: string | null
          config_key?: string
          config_type?: string | null
          config_value?: Json
          created_at?: string | null
          description?: string | null
          id?: string
          is_sensitive?: boolean | null
          previous_value?: Json | null
          updated_at?: string | null
          version?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      admin_user_management: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          approved_by_email: string | null
          created_at: string | null
          email: string | null
          first_name: string | null
          id: string | null
          is_active: boolean | null
          last_name: string | null
          pending_since: string | null
          rejection_reason: string | null
          role: string | null
          status: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "admin_user_management"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      mandant_public_view: {
        Row: {
          created_at: string | null
          id: string | null
          kontenrahmen: string | null
          land: string | null
          mandant_nr: string | null
          mandantentyp: string | null
          name1: string | null
          name2: string | null
          ort: string | null
          plz: string | null
          rechtsform: string | null
          status: string | null
          strasse: string | null
          telefon: string | null
          updated_at: string | null
          versteuerung: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string | null
          kontenrahmen?: string | null
          land?: string | null
          mandant_nr?: string | null
          mandantentyp?: string | null
          name1?: string | null
          name2?: string | null
          ort?: string | null
          plz?: string | null
          rechtsform?: string | null
          status?: string | null
          strasse?: string | null
          telefon?: string | null
          updated_at?: string | null
          versteuerung?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string | null
          kontenrahmen?: string | null
          land?: string | null
          mandant_nr?: string | null
          mandantentyp?: string | null
          name1?: string | null
          name2?: string | null
          ort?: string | null
          plz?: string | null
          rechtsform?: string | null
          status?: string | null
          strasse?: string | null
          telefon?: string | null
          updated_at?: string | null
          versteuerung?: string | null
        }
        Relationships: []
      }
      mandant_summary: {
        Row: {
          approved_documents: number | null
          id: string | null
          kontenrahmen: string | null
          mandant_nr: string | null
          name1: string | null
          ort: string | null
          status: string | null
          total_amount: number | null
          total_bookings: number | null
          total_documents: number | null
        }
        Relationships: []
      }
      performance_metrics: {
        Row: {
          avg_confidence: number | null
          avg_processing_time: number | null
          high_confidence_responses: number | null
          hour: string | null
          total_requests: number | null
        }
        Relationships: []
      }
      processing_pipeline_status: {
        Row: {
          avg_age_hours: number | null
          document_count: number | null
          processing_status: string | null
        }
        Relationships: []
      }
      tax_session_summary: {
        Row: {
          calculation_count: number | null
          confidence_score: number | null
          created_at: string | null
          document_count: number | null
          model_used: string | null
          query: string | null
          session_id: string | null
          status: string | null
        }
        Relationships: []
      }
      v_agenda_mandants: {
        Row: {
          adressattyp: string | null
          adressattyp_text: string | null
          agenda_import_date: string | null
          agenda_last_sync: string | null
          anrede: string | null
          bankname: string | null
          bic: string | null
          email: string | null
          iban: string | null
          id: string | null
          internet: string | null
          kontenrahmen: string | null
          konto: string | null
          kurzbezeichnung: string | null
          land: string | null
          mandant_nr: string | null
          name1: string | null
          ort: string | null
          plz: string | null
          postfach: string | null
          status: string | null
          steuer_nr: string | null
          strasse: string | null
          telefon: string | null
          titel: string | null
          unternehmensgegenstand: string | null
          ust_idnr: string | null
          ust_zeitraum: string | null
          versteuerung: string | null
          vorname: string | null
        }
        Insert: {
          adressattyp?: string | null
          adressattyp_text?: never
          agenda_import_date?: string | null
          agenda_last_sync?: string | null
          anrede?: string | null
          bankname?: string | null
          bic?: string | null
          email?: string | null
          iban?: string | null
          id?: string | null
          internet?: string | null
          kontenrahmen?: string | null
          konto?: string | null
          kurzbezeichnung?: string | null
          land?: string | null
          mandant_nr?: string | null
          name1?: string | null
          ort?: string | null
          plz?: string | null
          postfach?: string | null
          status?: string | null
          steuer_nr?: string | null
          strasse?: string | null
          telefon?: string | null
          titel?: string | null
          unternehmensgegenstand?: string | null
          ust_idnr?: string | null
          ust_zeitraum?: string | null
          versteuerung?: string | null
          vorname?: string | null
        }
        Update: {
          adressattyp?: string | null
          adressattyp_text?: never
          agenda_import_date?: string | null
          agenda_last_sync?: string | null
          anrede?: string | null
          bankname?: string | null
          bic?: string | null
          email?: string | null
          iban?: string | null
          id?: string | null
          internet?: string | null
          kontenrahmen?: string | null
          konto?: string | null
          kurzbezeichnung?: string | null
          land?: string | null
          mandant_nr?: string | null
          name1?: string | null
          ort?: string | null
          plz?: string | null
          postfach?: string | null
          status?: string | null
          steuer_nr?: string | null
          strasse?: string | null
          telefon?: string | null
          titel?: string | null
          unternehmensgegenstand?: string | null
          ust_idnr?: string | null
          ust_zeitraum?: string | null
          versteuerung?: string | null
          vorname?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      approve_user: {
        Args: { p_approved_by: string; p_user_id: string }
        Returns: undefined
      }
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_mandantenstammdaten: {
        Args: Record<PropertyKey, never>
        Returns: {
          mandant_nr: string
          name1: string
        }[]
      }
      get_user_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      gtrgm_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_decompress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_options: {
        Args: { "": unknown }
        Returns: undefined
      }
      gtrgm_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      import_agenda_mandants: {
        Args: {
          p_adressattyp: string
          p_anrede: string
          p_bankname: string
          p_bic: string
          p_email: string
          p_eu_land: string
          p_eu_ustid: string
          p_iban: string
          p_internet: string
          p_kontenrahmen?: string
          p_konto: string
          p_kurzbezeichnung: string
          p_land: string
          p_name_keine_angabe: string
          p_name_person: string
          p_name_unternehmen: string
          p_ort: string
          p_plz: string
          p_postfach: string
          p_steuernummer: string
          p_strasse: string
          p_telefon: string
          p_titel: string
          p_unternehmensgegenstand: string
          p_vorname_person: string
        }
        Returns: string
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      log_audit_event: {
        Args: {
          p_action: string
          p_details?: Json
          p_ip_address?: unknown
          p_session_id: string
          p_user_agent?: string
          p_user_id: string
        }
        Returns: undefined
      }
      log_security_event: {
        Args: { details?: string; event_type: string }
        Returns: undefined
      }
      log_sensitive_data_access: {
        Args: {
          p_operation: string
          p_record_id?: string
          p_table_name: string
        }
        Returns: undefined
      }
      reject_user: {
        Args: { p_reason?: string; p_rejected_by: string; p_user_id: string }
        Returns: undefined
      }
      search_tax_knowledge: {
        Args: { limit_results?: number; search_query: string }
        Returns: {
          category: string
          content: string
          id: number
          relevance_score: number
          title: string
          ts_rank_score: number
        }[]
      }
      set_limit: {
        Args: { "": number }
        Returns: number
      }
      show_limit: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      show_trgm: {
        Args: { "": string }
        Returns: string[]
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
