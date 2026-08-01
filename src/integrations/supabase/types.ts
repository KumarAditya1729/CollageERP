export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.15";
  };
  public: {
    Tables: {
      academic_sessions: {
        Row: {
          academic_year_id: string;
          created_at: string;
          created_by: string | null;
          deleted_at: string | null;
          deleted_by: string | null;
          end_date: string;
          id: string;
          is_current: boolean;
          name: string;
          start_date: string;
          tenant_id: string;
          term_number: number;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          academic_year_id: string;
          created_at?: string;
          created_by?: string | null;
          deleted_at?: string | null;
          deleted_by?: string | null;
          end_date: string;
          id?: string;
          is_current?: boolean;
          name: string;
          start_date: string;
          tenant_id: string;
          term_number?: number;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          academic_year_id?: string;
          created_at?: string;
          created_by?: string | null;
          deleted_at?: string | null;
          deleted_by?: string | null;
          end_date?: string;
          id?: string;
          is_current?: boolean;
          name?: string;
          start_date?: string;
          tenant_id?: string;
          term_number?: number;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "academic_sessions_academic_year_id_fkey";
            columns: ["academic_year_id"];
            isOneToOne: false;
            referencedRelation: "academic_years";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "academic_sessions_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      academic_years: {
        Row: {
          created_at: string;
          created_by: string | null;
          deleted_at: string | null;
          deleted_by: string | null;
          end_date: string;
          id: string;
          is_closed: boolean;
          is_current: boolean;
          name: string;
          start_date: string;
          tenant_id: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          deleted_at?: string | null;
          deleted_by?: string | null;
          end_date: string;
          id?: string;
          is_closed?: boolean;
          is_current?: boolean;
          name: string;
          start_date: string;
          tenant_id: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          deleted_at?: string | null;
          deleted_by?: string | null;
          end_date?: string;
          id?: string;
          is_closed?: boolean;
          is_current?: boolean;
          name?: string;
          start_date?: string;
          tenant_id?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "academic_years_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      activity_feed: {
        Row: {
          actor_id: string | null;
          audience_roles: string[];
          audience_users: string[];
          campus_id: string | null;
          created_at: string;
          data: Json;
          entity_id: string | null;
          entity_type: string | null;
          id: string;
          is_public: boolean;
          module: string | null;
          summary: string;
          tenant_id: string;
          verb: string;
        };
        Insert: {
          actor_id?: string | null;
          audience_roles?: string[];
          audience_users?: string[];
          campus_id?: string | null;
          created_at?: string;
          data?: Json;
          entity_id?: string | null;
          entity_type?: string | null;
          id?: string;
          is_public?: boolean;
          module?: string | null;
          summary: string;
          tenant_id: string;
          verb: string;
        };
        Update: {
          actor_id?: string | null;
          audience_roles?: string[];
          audience_users?: string[];
          campus_id?: string | null;
          created_at?: string;
          data?: Json;
          entity_id?: string | null;
          entity_type?: string | null;
          id?: string;
          is_public?: boolean;
          module?: string | null;
          summary?: string;
          tenant_id?: string;
          verb?: string;
        };
        Relationships: [
          {
            foreignKeyName: "activity_feed_campus_id_fkey";
            columns: ["campus_id"];
            isOneToOne: false;
            referencedRelation: "campuses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "activity_feed_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      ai_conversations: {
        Row: {
          context_id: string | null;
          context_type: string | null;
          created_at: string;
          deleted_at: string | null;
          deleted_by: string | null;
          id: string;
          is_archived: boolean;
          model: string | null;
          tenant_id: string;
          title: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          context_id?: string | null;
          context_type?: string | null;
          created_at?: string;
          deleted_at?: string | null;
          deleted_by?: string | null;
          id?: string;
          is_archived?: boolean;
          model?: string | null;
          tenant_id: string;
          title?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          context_id?: string | null;
          context_type?: string | null;
          created_at?: string;
          deleted_at?: string | null;
          deleted_by?: string | null;
          id?: string;
          is_archived?: boolean;
          model?: string | null;
          tenant_id?: string;
          title?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "ai_conversations_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      ai_insights: {
        Row: {
          confidence: number | null;
          created_at: string;
          entity_id: string;
          entity_type: string;
          explanation: Json;
          id: string;
          insight_type: string;
          model: string | null;
          recommended_actions: Json;
          score: number | null;
          severity: string | null;
          summary: string | null;
          tenant_id: string;
          title: string;
          updated_at: string;
          valid_until: string | null;
        };
        Insert: {
          confidence?: number | null;
          created_at?: string;
          entity_id: string;
          entity_type: string;
          explanation?: Json;
          id?: string;
          insight_type: string;
          model?: string | null;
          recommended_actions?: Json;
          score?: number | null;
          severity?: string | null;
          summary?: string | null;
          tenant_id: string;
          title: string;
          updated_at?: string;
          valid_until?: string | null;
        };
        Update: {
          confidence?: number | null;
          created_at?: string;
          entity_id?: string;
          entity_type?: string;
          explanation?: Json;
          id?: string;
          insight_type?: string;
          model?: string | null;
          recommended_actions?: Json;
          score?: number | null;
          severity?: string | null;
          summary?: string | null;
          tenant_id?: string;
          title?: string;
          updated_at?: string;
          valid_until?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "ai_insights_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      ai_jobs: {
        Row: {
          created_at: string;
          error: string | null;
          finished_at: string | null;
          id: string;
          input: Json;
          kind: Database["public"]["Enums"]["ai_job_kind"];
          model: string | null;
          output: Json | null;
          prompt_id: string | null;
          requested_by: string | null;
          started_at: string | null;
          status: Database["public"]["Enums"]["job_status"];
          tenant_id: string;
          tokens_used: number | null;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          error?: string | null;
          finished_at?: string | null;
          id?: string;
          input?: Json;
          kind: Database["public"]["Enums"]["ai_job_kind"];
          model?: string | null;
          output?: Json | null;
          prompt_id?: string | null;
          requested_by?: string | null;
          started_at?: string | null;
          status?: Database["public"]["Enums"]["job_status"];
          tenant_id: string;
          tokens_used?: number | null;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          error?: string | null;
          finished_at?: string | null;
          id?: string;
          input?: Json;
          kind?: Database["public"]["Enums"]["ai_job_kind"];
          model?: string | null;
          output?: Json | null;
          prompt_id?: string | null;
          requested_by?: string | null;
          started_at?: string | null;
          status?: Database["public"]["Enums"]["job_status"];
          tenant_id?: string;
          tokens_used?: number | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "ai_jobs_prompt_id_fkey";
            columns: ["prompt_id"];
            isOneToOne: false;
            referencedRelation: "ai_prompts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ai_jobs_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      ai_messages: {
        Row: {
          content: string;
          conversation_id: string;
          created_at: string;
          id: string;
          model: string | null;
          parts: Json | null;
          role: string;
          tenant_id: string;
          tokens_used: number | null;
        };
        Insert: {
          content: string;
          conversation_id: string;
          created_at?: string;
          id?: string;
          model?: string | null;
          parts?: Json | null;
          role: string;
          tenant_id: string;
          tokens_used?: number | null;
        };
        Update: {
          content?: string;
          conversation_id?: string;
          created_at?: string;
          id?: string;
          model?: string | null;
          parts?: Json | null;
          role?: string;
          tenant_id?: string;
          tokens_used?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "ai_messages_conversation_id_fkey";
            columns: ["conversation_id"];
            isOneToOne: false;
            referencedRelation: "ai_conversations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ai_messages_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      ai_prompts: {
        Row: {
          created_at: string;
          created_by: string | null;
          id: string;
          is_active: boolean;
          key: string;
          kind: Database["public"]["Enums"]["ai_job_kind"];
          model: string | null;
          name: string;
          system_prompt: string | null;
          temperature: number;
          tenant_id: string | null;
          updated_at: string;
          user_template: string | null;
          variables: Json;
          version: number;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          id?: string;
          is_active?: boolean;
          key: string;
          kind?: Database["public"]["Enums"]["ai_job_kind"];
          model?: string | null;
          name: string;
          system_prompt?: string | null;
          temperature?: number;
          tenant_id?: string | null;
          updated_at?: string;
          user_template?: string | null;
          variables?: Json;
          version?: number;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          id?: string;
          is_active?: boolean;
          key?: string;
          kind?: Database["public"]["Enums"]["ai_job_kind"];
          model?: string | null;
          name?: string;
          system_prompt?: string | null;
          temperature?: number;
          tenant_id?: string | null;
          updated_at?: string;
          user_template?: string | null;
          variables?: Json;
          version?: number;
        };
        Relationships: [
          {
            foreignKeyName: "ai_prompts_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      api_clients: {
        Row: {
          created_at: string;
          created_by: string | null;
          deleted_at: string | null;
          deleted_by: string | null;
          description: string | null;
          expires_at: string | null;
          id: string;
          is_active: boolean;
          key_hash: string;
          key_prefix: string;
          last_used_at: string | null;
          name: string;
          rate_limit_per_minute: number;
          scopes: string[];
          tenant_id: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          deleted_at?: string | null;
          deleted_by?: string | null;
          description?: string | null;
          expires_at?: string | null;
          id?: string;
          is_active?: boolean;
          key_hash: string;
          key_prefix: string;
          last_used_at?: string | null;
          name: string;
          rate_limit_per_minute?: number;
          scopes?: string[];
          tenant_id: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          deleted_at?: string | null;
          deleted_by?: string | null;
          description?: string | null;
          expires_at?: string | null;
          id?: string;
          is_active?: boolean;
          key_hash?: string;
          key_prefix?: string;
          last_used_at?: string | null;
          name?: string;
          rate_limit_per_minute?: number;
          scopes?: string[];
          tenant_id?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "api_clients_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      api_request_logs: {
        Row: {
          api_client_id: string | null;
          created_at: string;
          duration_ms: number | null;
          error: string | null;
          id: string;
          ip_address: unknown;
          method: string;
          path: string;
          status_code: number | null;
          tenant_id: string | null;
          user_agent: string | null;
        };
        Insert: {
          api_client_id?: string | null;
          created_at?: string;
          duration_ms?: number | null;
          error?: string | null;
          id?: string;
          ip_address?: unknown;
          method: string;
          path: string;
          status_code?: number | null;
          tenant_id?: string | null;
          user_agent?: string | null;
        };
        Update: {
          api_client_id?: string | null;
          created_at?: string;
          duration_ms?: number | null;
          error?: string | null;
          id?: string;
          ip_address?: unknown;
          method?: string;
          path?: string;
          status_code?: number | null;
          tenant_id?: string | null;
          user_agent?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "api_request_logs_api_client_id_fkey";
            columns: ["api_client_id"];
            isOneToOne: false;
            referencedRelation: "api_clients";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "api_request_logs_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      assessment_types: {
        Row: {
          allows_grace: boolean;
          category: Database["public"]["Enums"]["assessment_category"];
          created_at: string;
          created_by: string | null;
          default_max_marks: number;
          default_weightage: number;
          deleted_at: string | null;
          deleted_by: string | null;
          description: string | null;
          id: string;
          is_active: boolean;
          is_credit_linked: boolean;
          is_internal: boolean;
          key: string;
          metadata: Json;
          name: string;
          passing_percentage: number;
          requires_approval: boolean;
          sort_order: number;
          tenant_id: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          allows_grace?: boolean;
          category?: Database["public"]["Enums"]["assessment_category"];
          created_at?: string;
          created_by?: string | null;
          default_max_marks?: number;
          default_weightage?: number;
          deleted_at?: string | null;
          deleted_by?: string | null;
          description?: string | null;
          id?: string;
          is_active?: boolean;
          is_credit_linked?: boolean;
          is_internal?: boolean;
          key: string;
          metadata?: Json;
          name: string;
          passing_percentage?: number;
          requires_approval?: boolean;
          sort_order?: number;
          tenant_id: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          allows_grace?: boolean;
          category?: Database["public"]["Enums"]["assessment_category"];
          created_at?: string;
          created_by?: string | null;
          default_max_marks?: number;
          default_weightage?: number;
          deleted_at?: string | null;
          deleted_by?: string | null;
          description?: string | null;
          id?: string;
          is_active?: boolean;
          is_credit_linked?: boolean;
          is_internal?: boolean;
          key?: string;
          metadata?: Json;
          name?: string;
          passing_percentage?: number;
          requires_approval?: boolean;
          sort_order?: number;
          tenant_id?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "assessment_types_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      assessments: {
        Row: {
          academic_session_id: string | null;
          assessment_type_id: string | null;
          campus_id: string | null;
          course_id: string | null;
          created_at: string;
          created_by: string | null;
          deleted_at: string | null;
          deleted_by: string | null;
          description: string | null;
          due_on: string | null;
          faculty_id: string | null;
          id: string;
          is_published: boolean;
          max_marks: number;
          metadata: Json;
          passing_marks: number | null;
          rubric_id: string | null;
          scheduled_on: string | null;
          section_id: string | null;
          semester_id: string | null;
          status: Database["public"]["Enums"]["mark_status"];
          tenant_id: string;
          title: string;
          updated_at: string;
          updated_by: string | null;
          weightage: number;
        };
        Insert: {
          academic_session_id?: string | null;
          assessment_type_id?: string | null;
          campus_id?: string | null;
          course_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          deleted_at?: string | null;
          deleted_by?: string | null;
          description?: string | null;
          due_on?: string | null;
          faculty_id?: string | null;
          id?: string;
          is_published?: boolean;
          max_marks?: number;
          metadata?: Json;
          passing_marks?: number | null;
          rubric_id?: string | null;
          scheduled_on?: string | null;
          section_id?: string | null;
          semester_id?: string | null;
          status?: Database["public"]["Enums"]["mark_status"];
          tenant_id: string;
          title: string;
          updated_at?: string;
          updated_by?: string | null;
          weightage?: number;
        };
        Update: {
          academic_session_id?: string | null;
          assessment_type_id?: string | null;
          campus_id?: string | null;
          course_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          deleted_at?: string | null;
          deleted_by?: string | null;
          description?: string | null;
          due_on?: string | null;
          faculty_id?: string | null;
          id?: string;
          is_published?: boolean;
          max_marks?: number;
          metadata?: Json;
          passing_marks?: number | null;
          rubric_id?: string | null;
          scheduled_on?: string | null;
          section_id?: string | null;
          semester_id?: string | null;
          status?: Database["public"]["Enums"]["mark_status"];
          tenant_id?: string;
          title?: string;
          updated_at?: string;
          updated_by?: string | null;
          weightage?: number;
        };
        Relationships: [
          {
            foreignKeyName: "assessments_academic_session_id_fkey";
            columns: ["academic_session_id"];
            isOneToOne: false;
            referencedRelation: "academic_sessions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "assessments_assessment_type_id_fkey";
            columns: ["assessment_type_id"];
            isOneToOne: false;
            referencedRelation: "assessment_types";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "assessments_campus_id_fkey";
            columns: ["campus_id"];
            isOneToOne: false;
            referencedRelation: "campuses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "assessments_course_id_fkey";
            columns: ["course_id"];
            isOneToOne: false;
            referencedRelation: "courses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "assessments_faculty_id_fkey";
            columns: ["faculty_id"];
            isOneToOne: false;
            referencedRelation: "faculty";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "assessments_rubric_id_fkey";
            columns: ["rubric_id"];
            isOneToOne: false;
            referencedRelation: "rubrics";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "assessments_section_id_fkey";
            columns: ["section_id"];
            isOneToOne: false;
            referencedRelation: "sections";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "assessments_semester_id_fkey";
            columns: ["semester_id"];
            isOneToOne: false;
            referencedRelation: "semesters";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "assessments_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      attachments: {
        Row: {
          created_at: string;
          created_by: string | null;
          deleted_at: string | null;
          deleted_by: string | null;
          document_id: string | null;
          entity_id: string;
          entity_type: string;
          file_name: string | null;
          file_size: number | null;
          id: string;
          media_asset_id: string | null;
          mime_type: string | null;
          storage_bucket: string | null;
          storage_path: string | null;
          tenant_id: string;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          deleted_at?: string | null;
          deleted_by?: string | null;
          document_id?: string | null;
          entity_id: string;
          entity_type: string;
          file_name?: string | null;
          file_size?: number | null;
          id?: string;
          media_asset_id?: string | null;
          mime_type?: string | null;
          storage_bucket?: string | null;
          storage_path?: string | null;
          tenant_id: string;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          deleted_at?: string | null;
          deleted_by?: string | null;
          document_id?: string | null;
          entity_id?: string;
          entity_type?: string;
          file_name?: string | null;
          file_size?: number | null;
          id?: string;
          media_asset_id?: string | null;
          mime_type?: string | null;
          storage_bucket?: string | null;
          storage_path?: string | null;
          tenant_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "attachments_document_id_fkey";
            columns: ["document_id"];
            isOneToOne: false;
            referencedRelation: "documents";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "attachments_media_asset_id_fkey";
            columns: ["media_asset_id"];
            isOneToOne: false;
            referencedRelation: "media_assets";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "attachments_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      attendance_corrections: {
        Row: {
          attendance_record_id: string;
          created_at: string;
          created_by: string | null;
          deleted_at: string | null;
          id: string;
          new_status: Database["public"]["Enums"]["attendance_status"];
          old_status: Database["public"]["Enums"]["attendance_status"];
          reason: string | null;
          requested_by: string | null;
          review_notes: string | null;
          reviewed_at: string | null;
          reviewed_by: string | null;
          status: Database["public"]["Enums"]["approval_state"];
          tenant_id: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          attendance_record_id: string;
          created_at?: string;
          created_by?: string | null;
          deleted_at?: string | null;
          id?: string;
          new_status: Database["public"]["Enums"]["attendance_status"];
          old_status: Database["public"]["Enums"]["attendance_status"];
          reason?: string | null;
          requested_by?: string | null;
          review_notes?: string | null;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          status?: Database["public"]["Enums"]["approval_state"];
          tenant_id: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          attendance_record_id?: string;
          created_at?: string;
          created_by?: string | null;
          deleted_at?: string | null;
          id?: string;
          new_status?: Database["public"]["Enums"]["attendance_status"];
          old_status?: Database["public"]["Enums"]["attendance_status"];
          reason?: string | null;
          requested_by?: string | null;
          review_notes?: string | null;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          status?: Database["public"]["Enums"]["approval_state"];
          tenant_id?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "attendance_corrections_attendance_record_id_fkey";
            columns: ["attendance_record_id"];
            isOneToOne: false;
            referencedRelation: "attendance_records";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "attendance_corrections_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      attendance_policies: {
        Row: {
          approved_leave_counts: boolean;
          attendee_kind: Database["public"]["Enums"]["attendee_kind"];
          corrections_need_approval: boolean;
          count_holidays: boolean;
          created_at: string;
          created_by: string | null;
          deleted_at: string | null;
          department_id: string | null;
          description: string | null;
          duty_leave_counts: boolean;
          freeze_after_days: number | null;
          frozen_until: string | null;
          grace_minutes: number;
          id: string;
          is_active: boolean;
          late_after_minutes: number;
          late_counts_as_present: boolean;
          medical_leave_counts: boolean;
          minimum_percentage: number;
          name: string;
          penalty_percentage: number;
          program_id: string | null;
          tenant_id: string;
          updated_at: string;
          updated_by: string | null;
          warning_percentage: number;
        };
        Insert: {
          approved_leave_counts?: boolean;
          attendee_kind?: Database["public"]["Enums"]["attendee_kind"];
          corrections_need_approval?: boolean;
          count_holidays?: boolean;
          created_at?: string;
          created_by?: string | null;
          deleted_at?: string | null;
          department_id?: string | null;
          description?: string | null;
          duty_leave_counts?: boolean;
          freeze_after_days?: number | null;
          frozen_until?: string | null;
          grace_minutes?: number;
          id?: string;
          is_active?: boolean;
          late_after_minutes?: number;
          late_counts_as_present?: boolean;
          medical_leave_counts?: boolean;
          minimum_percentage?: number;
          name: string;
          penalty_percentage?: number;
          program_id?: string | null;
          tenant_id: string;
          updated_at?: string;
          updated_by?: string | null;
          warning_percentage?: number;
        };
        Update: {
          approved_leave_counts?: boolean;
          attendee_kind?: Database["public"]["Enums"]["attendee_kind"];
          corrections_need_approval?: boolean;
          count_holidays?: boolean;
          created_at?: string;
          created_by?: string | null;
          deleted_at?: string | null;
          department_id?: string | null;
          description?: string | null;
          duty_leave_counts?: boolean;
          freeze_after_days?: number | null;
          frozen_until?: string | null;
          grace_minutes?: number;
          id?: string;
          is_active?: boolean;
          late_after_minutes?: number;
          late_counts_as_present?: boolean;
          medical_leave_counts?: boolean;
          minimum_percentage?: number;
          name?: string;
          penalty_percentage?: number;
          program_id?: string | null;
          tenant_id?: string;
          updated_at?: string;
          updated_by?: string | null;
          warning_percentage?: number;
        };
        Relationships: [
          {
            foreignKeyName: "attendance_policies_department_id_fkey";
            columns: ["department_id"];
            isOneToOne: false;
            referencedRelation: "departments";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "attendance_policies_program_id_fkey";
            columns: ["program_id"];
            isOneToOne: false;
            referencedRelation: "programs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "attendance_policies_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      attendance_records: {
        Row: {
          attendance_session_id: string;
          attendee_kind: Database["public"]["Enums"]["attendee_kind"];
          corrected_at: string | null;
          corrected_by: string | null;
          created_at: string;
          created_by: string | null;
          deleted_at: string | null;
          device_info: string | null;
          faculty_id: string | null;
          gps_latitude: number | null;
          gps_longitude: number | null;
          id: string;
          is_corrected: boolean;
          leave_request_id: string | null;
          marked_at: string;
          marked_by: string | null;
          marked_via: Database["public"]["Enums"]["attendance_mode"];
          minutes_late: number;
          remarks: string | null;
          staff_id: string | null;
          status: Database["public"]["Enums"]["attendance_status"];
          student_id: string | null;
          tenant_id: string;
          updated_at: string;
          updated_by: string | null;
          user_id: string | null;
        };
        Insert: {
          attendance_session_id: string;
          attendee_kind?: Database["public"]["Enums"]["attendee_kind"];
          corrected_at?: string | null;
          corrected_by?: string | null;
          created_at?: string;
          created_by?: string | null;
          deleted_at?: string | null;
          device_info?: string | null;
          faculty_id?: string | null;
          gps_latitude?: number | null;
          gps_longitude?: number | null;
          id?: string;
          is_corrected?: boolean;
          leave_request_id?: string | null;
          marked_at?: string;
          marked_by?: string | null;
          marked_via?: Database["public"]["Enums"]["attendance_mode"];
          minutes_late?: number;
          remarks?: string | null;
          staff_id?: string | null;
          status?: Database["public"]["Enums"]["attendance_status"];
          student_id?: string | null;
          tenant_id: string;
          updated_at?: string;
          updated_by?: string | null;
          user_id?: string | null;
        };
        Update: {
          attendance_session_id?: string;
          attendee_kind?: Database["public"]["Enums"]["attendee_kind"];
          corrected_at?: string | null;
          corrected_by?: string | null;
          created_at?: string;
          created_by?: string | null;
          deleted_at?: string | null;
          device_info?: string | null;
          faculty_id?: string | null;
          gps_latitude?: number | null;
          gps_longitude?: number | null;
          id?: string;
          is_corrected?: boolean;
          leave_request_id?: string | null;
          marked_at?: string;
          marked_by?: string | null;
          marked_via?: Database["public"]["Enums"]["attendance_mode"];
          minutes_late?: number;
          remarks?: string | null;
          staff_id?: string | null;
          status?: Database["public"]["Enums"]["attendance_status"];
          student_id?: string | null;
          tenant_id?: string;
          updated_at?: string;
          updated_by?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "attendance_records_attendance_session_id_fkey";
            columns: ["attendance_session_id"];
            isOneToOne: false;
            referencedRelation: "attendance_sessions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "attendance_records_faculty_id_fkey";
            columns: ["faculty_id"];
            isOneToOne: false;
            referencedRelation: "faculty";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "attendance_records_leave_fk";
            columns: ["leave_request_id"];
            isOneToOne: false;
            referencedRelation: "leave_requests";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "attendance_records_staff_id_fkey";
            columns: ["staff_id"];
            isOneToOne: false;
            referencedRelation: "staff";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "attendance_records_student_id_fkey";
            columns: ["student_id"];
            isOneToOne: false;
            referencedRelation: "students";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "attendance_records_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      attendance_sessions: {
        Row: {
          academic_session_id: string | null;
          allow_self_checkin: boolean;
          attendee_kind: Database["public"]["Enums"]["attendee_kind"];
          campus_id: string | null;
          course_id: string | null;
          created_at: string;
          created_by: string | null;
          deleted_at: string | null;
          ends_at: string | null;
          faculty_id: string | null;
          gps_latitude: number | null;
          gps_longitude: number | null;
          gps_radius_m: number | null;
          id: string;
          is_locked: boolean;
          locked_at: string | null;
          metadata: Json;
          mode: Database["public"]["Enums"]["attendance_mode"];
          notes: string | null;
          qr_expires_at: string | null;
          qr_token: string | null;
          room_id: string | null;
          section_id: string | null;
          semester_id: string | null;
          session_date: string;
          session_type: Database["public"]["Enums"]["class_session_type"];
          starts_at: string | null;
          tenant_id: string;
          timetable_entry_id: string | null;
          total_expected: number | null;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          academic_session_id?: string | null;
          allow_self_checkin?: boolean;
          attendee_kind?: Database["public"]["Enums"]["attendee_kind"];
          campus_id?: string | null;
          course_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          deleted_at?: string | null;
          ends_at?: string | null;
          faculty_id?: string | null;
          gps_latitude?: number | null;
          gps_longitude?: number | null;
          gps_radius_m?: number | null;
          id?: string;
          is_locked?: boolean;
          locked_at?: string | null;
          metadata?: Json;
          mode?: Database["public"]["Enums"]["attendance_mode"];
          notes?: string | null;
          qr_expires_at?: string | null;
          qr_token?: string | null;
          room_id?: string | null;
          section_id?: string | null;
          semester_id?: string | null;
          session_date?: string;
          session_type?: Database["public"]["Enums"]["class_session_type"];
          starts_at?: string | null;
          tenant_id: string;
          timetable_entry_id?: string | null;
          total_expected?: number | null;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          academic_session_id?: string | null;
          allow_self_checkin?: boolean;
          attendee_kind?: Database["public"]["Enums"]["attendee_kind"];
          campus_id?: string | null;
          course_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          deleted_at?: string | null;
          ends_at?: string | null;
          faculty_id?: string | null;
          gps_latitude?: number | null;
          gps_longitude?: number | null;
          gps_radius_m?: number | null;
          id?: string;
          is_locked?: boolean;
          locked_at?: string | null;
          metadata?: Json;
          mode?: Database["public"]["Enums"]["attendance_mode"];
          notes?: string | null;
          qr_expires_at?: string | null;
          qr_token?: string | null;
          room_id?: string | null;
          section_id?: string | null;
          semester_id?: string | null;
          session_date?: string;
          session_type?: Database["public"]["Enums"]["class_session_type"];
          starts_at?: string | null;
          tenant_id?: string;
          timetable_entry_id?: string | null;
          total_expected?: number | null;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "attendance_sessions_academic_session_id_fkey";
            columns: ["academic_session_id"];
            isOneToOne: false;
            referencedRelation: "academic_sessions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "attendance_sessions_campus_id_fkey";
            columns: ["campus_id"];
            isOneToOne: false;
            referencedRelation: "campuses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "attendance_sessions_course_id_fkey";
            columns: ["course_id"];
            isOneToOne: false;
            referencedRelation: "courses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "attendance_sessions_faculty_id_fkey";
            columns: ["faculty_id"];
            isOneToOne: false;
            referencedRelation: "faculty";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "attendance_sessions_room_id_fkey";
            columns: ["room_id"];
            isOneToOne: false;
            referencedRelation: "rooms";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "attendance_sessions_section_id_fkey";
            columns: ["section_id"];
            isOneToOne: false;
            referencedRelation: "sections";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "attendance_sessions_semester_id_fkey";
            columns: ["semester_id"];
            isOneToOne: false;
            referencedRelation: "semesters";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "attendance_sessions_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "attendance_sessions_timetable_entry_id_fkey";
            columns: ["timetable_entry_id"];
            isOneToOne: false;
            referencedRelation: "timetable_entries";
            referencedColumns: ["id"];
          },
        ];
      };
      audit_logs: {
        Row: {
          action: Database["public"]["Enums"]["audit_action"];
          actor_email: string | null;
          actor_id: string | null;
          campus_id: string | null;
          changed_fields: string[] | null;
          created_at: string;
          entity_id: string | null;
          entity_label: string | null;
          entity_type: string;
          id: string;
          ip_address: unknown;
          metadata: Json;
          module: string | null;
          new_data: Json | null;
          old_data: Json | null;
          tenant_id: string | null;
          user_agent: string | null;
        };
        Insert: {
          action: Database["public"]["Enums"]["audit_action"];
          actor_email?: string | null;
          actor_id?: string | null;
          campus_id?: string | null;
          changed_fields?: string[] | null;
          created_at?: string;
          entity_id?: string | null;
          entity_label?: string | null;
          entity_type: string;
          id?: string;
          ip_address?: unknown;
          metadata?: Json;
          module?: string | null;
          new_data?: Json | null;
          old_data?: Json | null;
          tenant_id?: string | null;
          user_agent?: string | null;
        };
        Update: {
          action?: Database["public"]["Enums"]["audit_action"];
          actor_email?: string | null;
          actor_id?: string | null;
          campus_id?: string | null;
          changed_fields?: string[] | null;
          created_at?: string;
          entity_id?: string | null;
          entity_label?: string | null;
          entity_type?: string;
          id?: string;
          ip_address?: unknown;
          metadata?: Json;
          module?: string | null;
          new_data?: Json | null;
          old_data?: Json | null;
          tenant_id?: string | null;
          user_agent?: string | null;
        };
        Relationships: [];
      };
      batches: {
        Row: {
          academic_year_id: string | null;
          campus_id: string | null;
          capacity: number | null;
          code: string;
          created_at: string;
          created_by: string | null;
          deleted_at: string | null;
          deleted_by: string | null;
          entry_year: number | null;
          exit_year: number | null;
          id: string;
          is_active: boolean;
          name: string;
          program_id: string | null;
          tenant_id: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          academic_year_id?: string | null;
          campus_id?: string | null;
          capacity?: number | null;
          code: string;
          created_at?: string;
          created_by?: string | null;
          deleted_at?: string | null;
          deleted_by?: string | null;
          entry_year?: number | null;
          exit_year?: number | null;
          id?: string;
          is_active?: boolean;
          name: string;
          program_id?: string | null;
          tenant_id: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          academic_year_id?: string | null;
          campus_id?: string | null;
          capacity?: number | null;
          code?: string;
          created_at?: string;
          created_by?: string | null;
          deleted_at?: string | null;
          deleted_by?: string | null;
          entry_year?: number | null;
          exit_year?: number | null;
          id?: string;
          is_active?: boolean;
          name?: string;
          program_id?: string | null;
          tenant_id?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "batches_academic_year_id_fkey";
            columns: ["academic_year_id"];
            isOneToOne: false;
            referencedRelation: "academic_years";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "batches_campus_id_fkey";
            columns: ["campus_id"];
            isOneToOne: false;
            referencedRelation: "campuses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "batches_program_id_fkey";
            columns: ["program_id"];
            isOneToOne: false;
            referencedRelation: "programs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "batches_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      buildings: {
        Row: {
          campus_id: string;
          code: string;
          created_at: string;
          created_by: string | null;
          deleted_at: string | null;
          deleted_by: string | null;
          floors: number;
          id: string;
          name: string;
          tenant_id: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          campus_id: string;
          code: string;
          created_at?: string;
          created_by?: string | null;
          deleted_at?: string | null;
          deleted_by?: string | null;
          floors?: number;
          id?: string;
          name: string;
          tenant_id: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          campus_id?: string;
          code?: string;
          created_at?: string;
          created_by?: string | null;
          deleted_at?: string | null;
          deleted_by?: string | null;
          floors?: number;
          id?: string;
          name?: string;
          tenant_id?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "buildings_campus_id_fkey";
            columns: ["campus_id"];
            isOneToOne: false;
            referencedRelation: "campuses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "buildings_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      calendar_event_participants: {
        Row: {
          created_at: string;
          event_id: string;
          id: string;
          response: string;
          role: string;
          tenant_id: string;
          user_id: string | null;
        };
        Insert: {
          created_at?: string;
          event_id: string;
          id?: string;
          response?: string;
          role?: string;
          tenant_id: string;
          user_id?: string | null;
        };
        Update: {
          created_at?: string;
          event_id?: string;
          id?: string;
          response?: string;
          role?: string;
          tenant_id?: string;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "calendar_event_participants_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "calendar_events";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "calendar_event_participants_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      calendar_event_reminders: {
        Row: {
          channel: Database["public"]["Enums"]["notification_channel"];
          created_at: string;
          event_id: string;
          id: string;
          minutes_before: number;
          sent_at: string | null;
          tenant_id: string;
          user_id: string | null;
        };
        Insert: {
          channel?: Database["public"]["Enums"]["notification_channel"];
          created_at?: string;
          event_id: string;
          id?: string;
          minutes_before?: number;
          sent_at?: string | null;
          tenant_id: string;
          user_id?: string | null;
        };
        Update: {
          channel?: Database["public"]["Enums"]["notification_channel"];
          created_at?: string;
          event_id?: string;
          id?: string;
          minutes_before?: number;
          sent_at?: string | null;
          tenant_id?: string;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "calendar_event_reminders_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "calendar_events";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "calendar_event_reminders_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      calendar_events: {
        Row: {
          all_day: boolean;
          calendar_id: string | null;
          campus_id: string | null;
          color: string | null;
          created_at: string;
          created_by: string | null;
          deleted_at: string | null;
          deleted_by: string | null;
          description: string | null;
          ends_at: string;
          entity_id: string | null;
          entity_type: string | null;
          event_type: Database["public"]["Enums"]["calendar_event_type"];
          id: string;
          is_public: boolean;
          location: string | null;
          recurrence_rule: string | null;
          starts_at: string;
          tenant_id: string;
          title: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          all_day?: boolean;
          calendar_id?: string | null;
          campus_id?: string | null;
          color?: string | null;
          created_at?: string;
          created_by?: string | null;
          deleted_at?: string | null;
          deleted_by?: string | null;
          description?: string | null;
          ends_at: string;
          entity_id?: string | null;
          entity_type?: string | null;
          event_type?: Database["public"]["Enums"]["calendar_event_type"];
          id?: string;
          is_public?: boolean;
          location?: string | null;
          recurrence_rule?: string | null;
          starts_at: string;
          tenant_id: string;
          title: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          all_day?: boolean;
          calendar_id?: string | null;
          campus_id?: string | null;
          color?: string | null;
          created_at?: string;
          created_by?: string | null;
          deleted_at?: string | null;
          deleted_by?: string | null;
          description?: string | null;
          ends_at?: string;
          entity_id?: string | null;
          entity_type?: string | null;
          event_type?: Database["public"]["Enums"]["calendar_event_type"];
          id?: string;
          is_public?: boolean;
          location?: string | null;
          recurrence_rule?: string | null;
          starts_at?: string;
          tenant_id?: string;
          title?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "calendar_events_calendar_id_fkey";
            columns: ["calendar_id"];
            isOneToOne: false;
            referencedRelation: "calendars";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "calendar_events_campus_id_fkey";
            columns: ["campus_id"];
            isOneToOne: false;
            referencedRelation: "campuses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "calendar_events_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      calendars: {
        Row: {
          campus_id: string | null;
          color: string | null;
          created_at: string;
          created_by: string | null;
          deleted_at: string | null;
          deleted_by: string | null;
          description: string | null;
          id: string;
          is_default: boolean;
          name: string;
          owner_id: string | null;
          tenant_id: string;
          updated_at: string;
          updated_by: string | null;
          visibility: string;
        };
        Insert: {
          campus_id?: string | null;
          color?: string | null;
          created_at?: string;
          created_by?: string | null;
          deleted_at?: string | null;
          deleted_by?: string | null;
          description?: string | null;
          id?: string;
          is_default?: boolean;
          name: string;
          owner_id?: string | null;
          tenant_id: string;
          updated_at?: string;
          updated_by?: string | null;
          visibility?: string;
        };
        Update: {
          campus_id?: string | null;
          color?: string | null;
          created_at?: string;
          created_by?: string | null;
          deleted_at?: string | null;
          deleted_by?: string | null;
          description?: string | null;
          id?: string;
          is_default?: boolean;
          name?: string;
          owner_id?: string | null;
          tenant_id?: string;
          updated_at?: string;
          updated_by?: string | null;
          visibility?: string;
        };
        Relationships: [
          {
            foreignKeyName: "calendars_campus_id_fkey";
            columns: ["campus_id"];
            isOneToOne: false;
            referencedRelation: "campuses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "calendars_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      campuses: {
        Row: {
          address_line1: string | null;
          address_line2: string | null;
          city: string | null;
          code: string;
          country: string | null;
          created_at: string;
          created_by: string | null;
          deleted_at: string | null;
          deleted_by: string | null;
          email: string | null;
          id: string;
          is_primary: boolean;
          latitude: number | null;
          longitude: number | null;
          name: string;
          phone: string | null;
          postal_code: string | null;
          state: string | null;
          tenant_id: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          address_line1?: string | null;
          address_line2?: string | null;
          city?: string | null;
          code: string;
          country?: string | null;
          created_at?: string;
          created_by?: string | null;
          deleted_at?: string | null;
          deleted_by?: string | null;
          email?: string | null;
          id?: string;
          is_primary?: boolean;
          latitude?: number | null;
          longitude?: number | null;
          name: string;
          phone?: string | null;
          postal_code?: string | null;
          state?: string | null;
          tenant_id: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          address_line1?: string | null;
          address_line2?: string | null;
          city?: string | null;
          code?: string;
          country?: string | null;
          created_at?: string;
          created_by?: string | null;
          deleted_at?: string | null;
          deleted_by?: string | null;
          email?: string | null;
          id?: string;
          is_primary?: boolean;
          latitude?: number | null;
          longitude?: number | null;
          name?: string;
          phone?: string | null;
          postal_code?: string | null;
          state?: string | null;
          tenant_id?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "campuses_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      certificates: {
        Row: {
          certificate_number: string;
          created_at: string;
          created_by: string | null;
          deleted_at: string | null;
          deleted_by: string | null;
          exam_session_id: string | null;
          id: string;
          is_revoked: boolean;
          issued_on: string;
          kind: Database["public"]["Enums"]["certificate_kind"];
          payload: Json;
          result_id: string | null;
          signature_ref: string | null;
          signed_by: string | null;
          student_id: string;
          tenant_id: string;
          updated_at: string;
          updated_by: string | null;
          verification_code: string;
        };
        Insert: {
          certificate_number: string;
          created_at?: string;
          created_by?: string | null;
          deleted_at?: string | null;
          deleted_by?: string | null;
          exam_session_id?: string | null;
          id?: string;
          is_revoked?: boolean;
          issued_on?: string;
          kind?: Database["public"]["Enums"]["certificate_kind"];
          payload?: Json;
          result_id?: string | null;
          signature_ref?: string | null;
          signed_by?: string | null;
          student_id: string;
          tenant_id: string;
          updated_at?: string;
          updated_by?: string | null;
          verification_code: string;
        };
        Update: {
          certificate_number?: string;
          created_at?: string;
          created_by?: string | null;
          deleted_at?: string | null;
          deleted_by?: string | null;
          exam_session_id?: string | null;
          id?: string;
          is_revoked?: boolean;
          issued_on?: string;
          kind?: Database["public"]["Enums"]["certificate_kind"];
          payload?: Json;
          result_id?: string | null;
          signature_ref?: string | null;
          signed_by?: string | null;
          student_id?: string;
          tenant_id?: string;
          updated_at?: string;
          updated_by?: string | null;
          verification_code?: string;
        };
        Relationships: [
          {
            foreignKeyName: "certificates_exam_session_id_fkey";
            columns: ["exam_session_id"];
            isOneToOne: false;
            referencedRelation: "exam_sessions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "certificates_result_id_fkey";
            columns: ["result_id"];
            isOneToOne: false;
            referencedRelation: "results";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "certificates_student_id_fkey";
            columns: ["student_id"];
            isOneToOne: false;
            referencedRelation: "students";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "certificates_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      cities: {
        Row: {
          created_at: string;
          id: string;
          name: string;
          state_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          name: string;
          state_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          name?: string;
          state_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "cities_state_id_fkey";
            columns: ["state_id"];
            isOneToOne: false;
            referencedRelation: "states";
            referencedColumns: ["id"];
          },
        ];
      };
      co_po_mappings: {
        Row: {
          course_outcome_id: string;
          created_at: string;
          created_by: string | null;
          deleted_at: string | null;
          deleted_by: string | null;
          id: string;
          program_outcome_id: string;
          strength: number;
          tenant_id: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          course_outcome_id: string;
          created_at?: string;
          created_by?: string | null;
          deleted_at?: string | null;
          deleted_by?: string | null;
          id?: string;
          program_outcome_id: string;
          strength?: number;
          tenant_id: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          course_outcome_id?: string;
          created_at?: string;
          created_by?: string | null;
          deleted_at?: string | null;
          deleted_by?: string | null;
          id?: string;
          program_outcome_id?: string;
          strength?: number;
          tenant_id?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "co_po_mappings_course_outcome_id_fkey";
            columns: ["course_outcome_id"];
            isOneToOne: false;
            referencedRelation: "course_outcomes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "co_po_mappings_program_outcome_id_fkey";
            columns: ["program_outcome_id"];
            isOneToOne: false;
            referencedRelation: "program_outcomes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "co_po_mappings_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      comments: {
        Row: {
          author_id: string;
          body: string;
          created_at: string;
          created_by: string | null;
          deleted_at: string | null;
          deleted_by: string | null;
          edited_at: string | null;
          entity_id: string;
          entity_type: string;
          id: string;
          is_internal: boolean;
          mentions: string[];
          parent_id: string | null;
          tenant_id: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          author_id: string;
          body: string;
          created_at?: string;
          created_by?: string | null;
          deleted_at?: string | null;
          deleted_by?: string | null;
          edited_at?: string | null;
          entity_id: string;
          entity_type: string;
          id?: string;
          is_internal?: boolean;
          mentions?: string[];
          parent_id?: string | null;
          tenant_id: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          author_id?: string;
          body?: string;
          created_at?: string;
          created_by?: string | null;
          deleted_at?: string | null;
          deleted_by?: string | null;
          edited_at?: string | null;
          entity_id?: string;
          entity_type?: string;
          id?: string;
          is_internal?: boolean;
          mentions?: string[];
          parent_id?: string | null;
          tenant_id?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "comments_parent_id_fkey";
            columns: ["parent_id"];
            isOneToOne: false;
            referencedRelation: "comments";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "comments_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      countries: {
        Row: {
          created_at: string;
          currency: string | null;
          id: string;
          iso2: string;
          iso3: string | null;
          name: string;
          phone_code: string | null;
        };
        Insert: {
          created_at?: string;
          currency?: string | null;
          id?: string;
          iso2: string;
          iso3?: string | null;
          name: string;
          phone_code?: string | null;
        };
        Update: {
          created_at?: string;
          currency?: string | null;
          id?: string;
          iso2?: string;
          iso3?: string | null;
          name?: string;
          phone_code?: string | null;
        };
        Relationships: [];
      };
      course_outcomes: {
        Row: {
          bloom_level: string | null;
          code: string;
          course_id: string;
          created_at: string;
          created_by: string | null;
          deleted_at: string | null;
          deleted_by: string | null;
          description: string;
          id: string;
          tenant_id: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          bloom_level?: string | null;
          code: string;
          course_id: string;
          created_at?: string;
          created_by?: string | null;
          deleted_at?: string | null;
          deleted_by?: string | null;
          description: string;
          id?: string;
          tenant_id: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          bloom_level?: string | null;
          code?: string;
          course_id?: string;
          created_at?: string;
          created_by?: string | null;
          deleted_at?: string | null;
          deleted_by?: string | null;
          description?: string;
          id?: string;
          tenant_id?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "course_outcomes_course_id_fkey";
            columns: ["course_id"];
            isOneToOne: false;
            referencedRelation: "courses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "course_outcomes_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      course_prerequisites: {
        Row: {
          course_id: string;
          created_at: string;
          created_by: string | null;
          deleted_at: string | null;
          deleted_by: string | null;
          id: string;
          kind: string;
          prerequisite_course_id: string;
          tenant_id: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          course_id: string;
          created_at?: string;
          created_by?: string | null;
          deleted_at?: string | null;
          deleted_by?: string | null;
          id?: string;
          kind?: string;
          prerequisite_course_id: string;
          tenant_id: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          course_id?: string;
          created_at?: string;
          created_by?: string | null;
          deleted_at?: string | null;
          deleted_by?: string | null;
          id?: string;
          kind?: string;
          prerequisite_course_id?: string;
          tenant_id?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "course_prerequisites_course_id_fkey";
            columns: ["course_id"];
            isOneToOne: false;
            referencedRelation: "courses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "course_prerequisites_prerequisite_course_id_fkey";
            columns: ["prerequisite_course_id"];
            isOneToOne: false;
            referencedRelation: "courses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "course_prerequisites_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      courses: {
        Row: {
          code: string;
          created_at: string;
          created_by: string | null;
          credits: number;
          deleted_at: string | null;
          deleted_by: string | null;
          department_id: string | null;
          description: string | null;
          id: string;
          is_active: boolean;
          lecture_hours: number;
          practical_hours: number;
          program_id: string | null;
          semester_id: string | null;
          syllabus_url: string | null;
          tenant_id: string;
          title: string;
          tutorial_hours: number;
          type: Database["public"]["Enums"]["course_type"];
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          code: string;
          created_at?: string;
          created_by?: string | null;
          credits?: number;
          deleted_at?: string | null;
          deleted_by?: string | null;
          department_id?: string | null;
          description?: string | null;
          id?: string;
          is_active?: boolean;
          lecture_hours?: number;
          practical_hours?: number;
          program_id?: string | null;
          semester_id?: string | null;
          syllabus_url?: string | null;
          tenant_id: string;
          title: string;
          tutorial_hours?: number;
          type?: Database["public"]["Enums"]["course_type"];
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          code?: string;
          created_at?: string;
          created_by?: string | null;
          credits?: number;
          deleted_at?: string | null;
          deleted_by?: string | null;
          department_id?: string | null;
          description?: string | null;
          id?: string;
          is_active?: boolean;
          lecture_hours?: number;
          practical_hours?: number;
          program_id?: string | null;
          semester_id?: string | null;
          syllabus_url?: string | null;
          tenant_id?: string;
          title?: string;
          tutorial_hours?: number;
          type?: Database["public"]["Enums"]["course_type"];
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "courses_department_id_fkey";
            columns: ["department_id"];
            isOneToOne: false;
            referencedRelation: "departments";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "courses_program_id_fkey";
            columns: ["program_id"];
            isOneToOne: false;
            referencedRelation: "programs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "courses_semester_id_fkey";
            columns: ["semester_id"];
            isOneToOne: false;
            referencedRelation: "semesters";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "courses_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      curricula: {
        Row: {
          approved_at: string | null;
          approved_by: string | null;
          created_at: string;
          created_by: string | null;
          deleted_at: string | null;
          deleted_by: string | null;
          effective_from: string | null;
          effective_to: string | null;
          id: string;
          name: string;
          notes: string | null;
          program_id: string;
          regulation: string | null;
          status: Database["public"]["Enums"]["curriculum_status"];
          tenant_id: string;
          total_credits: number | null;
          updated_at: string;
          updated_by: string | null;
          version: string;
        };
        Insert: {
          approved_at?: string | null;
          approved_by?: string | null;
          created_at?: string;
          created_by?: string | null;
          deleted_at?: string | null;
          deleted_by?: string | null;
          effective_from?: string | null;
          effective_to?: string | null;
          id?: string;
          name: string;
          notes?: string | null;
          program_id: string;
          regulation?: string | null;
          status?: Database["public"]["Enums"]["curriculum_status"];
          tenant_id: string;
          total_credits?: number | null;
          updated_at?: string;
          updated_by?: string | null;
          version: string;
        };
        Update: {
          approved_at?: string | null;
          approved_by?: string | null;
          created_at?: string;
          created_by?: string | null;
          deleted_at?: string | null;
          deleted_by?: string | null;
          effective_from?: string | null;
          effective_to?: string | null;
          id?: string;
          name?: string;
          notes?: string | null;
          program_id?: string;
          regulation?: string | null;
          status?: Database["public"]["Enums"]["curriculum_status"];
          tenant_id?: string;
          total_credits?: number | null;
          updated_at?: string;
          updated_by?: string | null;
          version?: string;
        };
        Relationships: [
          {
            foreignKeyName: "curricula_program_id_fkey";
            columns: ["program_id"];
            isOneToOne: false;
            referencedRelation: "programs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "curricula_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      curriculum_courses: {
        Row: {
          category: Database["public"]["Enums"]["curriculum_category"];
          course_id: string;
          created_at: string;
          created_by: string | null;
          credits: number | null;
          curriculum_id: string;
          deleted_at: string | null;
          deleted_by: string | null;
          id: string;
          is_mandatory: boolean;
          semester_number: number;
          tenant_id: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          category?: Database["public"]["Enums"]["curriculum_category"];
          course_id: string;
          created_at?: string;
          created_by?: string | null;
          credits?: number | null;
          curriculum_id: string;
          deleted_at?: string | null;
          deleted_by?: string | null;
          id?: string;
          is_mandatory?: boolean;
          semester_number?: number;
          tenant_id: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          category?: Database["public"]["Enums"]["curriculum_category"];
          course_id?: string;
          created_at?: string;
          created_by?: string | null;
          credits?: number | null;
          curriculum_id?: string;
          deleted_at?: string | null;
          deleted_by?: string | null;
          id?: string;
          is_mandatory?: boolean;
          semester_number?: number;
          tenant_id?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "curriculum_courses_course_id_fkey";
            columns: ["course_id"];
            isOneToOne: false;
            referencedRelation: "courses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "curriculum_courses_curriculum_id_fkey";
            columns: ["curriculum_id"];
            isOneToOne: false;
            referencedRelation: "curricula";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "curriculum_courses_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      custom_field_definitions: {
        Row: {
          created_at: string;
          created_by: string | null;
          default_value: Json | null;
          deleted_at: string | null;
          deleted_by: string | null;
          entity_type: string;
          field_type: Database["public"]["Enums"]["custom_field_type"];
          help_text: string | null;
          id: string;
          is_active: boolean;
          is_required: boolean;
          is_searchable: boolean;
          key: string;
          label: string;
          options: Json;
          placeholder: string | null;
          section: string | null;
          sort_order: number;
          tenant_id: string;
          updated_at: string;
          updated_by: string | null;
          validation: Json;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          default_value?: Json | null;
          deleted_at?: string | null;
          deleted_by?: string | null;
          entity_type: string;
          field_type?: Database["public"]["Enums"]["custom_field_type"];
          help_text?: string | null;
          id?: string;
          is_active?: boolean;
          is_required?: boolean;
          is_searchable?: boolean;
          key: string;
          label: string;
          options?: Json;
          placeholder?: string | null;
          section?: string | null;
          sort_order?: number;
          tenant_id: string;
          updated_at?: string;
          updated_by?: string | null;
          validation?: Json;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          default_value?: Json | null;
          deleted_at?: string | null;
          deleted_by?: string | null;
          entity_type?: string;
          field_type?: Database["public"]["Enums"]["custom_field_type"];
          help_text?: string | null;
          id?: string;
          is_active?: boolean;
          is_required?: boolean;
          is_searchable?: boolean;
          key?: string;
          label?: string;
          options?: Json;
          placeholder?: string | null;
          section?: string | null;
          sort_order?: number;
          tenant_id?: string;
          updated_at?: string;
          updated_by?: string | null;
          validation?: Json;
        };
        Relationships: [
          {
            foreignKeyName: "custom_field_definitions_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      custom_field_values: {
        Row: {
          created_at: string;
          created_by: string | null;
          definition_id: string;
          entity_id: string;
          entity_type: string;
          id: string;
          tenant_id: string;
          updated_at: string;
          updated_by: string | null;
          value: Json | null;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          definition_id: string;
          entity_id: string;
          entity_type: string;
          id?: string;
          tenant_id: string;
          updated_at?: string;
          updated_by?: string | null;
          value?: Json | null;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          definition_id?: string;
          entity_id?: string;
          entity_type?: string;
          id?: string;
          tenant_id?: string;
          updated_at?: string;
          updated_by?: string | null;
          value?: Json | null;
        };
        Relationships: [
          {
            foreignKeyName: "custom_field_values_definition_id_fkey";
            columns: ["definition_id"];
            isOneToOne: false;
            referencedRelation: "custom_field_definitions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "custom_field_values_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      dashboard_layouts: {
        Row: {
          created_at: string;
          id: string;
          is_default: boolean;
          name: string;
          role_id: string | null;
          tenant_id: string;
          updated_at: string;
          user_id: string | null;
        };
        Insert: {
          created_at?: string;
          id?: string;
          is_default?: boolean;
          name?: string;
          role_id?: string | null;
          tenant_id: string;
          updated_at?: string;
          user_id?: string | null;
        };
        Update: {
          created_at?: string;
          id?: string;
          is_default?: boolean;
          name?: string;
          role_id?: string | null;
          tenant_id?: string;
          updated_at?: string;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "dashboard_layouts_role_id_fkey";
            columns: ["role_id"];
            isOneToOne: false;
            referencedRelation: "roles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "dashboard_layouts_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      dashboard_widgets: {
        Row: {
          config: Json;
          created_at: string;
          height: number;
          id: string;
          is_visible: boolean;
          layout_id: string;
          position_x: number;
          position_y: number;
          tenant_id: string;
          updated_at: string;
          widget_id: string;
          width: number;
        };
        Insert: {
          config?: Json;
          created_at?: string;
          height?: number;
          id?: string;
          is_visible?: boolean;
          layout_id: string;
          position_x?: number;
          position_y?: number;
          tenant_id: string;
          updated_at?: string;
          widget_id: string;
          width?: number;
        };
        Update: {
          config?: Json;
          created_at?: string;
          height?: number;
          id?: string;
          is_visible?: boolean;
          layout_id?: string;
          position_x?: number;
          position_y?: number;
          tenant_id?: string;
          updated_at?: string;
          widget_id?: string;
          width?: number;
        };
        Relationships: [
          {
            foreignKeyName: "dashboard_widgets_layout_id_fkey";
            columns: ["layout_id"];
            isOneToOne: false;
            referencedRelation: "dashboard_layouts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "dashboard_widgets_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "dashboard_widgets_widget_id_fkey";
            columns: ["widget_id"];
            isOneToOne: false;
            referencedRelation: "widgets";
            referencedColumns: ["id"];
          },
        ];
      };
      departments: {
        Row: {
          campus_id: string | null;
          code: string;
          created_at: string;
          created_by: string | null;
          deleted_at: string | null;
          deleted_by: string | null;
          description: string | null;
          email: string | null;
          established_year: number | null;
          hod_user_id: string | null;
          id: string;
          is_active: boolean;
          mission: string | null;
          name: string;
          phone: string | null;
          short_name: string | null;
          tenant_id: string;
          updated_at: string;
          updated_by: string | null;
          vision: string | null;
        };
        Insert: {
          campus_id?: string | null;
          code: string;
          created_at?: string;
          created_by?: string | null;
          deleted_at?: string | null;
          deleted_by?: string | null;
          description?: string | null;
          email?: string | null;
          established_year?: number | null;
          hod_user_id?: string | null;
          id?: string;
          is_active?: boolean;
          mission?: string | null;
          name: string;
          phone?: string | null;
          short_name?: string | null;
          tenant_id: string;
          updated_at?: string;
          updated_by?: string | null;
          vision?: string | null;
        };
        Update: {
          campus_id?: string | null;
          code?: string;
          created_at?: string;
          created_by?: string | null;
          deleted_at?: string | null;
          deleted_by?: string | null;
          description?: string | null;
          email?: string | null;
          established_year?: number | null;
          hod_user_id?: string | null;
          id?: string;
          is_active?: boolean;
          mission?: string | null;
          name?: string;
          phone?: string | null;
          short_name?: string | null;
          tenant_id?: string;
          updated_at?: string;
          updated_by?: string | null;
          vision?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "departments_campus_id_fkey";
            columns: ["campus_id"];
            isOneToOne: false;
            referencedRelation: "campuses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "departments_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      document_types: {
        Row: {
          allowed_mime_types: string[];
          category: string | null;
          created_at: string;
          id: string;
          is_active: boolean;
          key: string;
          max_size_mb: number;
          name: string;
          requires_verification: boolean;
          tenant_id: string | null;
          updated_at: string;
        };
        Insert: {
          allowed_mime_types?: string[];
          category?: string | null;
          created_at?: string;
          id?: string;
          is_active?: boolean;
          key: string;
          max_size_mb?: number;
          name: string;
          requires_verification?: boolean;
          tenant_id?: string | null;
          updated_at?: string;
        };
        Update: {
          allowed_mime_types?: string[];
          category?: string | null;
          created_at?: string;
          id?: string;
          is_active?: boolean;
          key?: string;
          max_size_mb?: number;
          name?: string;
          requires_verification?: boolean;
          tenant_id?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "document_types_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      document_versions: {
        Row: {
          created_at: string;
          created_by: string | null;
          document_id: string;
          file_size: number | null;
          id: string;
          mime_type: string | null;
          notes: string | null;
          storage_path: string;
          tenant_id: string;
          version: number;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          document_id: string;
          file_size?: number | null;
          id?: string;
          mime_type?: string | null;
          notes?: string | null;
          storage_path: string;
          tenant_id: string;
          version: number;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          document_id?: string;
          file_size?: number | null;
          id?: string;
          mime_type?: string | null;
          notes?: string | null;
          storage_path?: string;
          tenant_id?: string;
          version?: number;
        };
        Relationships: [
          {
            foreignKeyName: "document_versions_document_id_fkey";
            columns: ["document_id"];
            isOneToOne: false;
            referencedRelation: "documents";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "document_versions_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      documents: {
        Row: {
          campus_id: string | null;
          checksum: string | null;
          created_at: string;
          created_by: string | null;
          current_version: number;
          deleted_at: string | null;
          deleted_by: string | null;
          description: string | null;
          document_type_id: string | null;
          entity_id: string | null;
          entity_type: string;
          expires_on: string | null;
          file_size: number | null;
          id: string;
          is_confidential: boolean;
          issued_on: string | null;
          metadata: Json;
          mime_type: string | null;
          owner_id: string | null;
          rejection_reason: string | null;
          status: Database["public"]["Enums"]["document_status"];
          storage_bucket: string;
          storage_path: string;
          tenant_id: string;
          title: string;
          updated_at: string;
          updated_by: string | null;
          verified_at: string | null;
          verified_by: string | null;
        };
        Insert: {
          campus_id?: string | null;
          checksum?: string | null;
          created_at?: string;
          created_by?: string | null;
          current_version?: number;
          deleted_at?: string | null;
          deleted_by?: string | null;
          description?: string | null;
          document_type_id?: string | null;
          entity_id?: string | null;
          entity_type: string;
          expires_on?: string | null;
          file_size?: number | null;
          id?: string;
          is_confidential?: boolean;
          issued_on?: string | null;
          metadata?: Json;
          mime_type?: string | null;
          owner_id?: string | null;
          rejection_reason?: string | null;
          status?: Database["public"]["Enums"]["document_status"];
          storage_bucket?: string;
          storage_path: string;
          tenant_id: string;
          title: string;
          updated_at?: string;
          updated_by?: string | null;
          verified_at?: string | null;
          verified_by?: string | null;
        };
        Update: {
          campus_id?: string | null;
          checksum?: string | null;
          created_at?: string;
          created_by?: string | null;
          current_version?: number;
          deleted_at?: string | null;
          deleted_by?: string | null;
          description?: string | null;
          document_type_id?: string | null;
          entity_id?: string | null;
          entity_type?: string;
          expires_on?: string | null;
          file_size?: number | null;
          id?: string;
          is_confidential?: boolean;
          issued_on?: string | null;
          metadata?: Json;
          mime_type?: string | null;
          owner_id?: string | null;
          rejection_reason?: string | null;
          status?: Database["public"]["Enums"]["document_status"];
          storage_bucket?: string;
          storage_path?: string;
          tenant_id?: string;
          title?: string;
          updated_at?: string;
          updated_by?: string | null;
          verified_at?: string | null;
          verified_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "documents_campus_id_fkey";
            columns: ["campus_id"];
            isOneToOne: false;
            referencedRelation: "campuses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "documents_document_type_id_fkey";
            columns: ["document_type_id"];
            isOneToOne: false;
            referencedRelation: "document_types";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "documents_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      enrollments: {
        Row: {
          academic_session_id: string | null;
          course_id: string;
          created_at: string;
          created_by: string | null;
          deleted_at: string | null;
          deleted_by: string | null;
          enrolled_at: string;
          faculty_id: string | null;
          grade: string | null;
          grade_points: number | null;
          id: string;
          section_id: string | null;
          semester_id: string | null;
          status: Database["public"]["Enums"]["enrollment_status"];
          student_id: string;
          tenant_id: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          academic_session_id?: string | null;
          course_id: string;
          created_at?: string;
          created_by?: string | null;
          deleted_at?: string | null;
          deleted_by?: string | null;
          enrolled_at?: string;
          faculty_id?: string | null;
          grade?: string | null;
          grade_points?: number | null;
          id?: string;
          section_id?: string | null;
          semester_id?: string | null;
          status?: Database["public"]["Enums"]["enrollment_status"];
          student_id: string;
          tenant_id: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          academic_session_id?: string | null;
          course_id?: string;
          created_at?: string;
          created_by?: string | null;
          deleted_at?: string | null;
          deleted_by?: string | null;
          enrolled_at?: string;
          faculty_id?: string | null;
          grade?: string | null;
          grade_points?: number | null;
          id?: string;
          section_id?: string | null;
          semester_id?: string | null;
          status?: Database["public"]["Enums"]["enrollment_status"];
          student_id?: string;
          tenant_id?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "enrollments_academic_session_id_fkey";
            columns: ["academic_session_id"];
            isOneToOne: false;
            referencedRelation: "academic_sessions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "enrollments_course_id_fkey";
            columns: ["course_id"];
            isOneToOne: false;
            referencedRelation: "courses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "enrollments_faculty_id_fkey";
            columns: ["faculty_id"];
            isOneToOne: false;
            referencedRelation: "faculty";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "enrollments_section_id_fkey";
            columns: ["section_id"];
            isOneToOne: false;
            referencedRelation: "sections";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "enrollments_semester_id_fkey";
            columns: ["semester_id"];
            isOneToOne: false;
            referencedRelation: "semesters";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "enrollments_student_id_fkey";
            columns: ["student_id"];
            isOneToOne: false;
            referencedRelation: "students";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "enrollments_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      exam_invigilators: {
        Row: {
          attendance_status: string;
          created_at: string;
          created_by: string | null;
          deleted_at: string | null;
          deleted_by: string | null;
          departed_at: string | null;
          duty_role: Database["public"]["Enums"]["exam_duty_role"];
          exam_id: string;
          exam_room_id: string | null;
          faculty_id: string | null;
          id: string;
          notes: string | null;
          reported_at: string | null;
          staff_id: string | null;
          swapped_from: string | null;
          tenant_id: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          attendance_status?: string;
          created_at?: string;
          created_by?: string | null;
          deleted_at?: string | null;
          deleted_by?: string | null;
          departed_at?: string | null;
          duty_role?: Database["public"]["Enums"]["exam_duty_role"];
          exam_id: string;
          exam_room_id?: string | null;
          faculty_id?: string | null;
          id?: string;
          notes?: string | null;
          reported_at?: string | null;
          staff_id?: string | null;
          swapped_from?: string | null;
          tenant_id: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          attendance_status?: string;
          created_at?: string;
          created_by?: string | null;
          deleted_at?: string | null;
          deleted_by?: string | null;
          departed_at?: string | null;
          duty_role?: Database["public"]["Enums"]["exam_duty_role"];
          exam_id?: string;
          exam_room_id?: string | null;
          faculty_id?: string | null;
          id?: string;
          notes?: string | null;
          reported_at?: string | null;
          staff_id?: string | null;
          swapped_from?: string | null;
          tenant_id?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "exam_invigilators_exam_id_fkey";
            columns: ["exam_id"];
            isOneToOne: false;
            referencedRelation: "exams";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "exam_invigilators_exam_room_id_fkey";
            columns: ["exam_room_id"];
            isOneToOne: false;
            referencedRelation: "exam_rooms";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "exam_invigilators_faculty_id_fkey";
            columns: ["faculty_id"];
            isOneToOne: false;
            referencedRelation: "faculty";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "exam_invigilators_staff_id_fkey";
            columns: ["staff_id"];
            isOneToOne: false;
            referencedRelation: "staff";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "exam_invigilators_swapped_from_fkey";
            columns: ["swapped_from"];
            isOneToOne: false;
            referencedRelation: "exam_invigilators";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "exam_invigilators_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      exam_registrations: {
        Row: {
          attempt_number: number;
          attendance_percentage: number | null;
          created_at: string;
          created_by: string | null;
          deleted_at: string | null;
          deleted_by: string | null;
          eligibility_reason: string | null;
          enrollment_id: string | null;
          exam_id: string;
          fee_hold: boolean;
          hold_reason: string | null;
          id: string;
          is_backlog: boolean;
          metadata: Json;
          registered_at: string | null;
          status: Database["public"]["Enums"]["exam_registration_status"];
          student_id: string;
          tenant_id: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          attempt_number?: number;
          attendance_percentage?: number | null;
          created_at?: string;
          created_by?: string | null;
          deleted_at?: string | null;
          deleted_by?: string | null;
          eligibility_reason?: string | null;
          enrollment_id?: string | null;
          exam_id: string;
          fee_hold?: boolean;
          hold_reason?: string | null;
          id?: string;
          is_backlog?: boolean;
          metadata?: Json;
          registered_at?: string | null;
          status?: Database["public"]["Enums"]["exam_registration_status"];
          student_id: string;
          tenant_id: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          attempt_number?: number;
          attendance_percentage?: number | null;
          created_at?: string;
          created_by?: string | null;
          deleted_at?: string | null;
          deleted_by?: string | null;
          eligibility_reason?: string | null;
          enrollment_id?: string | null;
          exam_id?: string;
          fee_hold?: boolean;
          hold_reason?: string | null;
          id?: string;
          is_backlog?: boolean;
          metadata?: Json;
          registered_at?: string | null;
          status?: Database["public"]["Enums"]["exam_registration_status"];
          student_id?: string;
          tenant_id?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "exam_registrations_enrollment_id_fkey";
            columns: ["enrollment_id"];
            isOneToOne: false;
            referencedRelation: "enrollments";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "exam_registrations_exam_id_fkey";
            columns: ["exam_id"];
            isOneToOne: false;
            referencedRelation: "exams";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "exam_registrations_student_id_fkey";
            columns: ["student_id"];
            isOneToOne: false;
            referencedRelation: "students";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "exam_registrations_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      exam_rooms: {
        Row: {
          block_label: string | null;
          building_id: string | null;
          created_at: string;
          created_by: string | null;
          deleted_at: string | null;
          deleted_by: string | null;
          exam_id: string;
          floor: number | null;
          id: string;
          is_special_needs: boolean;
          notes: string | null;
          room_id: string | null;
          seat_capacity: number;
          seat_prefix: string | null;
          seats_allocated: number;
          tenant_id: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          block_label?: string | null;
          building_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          deleted_at?: string | null;
          deleted_by?: string | null;
          exam_id: string;
          floor?: number | null;
          id?: string;
          is_special_needs?: boolean;
          notes?: string | null;
          room_id?: string | null;
          seat_capacity?: number;
          seat_prefix?: string | null;
          seats_allocated?: number;
          tenant_id: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          block_label?: string | null;
          building_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          deleted_at?: string | null;
          deleted_by?: string | null;
          exam_id?: string;
          floor?: number | null;
          id?: string;
          is_special_needs?: boolean;
          notes?: string | null;
          room_id?: string | null;
          seat_capacity?: number;
          seat_prefix?: string | null;
          seats_allocated?: number;
          tenant_id?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "exam_rooms_building_id_fkey";
            columns: ["building_id"];
            isOneToOne: false;
            referencedRelation: "buildings";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "exam_rooms_exam_id_fkey";
            columns: ["exam_id"];
            isOneToOne: false;
            referencedRelation: "exams";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "exam_rooms_room_id_fkey";
            columns: ["room_id"];
            isOneToOne: false;
            referencedRelation: "rooms";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "exam_rooms_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      exam_seats: {
        Row: {
          bench_number: number | null;
          created_at: string;
          created_by: string | null;
          deleted_at: string | null;
          deleted_by: string | null;
          exam_id: string;
          exam_room_id: string;
          id: string;
          is_special_needs: boolean;
          row_label: string | null;
          seat_number: string;
          student_id: string;
          tenant_id: string;
          updated_at: string;
          updated_by: string | null;
          verification_code: string | null;
        };
        Insert: {
          bench_number?: number | null;
          created_at?: string;
          created_by?: string | null;
          deleted_at?: string | null;
          deleted_by?: string | null;
          exam_id: string;
          exam_room_id: string;
          id?: string;
          is_special_needs?: boolean;
          row_label?: string | null;
          seat_number: string;
          student_id: string;
          tenant_id: string;
          updated_at?: string;
          updated_by?: string | null;
          verification_code?: string | null;
        };
        Update: {
          bench_number?: number | null;
          created_at?: string;
          created_by?: string | null;
          deleted_at?: string | null;
          deleted_by?: string | null;
          exam_id?: string;
          exam_room_id?: string;
          id?: string;
          is_special_needs?: boolean;
          row_label?: string | null;
          seat_number?: string;
          student_id?: string;
          tenant_id?: string;
          updated_at?: string;
          updated_by?: string | null;
          verification_code?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "exam_seats_exam_id_fkey";
            columns: ["exam_id"];
            isOneToOne: false;
            referencedRelation: "exams";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "exam_seats_exam_room_id_fkey";
            columns: ["exam_room_id"];
            isOneToOne: false;
            referencedRelation: "exam_rooms";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "exam_seats_student_id_fkey";
            columns: ["student_id"];
            isOneToOne: false;
            referencedRelation: "students";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "exam_seats_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      exam_sessions: {
        Row: {
          academic_session_id: string | null;
          campus_id: string | null;
          category: Database["public"]["Enums"]["assessment_category"];
          code: string;
          created_at: string;
          created_by: string | null;
          deleted_at: string | null;
          deleted_by: string | null;
          ends_on: string;
          hall_ticket_release_on: string | null;
          id: string;
          instructions: string | null;
          metadata: Json;
          name: string;
          registration_closes_on: string | null;
          registration_opens_on: string | null;
          result_expected_on: string | null;
          semester_id: string | null;
          starts_on: string;
          status: Database["public"]["Enums"]["exam_status"];
          tenant_id: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          academic_session_id?: string | null;
          campus_id?: string | null;
          category?: Database["public"]["Enums"]["assessment_category"];
          code: string;
          created_at?: string;
          created_by?: string | null;
          deleted_at?: string | null;
          deleted_by?: string | null;
          ends_on: string;
          hall_ticket_release_on?: string | null;
          id?: string;
          instructions?: string | null;
          metadata?: Json;
          name: string;
          registration_closes_on?: string | null;
          registration_opens_on?: string | null;
          result_expected_on?: string | null;
          semester_id?: string | null;
          starts_on: string;
          status?: Database["public"]["Enums"]["exam_status"];
          tenant_id: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          academic_session_id?: string | null;
          campus_id?: string | null;
          category?: Database["public"]["Enums"]["assessment_category"];
          code?: string;
          created_at?: string;
          created_by?: string | null;
          deleted_at?: string | null;
          deleted_by?: string | null;
          ends_on?: string;
          hall_ticket_release_on?: string | null;
          id?: string;
          instructions?: string | null;
          metadata?: Json;
          name?: string;
          registration_closes_on?: string | null;
          registration_opens_on?: string | null;
          result_expected_on?: string | null;
          semester_id?: string | null;
          starts_on?: string;
          status?: Database["public"]["Enums"]["exam_status"];
          tenant_id?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "exam_sessions_academic_session_id_fkey";
            columns: ["academic_session_id"];
            isOneToOne: false;
            referencedRelation: "academic_sessions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "exam_sessions_campus_id_fkey";
            columns: ["campus_id"];
            isOneToOne: false;
            referencedRelation: "campuses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "exam_sessions_semester_id_fkey";
            columns: ["semester_id"];
            isOneToOne: false;
            referencedRelation: "semesters";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "exam_sessions_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      exams: {
        Row: {
          assessment_type_id: string | null;
          campus_id: string | null;
          course_id: string | null;
          created_at: string;
          created_by: string | null;
          deleted_at: string | null;
          deleted_by: string | null;
          duration_minutes: number | null;
          ends_at: string | null;
          exam_date: string | null;
          exam_session_id: string;
          external_weightage: number;
          grading_scale_id: string | null;
          id: string;
          instructions: string | null;
          internal_weightage: number;
          max_marks: number;
          metadata: Json;
          min_attendance_percentage: number | null;
          passing_marks: number;
          program_id: string | null;
          section_id: string | null;
          semester_id: string | null;
          starts_at: string | null;
          status: Database["public"]["Enums"]["exam_status"];
          tenant_id: string;
          title: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          assessment_type_id?: string | null;
          campus_id?: string | null;
          course_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          deleted_at?: string | null;
          deleted_by?: string | null;
          duration_minutes?: number | null;
          ends_at?: string | null;
          exam_date?: string | null;
          exam_session_id: string;
          external_weightage?: number;
          grading_scale_id?: string | null;
          id?: string;
          instructions?: string | null;
          internal_weightage?: number;
          max_marks?: number;
          metadata?: Json;
          min_attendance_percentage?: number | null;
          passing_marks?: number;
          program_id?: string | null;
          section_id?: string | null;
          semester_id?: string | null;
          starts_at?: string | null;
          status?: Database["public"]["Enums"]["exam_status"];
          tenant_id: string;
          title: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          assessment_type_id?: string | null;
          campus_id?: string | null;
          course_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          deleted_at?: string | null;
          deleted_by?: string | null;
          duration_minutes?: number | null;
          ends_at?: string | null;
          exam_date?: string | null;
          exam_session_id?: string;
          external_weightage?: number;
          grading_scale_id?: string | null;
          id?: string;
          instructions?: string | null;
          internal_weightage?: number;
          max_marks?: number;
          metadata?: Json;
          min_attendance_percentage?: number | null;
          passing_marks?: number;
          program_id?: string | null;
          section_id?: string | null;
          semester_id?: string | null;
          starts_at?: string | null;
          status?: Database["public"]["Enums"]["exam_status"];
          tenant_id?: string;
          title?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "exams_assessment_type_id_fkey";
            columns: ["assessment_type_id"];
            isOneToOne: false;
            referencedRelation: "assessment_types";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "exams_campus_id_fkey";
            columns: ["campus_id"];
            isOneToOne: false;
            referencedRelation: "campuses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "exams_course_id_fkey";
            columns: ["course_id"];
            isOneToOne: false;
            referencedRelation: "courses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "exams_exam_session_id_fkey";
            columns: ["exam_session_id"];
            isOneToOne: false;
            referencedRelation: "exam_sessions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "exams_grading_scale_id_fkey";
            columns: ["grading_scale_id"];
            isOneToOne: false;
            referencedRelation: "grading_scales";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "exams_program_id_fkey";
            columns: ["program_id"];
            isOneToOne: false;
            referencedRelation: "programs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "exams_section_id_fkey";
            columns: ["section_id"];
            isOneToOne: false;
            referencedRelation: "sections";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "exams_semester_id_fkey";
            columns: ["semester_id"];
            isOneToOne: false;
            referencedRelation: "semesters";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "exams_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      export_jobs: {
        Row: {
          columns: Json;
          created_at: string;
          created_by: string | null;
          entity_type: string;
          error: string | null;
          expires_at: string | null;
          filters: Json;
          format: Database["public"]["Enums"]["export_format"];
          id: string;
          row_count: number;
          status: Database["public"]["Enums"]["io_job_status"];
          storage_path: string | null;
          tenant_id: string;
          updated_at: string;
        };
        Insert: {
          columns?: Json;
          created_at?: string;
          created_by?: string | null;
          entity_type: string;
          error?: string | null;
          expires_at?: string | null;
          filters?: Json;
          format?: Database["public"]["Enums"]["export_format"];
          id?: string;
          row_count?: number;
          status?: Database["public"]["Enums"]["io_job_status"];
          storage_path?: string | null;
          tenant_id: string;
          updated_at?: string;
        };
        Update: {
          columns?: Json;
          created_at?: string;
          created_by?: string | null;
          entity_type?: string;
          error?: string | null;
          expires_at?: string | null;
          filters?: Json;
          format?: Database["public"]["Enums"]["export_format"];
          id?: string;
          row_count?: number;
          status?: Database["public"]["Enums"]["io_job_status"];
          storage_path?: string | null;
          tenant_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "export_jobs_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      faculty: {
        Row: {
          address: Json;
          campus_id: string | null;
          created_at: string;
          created_by: string | null;
          date_of_birth: string | null;
          date_of_joining: string | null;
          date_of_leaving: string | null;
          deleted_at: string | null;
          deleted_by: string | null;
          department_id: string | null;
          designation: string | null;
          email: string | null;
          employee_code: string;
          employment_status: Database["public"]["Enums"]["employment_status"];
          employment_type: Database["public"]["Enums"]["employment_type"];
          experience_years: number | null;
          first_name: string;
          gender: Database["public"]["Enums"]["gender"] | null;
          id: string;
          last_name: string | null;
          metadata: Json;
          phone: string | null;
          photo_url: string | null;
          qualification: string | null;
          specialization: string | null;
          tenant_id: string;
          updated_at: string;
          updated_by: string | null;
          user_id: string | null;
        };
        Insert: {
          address?: Json;
          campus_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          date_of_birth?: string | null;
          date_of_joining?: string | null;
          date_of_leaving?: string | null;
          deleted_at?: string | null;
          deleted_by?: string | null;
          department_id?: string | null;
          designation?: string | null;
          email?: string | null;
          employee_code: string;
          employment_status?: Database["public"]["Enums"]["employment_status"];
          employment_type?: Database["public"]["Enums"]["employment_type"];
          experience_years?: number | null;
          first_name: string;
          gender?: Database["public"]["Enums"]["gender"] | null;
          id?: string;
          last_name?: string | null;
          metadata?: Json;
          phone?: string | null;
          photo_url?: string | null;
          qualification?: string | null;
          specialization?: string | null;
          tenant_id: string;
          updated_at?: string;
          updated_by?: string | null;
          user_id?: string | null;
        };
        Update: {
          address?: Json;
          campus_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          date_of_birth?: string | null;
          date_of_joining?: string | null;
          date_of_leaving?: string | null;
          deleted_at?: string | null;
          deleted_by?: string | null;
          department_id?: string | null;
          designation?: string | null;
          email?: string | null;
          employee_code?: string;
          employment_status?: Database["public"]["Enums"]["employment_status"];
          employment_type?: Database["public"]["Enums"]["employment_type"];
          experience_years?: number | null;
          first_name?: string;
          gender?: Database["public"]["Enums"]["gender"] | null;
          id?: string;
          last_name?: string | null;
          metadata?: Json;
          phone?: string | null;
          photo_url?: string | null;
          qualification?: string | null;
          specialization?: string | null;
          tenant_id?: string;
          updated_at?: string;
          updated_by?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "faculty_campus_id_fkey";
            columns: ["campus_id"];
            isOneToOne: false;
            referencedRelation: "campuses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "faculty_department_id_fkey";
            columns: ["department_id"];
            isOneToOne: false;
            referencedRelation: "departments";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "faculty_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      faculty_allocations: {
        Row: {
          academic_session_id: string | null;
          campus_id: string | null;
          course_id: string;
          created_at: string;
          created_by: string | null;
          deleted_at: string | null;
          deleted_by: string | null;
          faculty_id: string;
          hours_per_week: number;
          id: string;
          is_active: boolean;
          role: Database["public"]["Enums"]["allocation_role"];
          section_id: string | null;
          semester_id: string | null;
          tenant_id: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          academic_session_id?: string | null;
          campus_id?: string | null;
          course_id: string;
          created_at?: string;
          created_by?: string | null;
          deleted_at?: string | null;
          deleted_by?: string | null;
          faculty_id: string;
          hours_per_week?: number;
          id?: string;
          is_active?: boolean;
          role?: Database["public"]["Enums"]["allocation_role"];
          section_id?: string | null;
          semester_id?: string | null;
          tenant_id: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          academic_session_id?: string | null;
          campus_id?: string | null;
          course_id?: string;
          created_at?: string;
          created_by?: string | null;
          deleted_at?: string | null;
          deleted_by?: string | null;
          faculty_id?: string;
          hours_per_week?: number;
          id?: string;
          is_active?: boolean;
          role?: Database["public"]["Enums"]["allocation_role"];
          section_id?: string | null;
          semester_id?: string | null;
          tenant_id?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "faculty_allocations_academic_session_id_fkey";
            columns: ["academic_session_id"];
            isOneToOne: false;
            referencedRelation: "academic_sessions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "faculty_allocations_campus_id_fkey";
            columns: ["campus_id"];
            isOneToOne: false;
            referencedRelation: "campuses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "faculty_allocations_course_id_fkey";
            columns: ["course_id"];
            isOneToOne: false;
            referencedRelation: "courses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "faculty_allocations_faculty_id_fkey";
            columns: ["faculty_id"];
            isOneToOne: false;
            referencedRelation: "faculty";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "faculty_allocations_section_id_fkey";
            columns: ["section_id"];
            isOneToOne: false;
            referencedRelation: "sections";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "faculty_allocations_semester_id_fkey";
            columns: ["semester_id"];
            isOneToOne: false;
            referencedRelation: "semesters";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "faculty_allocations_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      features: {
        Row: {
          created_at: string;
          default_enabled: boolean;
          description: string | null;
          id: string;
          is_beta: boolean;
          key: string;
          module: string;
          name: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          default_enabled?: boolean;
          description?: string | null;
          id?: string;
          is_beta?: boolean;
          key: string;
          module: string;
          name: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          default_enabled?: boolean;
          description?: string | null;
          id?: string;
          is_beta?: boolean;
          key?: string;
          module?: string;
          name?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      form_fields: {
        Row: {
          conditional_logic: Json;
          created_at: string;
          default_value: Json | null;
          field_type: Database["public"]["Enums"]["custom_field_type"];
          form_id: string;
          help_text: string | null;
          id: string;
          is_required: boolean;
          key: string;
          label: string;
          options: Json;
          placeholder: string | null;
          section: string | null;
          sort_order: number;
          tenant_id: string;
          updated_at: string;
          validation: Json;
          version: number;
          width: string;
        };
        Insert: {
          conditional_logic?: Json;
          created_at?: string;
          default_value?: Json | null;
          field_type?: Database["public"]["Enums"]["custom_field_type"];
          form_id: string;
          help_text?: string | null;
          id?: string;
          is_required?: boolean;
          key: string;
          label: string;
          options?: Json;
          placeholder?: string | null;
          section?: string | null;
          sort_order?: number;
          tenant_id: string;
          updated_at?: string;
          validation?: Json;
          version?: number;
          width?: string;
        };
        Update: {
          conditional_logic?: Json;
          created_at?: string;
          default_value?: Json | null;
          field_type?: Database["public"]["Enums"]["custom_field_type"];
          form_id?: string;
          help_text?: string | null;
          id?: string;
          is_required?: boolean;
          key?: string;
          label?: string;
          options?: Json;
          placeholder?: string | null;
          section?: string | null;
          sort_order?: number;
          tenant_id?: string;
          updated_at?: string;
          validation?: Json;
          version?: number;
          width?: string;
        };
        Relationships: [
          {
            foreignKeyName: "form_fields_form_id_fkey";
            columns: ["form_id"];
            isOneToOne: false;
            referencedRelation: "forms";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "form_fields_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      form_submission_values: {
        Row: {
          created_at: string;
          field_key: string;
          id: string;
          submission_id: string;
          tenant_id: string;
          value: Json | null;
        };
        Insert: {
          created_at?: string;
          field_key: string;
          id?: string;
          submission_id: string;
          tenant_id: string;
          value?: Json | null;
        };
        Update: {
          created_at?: string;
          field_key?: string;
          id?: string;
          submission_id?: string;
          tenant_id?: string;
          value?: Json | null;
        };
        Relationships: [
          {
            foreignKeyName: "form_submission_values_submission_id_fkey";
            columns: ["submission_id"];
            isOneToOne: false;
            referencedRelation: "form_submissions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "form_submission_values_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      form_submissions: {
        Row: {
          created_at: string;
          data: Json;
          deleted_at: string | null;
          deleted_by: string | null;
          entity_id: string | null;
          entity_type: string | null;
          form_id: string;
          id: string;
          status: string;
          submitted_at: string;
          submitted_by: string | null;
          tenant_id: string;
          updated_at: string;
          version: number;
          workflow_instance_id: string | null;
        };
        Insert: {
          created_at?: string;
          data?: Json;
          deleted_at?: string | null;
          deleted_by?: string | null;
          entity_id?: string | null;
          entity_type?: string | null;
          form_id: string;
          id?: string;
          status?: string;
          submitted_at?: string;
          submitted_by?: string | null;
          tenant_id: string;
          updated_at?: string;
          version?: number;
          workflow_instance_id?: string | null;
        };
        Update: {
          created_at?: string;
          data?: Json;
          deleted_at?: string | null;
          deleted_by?: string | null;
          entity_id?: string | null;
          entity_type?: string | null;
          form_id?: string;
          id?: string;
          status?: string;
          submitted_at?: string;
          submitted_by?: string | null;
          tenant_id?: string;
          updated_at?: string;
          version?: number;
          workflow_instance_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "form_submissions_form_id_fkey";
            columns: ["form_id"];
            isOneToOne: false;
            referencedRelation: "forms";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "form_submissions_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "form_submissions_workflow_instance_id_fkey";
            columns: ["workflow_instance_id"];
            isOneToOne: false;
            referencedRelation: "workflow_instances";
            referencedColumns: ["id"];
          },
        ];
      };
      form_versions: {
        Row: {
          created_at: string;
          created_by: string | null;
          form_id: string;
          id: string;
          is_published: boolean;
          published_at: string | null;
          schema: Json;
          tenant_id: string;
          version: number;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          form_id: string;
          id?: string;
          is_published?: boolean;
          published_at?: string | null;
          schema?: Json;
          tenant_id: string;
          version: number;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          form_id?: string;
          id?: string;
          is_published?: boolean;
          published_at?: string | null;
          schema?: Json;
          tenant_id?: string;
          version?: number;
        };
        Relationships: [
          {
            foreignKeyName: "form_versions_form_id_fkey";
            columns: ["form_id"];
            isOneToOne: false;
            referencedRelation: "forms";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "form_versions_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      forms: {
        Row: {
          created_at: string;
          created_by: string | null;
          current_version: number;
          deleted_at: string | null;
          deleted_by: string | null;
          description: string | null;
          entity_type: string | null;
          id: string;
          is_active: boolean;
          is_public: boolean;
          key: string;
          module: string | null;
          name: string;
          settings: Json;
          tenant_id: string;
          updated_at: string;
          updated_by: string | null;
          workflow_id: string | null;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          current_version?: number;
          deleted_at?: string | null;
          deleted_by?: string | null;
          description?: string | null;
          entity_type?: string | null;
          id?: string;
          is_active?: boolean;
          is_public?: boolean;
          key: string;
          module?: string | null;
          name: string;
          settings?: Json;
          tenant_id: string;
          updated_at?: string;
          updated_by?: string | null;
          workflow_id?: string | null;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          current_version?: number;
          deleted_at?: string | null;
          deleted_by?: string | null;
          description?: string | null;
          entity_type?: string | null;
          id?: string;
          is_active?: boolean;
          is_public?: boolean;
          key?: string;
          module?: string | null;
          name?: string;
          settings?: Json;
          tenant_id?: string;
          updated_at?: string;
          updated_by?: string | null;
          workflow_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "forms_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "forms_workflow_id_fkey";
            columns: ["workflow_id"];
            isOneToOne: false;
            referencedRelation: "workflows";
            referencedColumns: ["id"];
          },
        ];
      };
      grade_bands: {
        Row: {
          created_at: string;
          created_by: string | null;
          deleted_at: string | null;
          deleted_by: string | null;
          grade: string;
          grade_point: number;
          grading_scale_id: string;
          id: string;
          is_pass: boolean;
          max_percentage: number;
          min_percentage: number;
          remark: string | null;
          sort_order: number;
          tenant_id: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          deleted_at?: string | null;
          deleted_by?: string | null;
          grade: string;
          grade_point: number;
          grading_scale_id: string;
          id?: string;
          is_pass?: boolean;
          max_percentage: number;
          min_percentage: number;
          remark?: string | null;
          sort_order?: number;
          tenant_id: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          deleted_at?: string | null;
          deleted_by?: string | null;
          grade?: string;
          grade_point?: number;
          grading_scale_id?: string;
          id?: string;
          is_pass?: boolean;
          max_percentage?: number;
          min_percentage?: number;
          remark?: string | null;
          sort_order?: number;
          tenant_id?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "grade_bands_grading_scale_id_fkey";
            columns: ["grading_scale_id"];
            isOneToOne: false;
            referencedRelation: "grading_scales";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "grade_bands_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      grading_scales: {
        Row: {
          code: string;
          created_at: string;
          created_by: string | null;
          deleted_at: string | null;
          deleted_by: string | null;
          description: string | null;
          id: string;
          is_active: boolean;
          is_default: boolean;
          max_grade_point: number;
          name: string;
          passing_grade_point: number;
          program_id: string | null;
          tenant_id: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          code: string;
          created_at?: string;
          created_by?: string | null;
          deleted_at?: string | null;
          deleted_by?: string | null;
          description?: string | null;
          id?: string;
          is_active?: boolean;
          is_default?: boolean;
          max_grade_point?: number;
          name: string;
          passing_grade_point?: number;
          program_id?: string | null;
          tenant_id: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          code?: string;
          created_at?: string;
          created_by?: string | null;
          deleted_at?: string | null;
          deleted_by?: string | null;
          description?: string | null;
          id?: string;
          is_active?: boolean;
          is_default?: boolean;
          max_grade_point?: number;
          name?: string;
          passing_grade_point?: number;
          program_id?: string | null;
          tenant_id?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "grading_scales_program_id_fkey";
            columns: ["program_id"];
            isOneToOne: false;
            referencedRelation: "programs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "grading_scales_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      hall_tickets: {
        Row: {
          created_at: string;
          created_by: string | null;
          deleted_at: string | null;
          deleted_by: string | null;
          exam_session_id: string;
          id: string;
          is_revoked: boolean;
          issued_at: string;
          payload: Json;
          revoked_reason: string | null;
          student_id: string;
          tenant_id: string;
          ticket_number: string;
          updated_at: string;
          updated_by: string | null;
          valid_until: string | null;
          verification_code: string;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          deleted_at?: string | null;
          deleted_by?: string | null;
          exam_session_id: string;
          id?: string;
          is_revoked?: boolean;
          issued_at?: string;
          payload?: Json;
          revoked_reason?: string | null;
          student_id: string;
          tenant_id: string;
          ticket_number: string;
          updated_at?: string;
          updated_by?: string | null;
          valid_until?: string | null;
          verification_code: string;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          deleted_at?: string | null;
          deleted_by?: string | null;
          exam_session_id?: string;
          id?: string;
          is_revoked?: boolean;
          issued_at?: string;
          payload?: Json;
          revoked_reason?: string | null;
          student_id?: string;
          tenant_id?: string;
          ticket_number?: string;
          updated_at?: string;
          updated_by?: string | null;
          valid_until?: string | null;
          verification_code?: string;
        };
        Relationships: [
          {
            foreignKeyName: "hall_tickets_exam_session_id_fkey";
            columns: ["exam_session_id"];
            isOneToOne: false;
            referencedRelation: "exam_sessions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "hall_tickets_student_id_fkey";
            columns: ["student_id"];
            isOneToOne: false;
            referencedRelation: "students";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "hall_tickets_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      import_errors: {
        Row: {
          column_name: string | null;
          created_at: string;
          id: string;
          import_job_id: string;
          message: string;
          raw_row: Json | null;
          row_number: number;
          tenant_id: string;
        };
        Insert: {
          column_name?: string | null;
          created_at?: string;
          id?: string;
          import_job_id: string;
          message: string;
          raw_row?: Json | null;
          row_number: number;
          tenant_id: string;
        };
        Update: {
          column_name?: string | null;
          created_at?: string;
          id?: string;
          import_job_id?: string;
          message?: string;
          raw_row?: Json | null;
          row_number?: number;
          tenant_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "import_errors_import_job_id_fkey";
            columns: ["import_job_id"];
            isOneToOne: false;
            referencedRelation: "import_jobs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "import_errors_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      import_jobs: {
        Row: {
          created_at: string;
          created_by: string | null;
          entity_type: string;
          error: string | null;
          error_rows: number;
          file_name: string | null;
          finished_at: string | null;
          id: string;
          mapping_id: string | null;
          options: Json;
          processed_rows: number;
          started_at: string | null;
          status: Database["public"]["Enums"]["io_job_status"];
          storage_path: string | null;
          success_rows: number;
          tenant_id: string;
          total_rows: number;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          entity_type: string;
          error?: string | null;
          error_rows?: number;
          file_name?: string | null;
          finished_at?: string | null;
          id?: string;
          mapping_id?: string | null;
          options?: Json;
          processed_rows?: number;
          started_at?: string | null;
          status?: Database["public"]["Enums"]["io_job_status"];
          storage_path?: string | null;
          success_rows?: number;
          tenant_id: string;
          total_rows?: number;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          entity_type?: string;
          error?: string | null;
          error_rows?: number;
          file_name?: string | null;
          finished_at?: string | null;
          id?: string;
          mapping_id?: string | null;
          options?: Json;
          processed_rows?: number;
          started_at?: string | null;
          status?: Database["public"]["Enums"]["io_job_status"];
          storage_path?: string | null;
          success_rows?: number;
          tenant_id?: string;
          total_rows?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "import_jobs_mapping_id_fkey";
            columns: ["mapping_id"];
            isOneToOne: false;
            referencedRelation: "import_mappings";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "import_jobs_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      import_mappings: {
        Row: {
          created_at: string;
          created_by: string | null;
          entity_type: string;
          id: string;
          is_default: boolean;
          mapping: Json;
          name: string;
          tenant_id: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          entity_type: string;
          id?: string;
          is_default?: boolean;
          mapping?: Json;
          name: string;
          tenant_id: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          entity_type?: string;
          id?: string;
          is_default?: boolean;
          mapping?: Json;
          name?: string;
          tenant_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "import_mappings_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      job_schedules: {
        Row: {
          created_at: string;
          created_by: string | null;
          cron_expression: string;
          id: string;
          is_active: boolean;
          job_type: string;
          last_run_at: string | null;
          name: string;
          next_run_at: string | null;
          payload: Json;
          tenant_id: string | null;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          cron_expression: string;
          id?: string;
          is_active?: boolean;
          job_type: string;
          last_run_at?: string | null;
          name: string;
          next_run_at?: string | null;
          payload?: Json;
          tenant_id?: string | null;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          cron_expression?: string;
          id?: string;
          is_active?: boolean;
          job_type?: string;
          last_run_at?: string | null;
          name?: string;
          next_run_at?: string | null;
          payload?: Json;
          tenant_id?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "job_schedules_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      jobs: {
        Row: {
          attempts: number;
          created_at: string;
          created_by: string | null;
          error: string | null;
          id: string;
          locked_at: string | null;
          locked_by: string | null;
          max_attempts: number;
          payload: Json;
          priority: number;
          result: Json | null;
          run_at: string;
          status: Database["public"]["Enums"]["job_status"];
          tenant_id: string | null;
          type: string;
          updated_at: string;
        };
        Insert: {
          attempts?: number;
          created_at?: string;
          created_by?: string | null;
          error?: string | null;
          id?: string;
          locked_at?: string | null;
          locked_by?: string | null;
          max_attempts?: number;
          payload?: Json;
          priority?: number;
          result?: Json | null;
          run_at?: string;
          status?: Database["public"]["Enums"]["job_status"];
          tenant_id?: string | null;
          type: string;
          updated_at?: string;
        };
        Update: {
          attempts?: number;
          created_at?: string;
          created_by?: string | null;
          error?: string | null;
          id?: string;
          locked_at?: string | null;
          locked_by?: string | null;
          max_attempts?: number;
          payload?: Json;
          priority?: number;
          result?: Json | null;
          run_at?: string;
          status?: Database["public"]["Enums"]["job_status"];
          tenant_id?: string | null;
          type?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "jobs_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      leave_requests: {
        Row: {
          adjusts_attendance: boolean;
          attachment_id: string | null;
          attendee_kind: Database["public"]["Enums"]["attendee_kind"];
          created_at: string;
          created_by: string | null;
          deleted_at: string | null;
          faculty_id: string | null;
          from_date: string;
          id: string;
          is_half_day: boolean;
          leave_kind: Database["public"]["Enums"]["leave_kind"];
          reason: string | null;
          requested_by: string | null;
          review_notes: string | null;
          reviewed_at: string | null;
          reviewed_by: string | null;
          staff_id: string | null;
          status: Database["public"]["Enums"]["approval_state"];
          student_id: string | null;
          tenant_id: string;
          to_date: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          adjusts_attendance?: boolean;
          attachment_id?: string | null;
          attendee_kind?: Database["public"]["Enums"]["attendee_kind"];
          created_at?: string;
          created_by?: string | null;
          deleted_at?: string | null;
          faculty_id?: string | null;
          from_date: string;
          id?: string;
          is_half_day?: boolean;
          leave_kind?: Database["public"]["Enums"]["leave_kind"];
          reason?: string | null;
          requested_by?: string | null;
          review_notes?: string | null;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          staff_id?: string | null;
          status?: Database["public"]["Enums"]["approval_state"];
          student_id?: string | null;
          tenant_id: string;
          to_date: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          adjusts_attendance?: boolean;
          attachment_id?: string | null;
          attendee_kind?: Database["public"]["Enums"]["attendee_kind"];
          created_at?: string;
          created_by?: string | null;
          deleted_at?: string | null;
          faculty_id?: string | null;
          from_date?: string;
          id?: string;
          is_half_day?: boolean;
          leave_kind?: Database["public"]["Enums"]["leave_kind"];
          reason?: string | null;
          requested_by?: string | null;
          review_notes?: string | null;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          staff_id?: string | null;
          status?: Database["public"]["Enums"]["approval_state"];
          student_id?: string | null;
          tenant_id?: string;
          to_date?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "leave_requests_attachment_id_fkey";
            columns: ["attachment_id"];
            isOneToOne: false;
            referencedRelation: "attachments";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "leave_requests_faculty_id_fkey";
            columns: ["faculty_id"];
            isOneToOne: false;
            referencedRelation: "faculty";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "leave_requests_staff_id_fkey";
            columns: ["staff_id"];
            isOneToOne: false;
            referencedRelation: "staff";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "leave_requests_student_id_fkey";
            columns: ["student_id"];
            isOneToOne: false;
            referencedRelation: "students";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "leave_requests_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      lms_announcements: {
        Row: {
          body: string;
          created_at: string;
          created_by: string | null;
          deleted_at: string | null;
          deleted_by: string | null;
          id: string;
          is_pinned: boolean;
          published_at: string;
          tenant_id: string;
          title: string;
          updated_at: string;
          updated_by: string | null;
          workspace_id: string;
        };
        Insert: {
          body: string;
          created_at?: string;
          created_by?: string | null;
          deleted_at?: string | null;
          deleted_by?: string | null;
          id?: string;
          is_pinned?: boolean;
          published_at?: string;
          tenant_id: string;
          title: string;
          updated_at?: string;
          updated_by?: string | null;
          workspace_id: string;
        };
        Update: {
          body?: string;
          created_at?: string;
          created_by?: string | null;
          deleted_at?: string | null;
          deleted_by?: string | null;
          id?: string;
          is_pinned?: boolean;
          published_at?: string;
          tenant_id?: string;
          title?: string;
          updated_at?: string;
          updated_by?: string | null;
          workspace_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "lms_announcements_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "lms_announcements_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "lms_workspaces";
            referencedColumns: ["id"];
          },
        ];
      };
      lms_assignment_group_members: {
        Row: {
          created_at: string;
          group_id: string;
          id: string;
          student_id: string;
          tenant_id: string;
        };
        Insert: {
          created_at?: string;
          group_id: string;
          id?: string;
          student_id: string;
          tenant_id: string;
        };
        Update: {
          created_at?: string;
          group_id?: string;
          id?: string;
          student_id?: string;
          tenant_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "lms_assignment_group_members_group_id_fkey";
            columns: ["group_id"];
            isOneToOne: false;
            referencedRelation: "lms_assignment_groups";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "lms_assignment_group_members_student_id_fkey";
            columns: ["student_id"];
            isOneToOne: false;
            referencedRelation: "students";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "lms_assignment_group_members_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      lms_assignment_groups: {
        Row: {
          assignment_id: string;
          created_at: string;
          created_by: string | null;
          deleted_at: string | null;
          deleted_by: string | null;
          id: string;
          leader_student_id: string | null;
          name: string;
          tenant_id: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          assignment_id: string;
          created_at?: string;
          created_by?: string | null;
          deleted_at?: string | null;
          deleted_by?: string | null;
          id?: string;
          leader_student_id?: string | null;
          name: string;
          tenant_id: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          assignment_id?: string;
          created_at?: string;
          created_by?: string | null;
          deleted_at?: string | null;
          deleted_by?: string | null;
          id?: string;
          leader_student_id?: string | null;
          name?: string;
          tenant_id?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "lms_assignment_groups_assignment_id_fkey";
            columns: ["assignment_id"];
            isOneToOne: false;
            referencedRelation: "lms_assignments";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "lms_assignment_groups_leader_student_id_fkey";
            columns: ["leader_student_id"];
            isOneToOne: false;
            referencedRelation: "students";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "lms_assignment_groups_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      lms_assignments: {
        Row: {
          allow_late: boolean;
          channel: Database["public"]["Enums"]["lms_submission_channel"];
          closes_at: string | null;
          course_id: string;
          created_at: string;
          created_by: string | null;
          deleted_at: string | null;
          deleted_by: string | null;
          due_at: string | null;
          group_size: number | null;
          id: string;
          instructions: string | null;
          late_penalty_percent: number;
          max_attempts: number;
          max_marks: number;
          mode: Database["public"]["Enums"]["lms_assignment_mode"];
          node_id: string | null;
          opens_at: string | null;
          published_at: string | null;
          rubric_id: string | null;
          status: Database["public"]["Enums"]["lms_publish_status"];
          tenant_id: string;
          title: string;
          updated_at: string;
          updated_by: string | null;
          weightage: number;
          workspace_id: string;
        };
        Insert: {
          allow_late?: boolean;
          channel?: Database["public"]["Enums"]["lms_submission_channel"];
          closes_at?: string | null;
          course_id: string;
          created_at?: string;
          created_by?: string | null;
          deleted_at?: string | null;
          deleted_by?: string | null;
          due_at?: string | null;
          group_size?: number | null;
          id?: string;
          instructions?: string | null;
          late_penalty_percent?: number;
          max_attempts?: number;
          max_marks?: number;
          mode?: Database["public"]["Enums"]["lms_assignment_mode"];
          node_id?: string | null;
          opens_at?: string | null;
          published_at?: string | null;
          rubric_id?: string | null;
          status?: Database["public"]["Enums"]["lms_publish_status"];
          tenant_id: string;
          title: string;
          updated_at?: string;
          updated_by?: string | null;
          weightage?: number;
          workspace_id: string;
        };
        Update: {
          allow_late?: boolean;
          channel?: Database["public"]["Enums"]["lms_submission_channel"];
          closes_at?: string | null;
          course_id?: string;
          created_at?: string;
          created_by?: string | null;
          deleted_at?: string | null;
          deleted_by?: string | null;
          due_at?: string | null;
          group_size?: number | null;
          id?: string;
          instructions?: string | null;
          late_penalty_percent?: number;
          max_attempts?: number;
          max_marks?: number;
          mode?: Database["public"]["Enums"]["lms_assignment_mode"];
          node_id?: string | null;
          opens_at?: string | null;
          published_at?: string | null;
          rubric_id?: string | null;
          status?: Database["public"]["Enums"]["lms_publish_status"];
          tenant_id?: string;
          title?: string;
          updated_at?: string;
          updated_by?: string | null;
          weightage?: number;
          workspace_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "lms_assignments_course_id_fkey";
            columns: ["course_id"];
            isOneToOne: false;
            referencedRelation: "courses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "lms_assignments_node_id_fkey";
            columns: ["node_id"];
            isOneToOne: false;
            referencedRelation: "lms_nodes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "lms_assignments_rubric_id_fkey";
            columns: ["rubric_id"];
            isOneToOne: false;
            referencedRelation: "rubrics";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "lms_assignments_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "lms_assignments_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "lms_workspaces";
            referencedColumns: ["id"];
          },
        ];
      };
      lms_content_items: {
        Row: {
          body: string | null;
          created_at: string;
          created_by: string | null;
          deleted_at: string | null;
          deleted_by: string | null;
          duration_seconds: number | null;
          file_name: string | null;
          file_size: number | null;
          id: string;
          is_downloadable: boolean;
          kind: Database["public"]["Enums"]["lms_content_kind"];
          library_item_id: string | null;
          media_asset_id: string | null;
          mime_type: string | null;
          node_id: string | null;
          position: number;
          published_at: string | null;
          scheduled_at: string | null;
          status: Database["public"]["Enums"]["lms_publish_status"];
          tenant_id: string;
          title: string;
          updated_at: string;
          updated_by: string | null;
          url: string | null;
          version: number;
          workspace_id: string;
        };
        Insert: {
          body?: string | null;
          created_at?: string;
          created_by?: string | null;
          deleted_at?: string | null;
          deleted_by?: string | null;
          duration_seconds?: number | null;
          file_name?: string | null;
          file_size?: number | null;
          id?: string;
          is_downloadable?: boolean;
          kind?: Database["public"]["Enums"]["lms_content_kind"];
          library_item_id?: string | null;
          media_asset_id?: string | null;
          mime_type?: string | null;
          node_id?: string | null;
          position?: number;
          published_at?: string | null;
          scheduled_at?: string | null;
          status?: Database["public"]["Enums"]["lms_publish_status"];
          tenant_id: string;
          title: string;
          updated_at?: string;
          updated_by?: string | null;
          url?: string | null;
          version?: number;
          workspace_id: string;
        };
        Update: {
          body?: string | null;
          created_at?: string;
          created_by?: string | null;
          deleted_at?: string | null;
          deleted_by?: string | null;
          duration_seconds?: number | null;
          file_name?: string | null;
          file_size?: number | null;
          id?: string;
          is_downloadable?: boolean;
          kind?: Database["public"]["Enums"]["lms_content_kind"];
          library_item_id?: string | null;
          media_asset_id?: string | null;
          mime_type?: string | null;
          node_id?: string | null;
          position?: number;
          published_at?: string | null;
          scheduled_at?: string | null;
          status?: Database["public"]["Enums"]["lms_publish_status"];
          tenant_id?: string;
          title?: string;
          updated_at?: string;
          updated_by?: string | null;
          url?: string | null;
          version?: number;
          workspace_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "lms_content_items_library_item_id_fkey";
            columns: ["library_item_id"];
            isOneToOne: false;
            referencedRelation: "lms_library_items";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "lms_content_items_media_asset_id_fkey";
            columns: ["media_asset_id"];
            isOneToOne: false;
            referencedRelation: "media_assets";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "lms_content_items_node_id_fkey";
            columns: ["node_id"];
            isOneToOne: false;
            referencedRelation: "lms_nodes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "lms_content_items_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "lms_content_items_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "lms_workspaces";
            referencedColumns: ["id"];
          },
        ];
      };
      lms_content_versions: {
        Row: {
          changed_by: string | null;
          content_item_id: string;
          created_at: string;
          id: string;
          note: string | null;
          snapshot: Json;
          tenant_id: string;
          version: number;
        };
        Insert: {
          changed_by?: string | null;
          content_item_id: string;
          created_at?: string;
          id?: string;
          note?: string | null;
          snapshot: Json;
          tenant_id: string;
          version: number;
        };
        Update: {
          changed_by?: string | null;
          content_item_id?: string;
          created_at?: string;
          id?: string;
          note?: string | null;
          snapshot?: Json;
          tenant_id?: string;
          version?: number;
        };
        Relationships: [
          {
            foreignKeyName: "lms_content_versions_content_item_id_fkey";
            columns: ["content_item_id"];
            isOneToOne: false;
            referencedRelation: "lms_content_items";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "lms_content_versions_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      lms_discussion_posts: {
        Row: {
          body: string;
          created_at: string;
          created_by: string | null;
          deleted_at: string | null;
          deleted_by: string | null;
          discussion_id: string;
          id: string;
          is_answer: boolean;
          is_hidden: boolean;
          mentions: string[];
          parent_id: string | null;
          tenant_id: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          body: string;
          created_at?: string;
          created_by?: string | null;
          deleted_at?: string | null;
          deleted_by?: string | null;
          discussion_id: string;
          id?: string;
          is_answer?: boolean;
          is_hidden?: boolean;
          mentions?: string[];
          parent_id?: string | null;
          tenant_id: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          body?: string;
          created_at?: string;
          created_by?: string | null;
          deleted_at?: string | null;
          deleted_by?: string | null;
          discussion_id?: string;
          id?: string;
          is_answer?: boolean;
          is_hidden?: boolean;
          mentions?: string[];
          parent_id?: string | null;
          tenant_id?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "lms_discussion_posts_discussion_id_fkey";
            columns: ["discussion_id"];
            isOneToOne: false;
            referencedRelation: "lms_discussions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "lms_discussion_posts_parent_id_fkey";
            columns: ["parent_id"];
            isOneToOne: false;
            referencedRelation: "lms_discussion_posts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "lms_discussion_posts_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      lms_discussions: {
        Row: {
          body: string | null;
          created_at: string;
          created_by: string | null;
          deleted_at: string | null;
          deleted_by: string | null;
          id: string;
          is_locked: boolean;
          is_pinned: boolean;
          is_resolved: boolean;
          kind: Database["public"]["Enums"]["lms_discussion_kind"];
          last_activity_at: string;
          reply_count: number;
          resolved_post_id: string | null;
          tenant_id: string;
          title: string;
          updated_at: string;
          updated_by: string | null;
          workspace_id: string;
        };
        Insert: {
          body?: string | null;
          created_at?: string;
          created_by?: string | null;
          deleted_at?: string | null;
          deleted_by?: string | null;
          id?: string;
          is_locked?: boolean;
          is_pinned?: boolean;
          is_resolved?: boolean;
          kind?: Database["public"]["Enums"]["lms_discussion_kind"];
          last_activity_at?: string;
          reply_count?: number;
          resolved_post_id?: string | null;
          tenant_id: string;
          title: string;
          updated_at?: string;
          updated_by?: string | null;
          workspace_id: string;
        };
        Update: {
          body?: string | null;
          created_at?: string;
          created_by?: string | null;
          deleted_at?: string | null;
          deleted_by?: string | null;
          id?: string;
          is_locked?: boolean;
          is_pinned?: boolean;
          is_resolved?: boolean;
          kind?: Database["public"]["Enums"]["lms_discussion_kind"];
          last_activity_at?: string;
          reply_count?: number;
          resolved_post_id?: string | null;
          tenant_id?: string;
          title?: string;
          updated_at?: string;
          updated_by?: string | null;
          workspace_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "lms_discussions_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "lms_discussions_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "lms_workspaces";
            referencedColumns: ["id"];
          },
        ];
      };
      lms_grades: {
        Row: {
          assignment_id: string;
          created_at: string;
          created_by: string | null;
          deleted_at: string | null;
          deleted_by: string | null;
          evaluated_at: string | null;
          evaluated_by: string | null;
          feedback: string | null;
          grade: string | null;
          id: string;
          is_published: boolean;
          marks: number | null;
          rubric_scores: Json;
          submission_id: string;
          tenant_id: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          assignment_id: string;
          created_at?: string;
          created_by?: string | null;
          deleted_at?: string | null;
          deleted_by?: string | null;
          evaluated_at?: string | null;
          evaluated_by?: string | null;
          feedback?: string | null;
          grade?: string | null;
          id?: string;
          is_published?: boolean;
          marks?: number | null;
          rubric_scores?: Json;
          submission_id: string;
          tenant_id: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          assignment_id?: string;
          created_at?: string;
          created_by?: string | null;
          deleted_at?: string | null;
          deleted_by?: string | null;
          evaluated_at?: string | null;
          evaluated_by?: string | null;
          feedback?: string | null;
          grade?: string | null;
          id?: string;
          is_published?: boolean;
          marks?: number | null;
          rubric_scores?: Json;
          submission_id?: string;
          tenant_id?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "lms_grades_assignment_id_fkey";
            columns: ["assignment_id"];
            isOneToOne: false;
            referencedRelation: "lms_assignments";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "lms_grades_submission_id_fkey";
            columns: ["submission_id"];
            isOneToOne: true;
            referencedRelation: "lms_submissions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "lms_grades_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      lms_lesson_plans: {
        Row: {
          activities: string | null;
          ai_generated: boolean;
          ai_prompt: string | null;
          assessment: string | null;
          bloom_level: Database["public"]["Enums"]["bloom_level"] | null;
          completed_at: string | null;
          course_id: string;
          course_outcome_id: string | null;
          created_at: string;
          created_by: string | null;
          deleted_at: string | null;
          deleted_by: string | null;
          faculty_id: string | null;
          id: string;
          kind: Database["public"]["Enums"]["lms_plan_kind"];
          objectives: string | null;
          planned_date: string | null;
          planned_hours: number | null;
          program_outcome_id: string | null;
          resources: string | null;
          status: Database["public"]["Enums"]["lms_publish_status"];
          tenant_id: string;
          title: string;
          updated_at: string;
          updated_by: string | null;
          week_number: number | null;
          workspace_id: string | null;
        };
        Insert: {
          activities?: string | null;
          ai_generated?: boolean;
          ai_prompt?: string | null;
          assessment?: string | null;
          bloom_level?: Database["public"]["Enums"]["bloom_level"] | null;
          completed_at?: string | null;
          course_id: string;
          course_outcome_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          deleted_at?: string | null;
          deleted_by?: string | null;
          faculty_id?: string | null;
          id?: string;
          kind?: Database["public"]["Enums"]["lms_plan_kind"];
          objectives?: string | null;
          planned_date?: string | null;
          planned_hours?: number | null;
          program_outcome_id?: string | null;
          resources?: string | null;
          status?: Database["public"]["Enums"]["lms_publish_status"];
          tenant_id: string;
          title: string;
          updated_at?: string;
          updated_by?: string | null;
          week_number?: number | null;
          workspace_id?: string | null;
        };
        Update: {
          activities?: string | null;
          ai_generated?: boolean;
          ai_prompt?: string | null;
          assessment?: string | null;
          bloom_level?: Database["public"]["Enums"]["bloom_level"] | null;
          completed_at?: string | null;
          course_id?: string;
          course_outcome_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          deleted_at?: string | null;
          deleted_by?: string | null;
          faculty_id?: string | null;
          id?: string;
          kind?: Database["public"]["Enums"]["lms_plan_kind"];
          objectives?: string | null;
          planned_date?: string | null;
          planned_hours?: number | null;
          program_outcome_id?: string | null;
          resources?: string | null;
          status?: Database["public"]["Enums"]["lms_publish_status"];
          tenant_id?: string;
          title?: string;
          updated_at?: string;
          updated_by?: string | null;
          week_number?: number | null;
          workspace_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "lms_lesson_plans_course_id_fkey";
            columns: ["course_id"];
            isOneToOne: false;
            referencedRelation: "courses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "lms_lesson_plans_course_outcome_id_fkey";
            columns: ["course_outcome_id"];
            isOneToOne: false;
            referencedRelation: "course_outcomes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "lms_lesson_plans_faculty_id_fkey";
            columns: ["faculty_id"];
            isOneToOne: false;
            referencedRelation: "faculty";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "lms_lesson_plans_program_outcome_id_fkey";
            columns: ["program_outcome_id"];
            isOneToOne: false;
            referencedRelation: "program_outcomes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "lms_lesson_plans_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "lms_lesson_plans_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "lms_workspaces";
            referencedColumns: ["id"];
          },
        ];
      };
      lms_library_items: {
        Row: {
          body: string | null;
          category: string | null;
          created_at: string;
          created_by: string | null;
          deleted_at: string | null;
          deleted_by: string | null;
          description: string | null;
          folder_id: string | null;
          id: string;
          kind: Database["public"]["Enums"]["lms_content_kind"];
          media_asset_id: string | null;
          reuse_count: number;
          tenant_id: string;
          title: string;
          updated_at: string;
          updated_by: string | null;
          url: string | null;
          version: number;
        };
        Insert: {
          body?: string | null;
          category?: string | null;
          created_at?: string;
          created_by?: string | null;
          deleted_at?: string | null;
          deleted_by?: string | null;
          description?: string | null;
          folder_id?: string | null;
          id?: string;
          kind?: Database["public"]["Enums"]["lms_content_kind"];
          media_asset_id?: string | null;
          reuse_count?: number;
          tenant_id: string;
          title: string;
          updated_at?: string;
          updated_by?: string | null;
          url?: string | null;
          version?: number;
        };
        Update: {
          body?: string | null;
          category?: string | null;
          created_at?: string;
          created_by?: string | null;
          deleted_at?: string | null;
          deleted_by?: string | null;
          description?: string | null;
          folder_id?: string | null;
          id?: string;
          kind?: Database["public"]["Enums"]["lms_content_kind"];
          media_asset_id?: string | null;
          reuse_count?: number;
          tenant_id?: string;
          title?: string;
          updated_at?: string;
          updated_by?: string | null;
          url?: string | null;
          version?: number;
        };
        Relationships: [
          {
            foreignKeyName: "lms_library_items_folder_id_fkey";
            columns: ["folder_id"];
            isOneToOne: false;
            referencedRelation: "media_folders";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "lms_library_items_media_asset_id_fkey";
            columns: ["media_asset_id"];
            isOneToOne: false;
            referencedRelation: "media_assets";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "lms_library_items_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      lms_live_classes: {
        Row: {
          agenda: string | null;
          attendance_session_id: string | null;
          calendar_event_id: string | null;
          created_at: string;
          created_by: string | null;
          deleted_at: string | null;
          deleted_by: string | null;
          faculty_id: string | null;
          id: string;
          join_url: string | null;
          provider: Database["public"]["Enums"]["lms_live_provider"];
          recording_url: string | null;
          scheduled_end: string | null;
          scheduled_start: string;
          status: string;
          tenant_id: string;
          timetable_entry_id: string | null;
          title: string;
          updated_at: string;
          updated_by: string | null;
          workspace_id: string;
        };
        Insert: {
          agenda?: string | null;
          attendance_session_id?: string | null;
          calendar_event_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          deleted_at?: string | null;
          deleted_by?: string | null;
          faculty_id?: string | null;
          id?: string;
          join_url?: string | null;
          provider?: Database["public"]["Enums"]["lms_live_provider"];
          recording_url?: string | null;
          scheduled_end?: string | null;
          scheduled_start: string;
          status?: string;
          tenant_id: string;
          timetable_entry_id?: string | null;
          title: string;
          updated_at?: string;
          updated_by?: string | null;
          workspace_id: string;
        };
        Update: {
          agenda?: string | null;
          attendance_session_id?: string | null;
          calendar_event_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          deleted_at?: string | null;
          deleted_by?: string | null;
          faculty_id?: string | null;
          id?: string;
          join_url?: string | null;
          provider?: Database["public"]["Enums"]["lms_live_provider"];
          recording_url?: string | null;
          scheduled_end?: string | null;
          scheduled_start?: string;
          status?: string;
          tenant_id?: string;
          timetable_entry_id?: string | null;
          title?: string;
          updated_at?: string;
          updated_by?: string | null;
          workspace_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "lms_live_classes_attendance_session_id_fkey";
            columns: ["attendance_session_id"];
            isOneToOne: false;
            referencedRelation: "attendance_sessions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "lms_live_classes_calendar_event_id_fkey";
            columns: ["calendar_event_id"];
            isOneToOne: false;
            referencedRelation: "calendar_events";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "lms_live_classes_faculty_id_fkey";
            columns: ["faculty_id"];
            isOneToOne: false;
            referencedRelation: "faculty";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "lms_live_classes_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "lms_live_classes_timetable_entry_id_fkey";
            columns: ["timetable_entry_id"];
            isOneToOne: false;
            referencedRelation: "timetable_entries";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "lms_live_classes_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "lms_workspaces";
            referencedColumns: ["id"];
          },
        ];
      };
      lms_nodes: {
        Row: {
          bloom_level: Database["public"]["Enums"]["bloom_level"] | null;
          course_outcome_id: string | null;
          created_at: string;
          created_by: string | null;
          deleted_at: string | null;
          deleted_by: string | null;
          description: string | null;
          duration_minutes: number | null;
          id: string;
          is_mandatory: boolean;
          kind: Database["public"]["Enums"]["lms_node_kind"];
          parent_id: string | null;
          position: number;
          published_at: string | null;
          scheduled_at: string | null;
          status: Database["public"]["Enums"]["lms_publish_status"];
          tenant_id: string;
          title: string;
          updated_at: string;
          updated_by: string | null;
          workspace_id: string;
        };
        Insert: {
          bloom_level?: Database["public"]["Enums"]["bloom_level"] | null;
          course_outcome_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          deleted_at?: string | null;
          deleted_by?: string | null;
          description?: string | null;
          duration_minutes?: number | null;
          id?: string;
          is_mandatory?: boolean;
          kind?: Database["public"]["Enums"]["lms_node_kind"];
          parent_id?: string | null;
          position?: number;
          published_at?: string | null;
          scheduled_at?: string | null;
          status?: Database["public"]["Enums"]["lms_publish_status"];
          tenant_id: string;
          title: string;
          updated_at?: string;
          updated_by?: string | null;
          workspace_id: string;
        };
        Update: {
          bloom_level?: Database["public"]["Enums"]["bloom_level"] | null;
          course_outcome_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          deleted_at?: string | null;
          deleted_by?: string | null;
          description?: string | null;
          duration_minutes?: number | null;
          id?: string;
          is_mandatory?: boolean;
          kind?: Database["public"]["Enums"]["lms_node_kind"];
          parent_id?: string | null;
          position?: number;
          published_at?: string | null;
          scheduled_at?: string | null;
          status?: Database["public"]["Enums"]["lms_publish_status"];
          tenant_id?: string;
          title?: string;
          updated_at?: string;
          updated_by?: string | null;
          workspace_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "lms_nodes_course_outcome_id_fkey";
            columns: ["course_outcome_id"];
            isOneToOne: false;
            referencedRelation: "course_outcomes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "lms_nodes_parent_id_fkey";
            columns: ["parent_id"];
            isOneToOne: false;
            referencedRelation: "lms_nodes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "lms_nodes_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "lms_nodes_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "lms_workspaces";
            referencedColumns: ["id"];
          },
        ];
      };
      lms_progress: {
        Row: {
          completed_at: string | null;
          content_item_id: string | null;
          created_at: string;
          created_by: string | null;
          id: string;
          last_accessed_at: string;
          node_id: string | null;
          progress_percent: number;
          state: Database["public"]["Enums"]["lms_progress_state"];
          student_id: string;
          tenant_id: string;
          time_spent_seconds: number;
          updated_at: string;
          updated_by: string | null;
          workspace_id: string;
        };
        Insert: {
          completed_at?: string | null;
          content_item_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          last_accessed_at?: string;
          node_id?: string | null;
          progress_percent?: number;
          state?: Database["public"]["Enums"]["lms_progress_state"];
          student_id: string;
          tenant_id: string;
          time_spent_seconds?: number;
          updated_at?: string;
          updated_by?: string | null;
          workspace_id: string;
        };
        Update: {
          completed_at?: string | null;
          content_item_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          last_accessed_at?: string;
          node_id?: string | null;
          progress_percent?: number;
          state?: Database["public"]["Enums"]["lms_progress_state"];
          student_id?: string;
          tenant_id?: string;
          time_spent_seconds?: number;
          updated_at?: string;
          updated_by?: string | null;
          workspace_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "lms_progress_content_item_id_fkey";
            columns: ["content_item_id"];
            isOneToOne: false;
            referencedRelation: "lms_content_items";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "lms_progress_node_id_fkey";
            columns: ["node_id"];
            isOneToOne: false;
            referencedRelation: "lms_nodes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "lms_progress_student_id_fkey";
            columns: ["student_id"];
            isOneToOne: false;
            referencedRelation: "students";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "lms_progress_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "lms_progress_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "lms_workspaces";
            referencedColumns: ["id"];
          },
        ];
      };
      lms_quiz_attempts: {
        Row: {
          attempt_no: number;
          created_at: string;
          created_by: string | null;
          deleted_at: string | null;
          deleted_by: string | null;
          id: string;
          is_passed: boolean | null;
          percentage: number | null;
          question_order: Json;
          quiz_id: string;
          score: number | null;
          started_at: string;
          status: Database["public"]["Enums"]["lms_attempt_status"];
          student_id: string;
          submitted_at: string | null;
          tenant_id: string;
          time_spent_seconds: number;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          attempt_no?: number;
          created_at?: string;
          created_by?: string | null;
          deleted_at?: string | null;
          deleted_by?: string | null;
          id?: string;
          is_passed?: boolean | null;
          percentage?: number | null;
          question_order?: Json;
          quiz_id: string;
          score?: number | null;
          started_at?: string;
          status?: Database["public"]["Enums"]["lms_attempt_status"];
          student_id: string;
          submitted_at?: string | null;
          tenant_id: string;
          time_spent_seconds?: number;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          attempt_no?: number;
          created_at?: string;
          created_by?: string | null;
          deleted_at?: string | null;
          deleted_by?: string | null;
          id?: string;
          is_passed?: boolean | null;
          percentage?: number | null;
          question_order?: Json;
          quiz_id?: string;
          score?: number | null;
          started_at?: string;
          status?: Database["public"]["Enums"]["lms_attempt_status"];
          student_id?: string;
          submitted_at?: string | null;
          tenant_id?: string;
          time_spent_seconds?: number;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "lms_quiz_attempts_quiz_id_fkey";
            columns: ["quiz_id"];
            isOneToOne: false;
            referencedRelation: "lms_quizzes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "lms_quiz_attempts_student_id_fkey";
            columns: ["student_id"];
            isOneToOne: false;
            referencedRelation: "students";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "lms_quiz_attempts_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      lms_quiz_questions: {
        Row: {
          answer_key: Json;
          bloom_level: Database["public"]["Enums"]["bloom_level"] | null;
          body: string;
          created_at: string;
          created_by: string | null;
          deleted_at: string | null;
          deleted_by: string | null;
          difficulty: Database["public"]["Enums"]["question_difficulty"] | null;
          explanation: string | null;
          id: string;
          kind: Database["public"]["Enums"]["lms_question_kind"];
          marks: number;
          negative_marks: number;
          options: Json;
          pool_tag: string | null;
          position: number;
          question_id: string | null;
          quiz_id: string;
          tenant_id: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          answer_key?: Json;
          bloom_level?: Database["public"]["Enums"]["bloom_level"] | null;
          body: string;
          created_at?: string;
          created_by?: string | null;
          deleted_at?: string | null;
          deleted_by?: string | null;
          difficulty?: Database["public"]["Enums"]["question_difficulty"] | null;
          explanation?: string | null;
          id?: string;
          kind?: Database["public"]["Enums"]["lms_question_kind"];
          marks?: number;
          negative_marks?: number;
          options?: Json;
          pool_tag?: string | null;
          position?: number;
          question_id?: string | null;
          quiz_id: string;
          tenant_id: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          answer_key?: Json;
          bloom_level?: Database["public"]["Enums"]["bloom_level"] | null;
          body?: string;
          created_at?: string;
          created_by?: string | null;
          deleted_at?: string | null;
          deleted_by?: string | null;
          difficulty?: Database["public"]["Enums"]["question_difficulty"] | null;
          explanation?: string | null;
          id?: string;
          kind?: Database["public"]["Enums"]["lms_question_kind"];
          marks?: number;
          negative_marks?: number;
          options?: Json;
          pool_tag?: string | null;
          position?: number;
          question_id?: string | null;
          quiz_id?: string;
          tenant_id?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "lms_quiz_questions_question_id_fkey";
            columns: ["question_id"];
            isOneToOne: false;
            referencedRelation: "questions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "lms_quiz_questions_quiz_id_fkey";
            columns: ["quiz_id"];
            isOneToOne: false;
            referencedRelation: "lms_quizzes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "lms_quiz_questions_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      lms_quiz_responses: {
        Row: {
          attempt_id: string;
          created_at: string;
          evaluated_by: string | null;
          feedback: string | null;
          id: string;
          is_correct: boolean | null;
          marks_awarded: number;
          quiz_question_id: string;
          response: Json;
          tenant_id: string;
          updated_at: string;
        };
        Insert: {
          attempt_id: string;
          created_at?: string;
          evaluated_by?: string | null;
          feedback?: string | null;
          id?: string;
          is_correct?: boolean | null;
          marks_awarded?: number;
          quiz_question_id: string;
          response?: Json;
          tenant_id: string;
          updated_at?: string;
        };
        Update: {
          attempt_id?: string;
          created_at?: string;
          evaluated_by?: string | null;
          feedback?: string | null;
          id?: string;
          is_correct?: boolean | null;
          marks_awarded?: number;
          quiz_question_id?: string;
          response?: Json;
          tenant_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "lms_quiz_responses_attempt_id_fkey";
            columns: ["attempt_id"];
            isOneToOne: false;
            referencedRelation: "lms_quiz_attempts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "lms_quiz_responses_quiz_question_id_fkey";
            columns: ["quiz_question_id"];
            isOneToOne: false;
            referencedRelation: "lms_quiz_questions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "lms_quiz_responses_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      lms_quizzes: {
        Row: {
          closes_at: string | null;
          course_id: string;
          created_at: string;
          created_by: string | null;
          deleted_at: string | null;
          deleted_by: string | null;
          duration_minutes: number | null;
          id: string;
          instant_result: boolean;
          instructions: string | null;
          max_attempts: number;
          negative_marking: number;
          node_id: string | null;
          opens_at: string | null;
          pass_percent: number;
          pool_size: number | null;
          published_at: string | null;
          shuffle_options: boolean;
          shuffle_questions: boolean;
          status: Database["public"]["Enums"]["lms_publish_status"];
          tenant_id: string;
          title: string;
          total_marks: number;
          updated_at: string;
          updated_by: string | null;
          workspace_id: string;
        };
        Insert: {
          closes_at?: string | null;
          course_id: string;
          created_at?: string;
          created_by?: string | null;
          deleted_at?: string | null;
          deleted_by?: string | null;
          duration_minutes?: number | null;
          id?: string;
          instant_result?: boolean;
          instructions?: string | null;
          max_attempts?: number;
          negative_marking?: number;
          node_id?: string | null;
          opens_at?: string | null;
          pass_percent?: number;
          pool_size?: number | null;
          published_at?: string | null;
          shuffle_options?: boolean;
          shuffle_questions?: boolean;
          status?: Database["public"]["Enums"]["lms_publish_status"];
          tenant_id: string;
          title: string;
          total_marks?: number;
          updated_at?: string;
          updated_by?: string | null;
          workspace_id: string;
        };
        Update: {
          closes_at?: string | null;
          course_id?: string;
          created_at?: string;
          created_by?: string | null;
          deleted_at?: string | null;
          deleted_by?: string | null;
          duration_minutes?: number | null;
          id?: string;
          instant_result?: boolean;
          instructions?: string | null;
          max_attempts?: number;
          negative_marking?: number;
          node_id?: string | null;
          opens_at?: string | null;
          pass_percent?: number;
          pool_size?: number | null;
          published_at?: string | null;
          shuffle_options?: boolean;
          shuffle_questions?: boolean;
          status?: Database["public"]["Enums"]["lms_publish_status"];
          tenant_id?: string;
          title?: string;
          total_marks?: number;
          updated_at?: string;
          updated_by?: string | null;
          workspace_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "lms_quizzes_course_id_fkey";
            columns: ["course_id"];
            isOneToOne: false;
            referencedRelation: "courses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "lms_quizzes_node_id_fkey";
            columns: ["node_id"];
            isOneToOne: false;
            referencedRelation: "lms_nodes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "lms_quizzes_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "lms_quizzes_workspace_id_fkey";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedRelation: "lms_workspaces";
            referencedColumns: ["id"];
          },
        ];
      };
      lms_submission_files: {
        Row: {
          created_at: string;
          created_by: string | null;
          file_name: string;
          file_size: number | null;
          id: string;
          mime_type: string | null;
          storage_bucket: string;
          storage_path: string;
          submission_id: string;
          tenant_id: string;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          file_name: string;
          file_size?: number | null;
          id?: string;
          mime_type?: string | null;
          storage_bucket?: string;
          storage_path: string;
          submission_id: string;
          tenant_id: string;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          file_name?: string;
          file_size?: number | null;
          id?: string;
          mime_type?: string | null;
          storage_bucket?: string;
          storage_path?: string;
          submission_id?: string;
          tenant_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "lms_submission_files_submission_id_fkey";
            columns: ["submission_id"];
            isOneToOne: false;
            referencedRelation: "lms_submissions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "lms_submission_files_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      lms_submissions: {
        Row: {
          assignment_id: string;
          attempt_no: number;
          created_at: string;
          created_by: string | null;
          deleted_at: string | null;
          deleted_by: string | null;
          group_id: string | null;
          id: string;
          is_late: boolean;
          link_url: string | null;
          status: Database["public"]["Enums"]["lms_submission_status"];
          student_id: string;
          submitted_at: string | null;
          submitted_by: string | null;
          tenant_id: string;
          text_answer: string | null;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          assignment_id: string;
          attempt_no?: number;
          created_at?: string;
          created_by?: string | null;
          deleted_at?: string | null;
          deleted_by?: string | null;
          group_id?: string | null;
          id?: string;
          is_late?: boolean;
          link_url?: string | null;
          status?: Database["public"]["Enums"]["lms_submission_status"];
          student_id: string;
          submitted_at?: string | null;
          submitted_by?: string | null;
          tenant_id: string;
          text_answer?: string | null;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          assignment_id?: string;
          attempt_no?: number;
          created_at?: string;
          created_by?: string | null;
          deleted_at?: string | null;
          deleted_by?: string | null;
          group_id?: string | null;
          id?: string;
          is_late?: boolean;
          link_url?: string | null;
          status?: Database["public"]["Enums"]["lms_submission_status"];
          student_id?: string;
          submitted_at?: string | null;
          submitted_by?: string | null;
          tenant_id?: string;
          text_answer?: string | null;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "lms_submissions_assignment_id_fkey";
            columns: ["assignment_id"];
            isOneToOne: false;
            referencedRelation: "lms_assignments";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "lms_submissions_group_id_fkey";
            columns: ["group_id"];
            isOneToOne: false;
            referencedRelation: "lms_assignment_groups";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "lms_submissions_student_id_fkey";
            columns: ["student_id"];
            isOneToOne: false;
            referencedRelation: "students";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "lms_submissions_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      lms_workspaces: {
        Row: {
          academic_session_id: string | null;
          banner_media_id: string | null;
          campus_id: string | null;
          course_id: string;
          created_at: string;
          created_by: string | null;
          deleted_at: string | null;
          deleted_by: string | null;
          faculty_id: string | null;
          id: string;
          overview: string | null;
          section_id: string | null;
          semester_id: string | null;
          settings: Json;
          status: Database["public"]["Enums"]["lms_publish_status"];
          summary: string | null;
          tenant_id: string;
          title: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          academic_session_id?: string | null;
          banner_media_id?: string | null;
          campus_id?: string | null;
          course_id: string;
          created_at?: string;
          created_by?: string | null;
          deleted_at?: string | null;
          deleted_by?: string | null;
          faculty_id?: string | null;
          id?: string;
          overview?: string | null;
          section_id?: string | null;
          semester_id?: string | null;
          settings?: Json;
          status?: Database["public"]["Enums"]["lms_publish_status"];
          summary?: string | null;
          tenant_id: string;
          title: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          academic_session_id?: string | null;
          banner_media_id?: string | null;
          campus_id?: string | null;
          course_id?: string;
          created_at?: string;
          created_by?: string | null;
          deleted_at?: string | null;
          deleted_by?: string | null;
          faculty_id?: string | null;
          id?: string;
          overview?: string | null;
          section_id?: string | null;
          semester_id?: string | null;
          settings?: Json;
          status?: Database["public"]["Enums"]["lms_publish_status"];
          summary?: string | null;
          tenant_id?: string;
          title?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "lms_workspaces_academic_session_id_fkey";
            columns: ["academic_session_id"];
            isOneToOne: false;
            referencedRelation: "academic_sessions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "lms_workspaces_banner_media_id_fkey";
            columns: ["banner_media_id"];
            isOneToOne: false;
            referencedRelation: "media_assets";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "lms_workspaces_campus_id_fkey";
            columns: ["campus_id"];
            isOneToOne: false;
            referencedRelation: "campuses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "lms_workspaces_course_id_fkey";
            columns: ["course_id"];
            isOneToOne: false;
            referencedRelation: "courses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "lms_workspaces_faculty_id_fkey";
            columns: ["faculty_id"];
            isOneToOne: false;
            referencedRelation: "faculty";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "lms_workspaces_section_id_fkey";
            columns: ["section_id"];
            isOneToOne: false;
            referencedRelation: "sections";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "lms_workspaces_semester_id_fkey";
            columns: ["semester_id"];
            isOneToOne: false;
            referencedRelation: "semesters";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "lms_workspaces_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      mark_evaluations: {
        Row: {
          created_at: string;
          created_by: string | null;
          deleted_at: string | null;
          deleted_by: string | null;
          evaluated_at: string;
          evaluator_id: string | null;
          id: string;
          is_blind: boolean;
          kind: Database["public"]["Enums"]["evaluation_kind"];
          mark_id: string;
          marks_awarded: number | null;
          remarks: string | null;
          round: number;
          tenant_id: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          deleted_at?: string | null;
          deleted_by?: string | null;
          evaluated_at?: string;
          evaluator_id?: string | null;
          id?: string;
          is_blind?: boolean;
          kind?: Database["public"]["Enums"]["evaluation_kind"];
          mark_id: string;
          marks_awarded?: number | null;
          remarks?: string | null;
          round?: number;
          tenant_id: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          deleted_at?: string | null;
          deleted_by?: string | null;
          evaluated_at?: string;
          evaluator_id?: string | null;
          id?: string;
          is_blind?: boolean;
          kind?: Database["public"]["Enums"]["evaluation_kind"];
          mark_id?: string;
          marks_awarded?: number | null;
          remarks?: string | null;
          round?: number;
          tenant_id?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "mark_evaluations_evaluator_id_fkey";
            columns: ["evaluator_id"];
            isOneToOne: false;
            referencedRelation: "faculty";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "mark_evaluations_mark_id_fkey";
            columns: ["mark_id"];
            isOneToOne: false;
            referencedRelation: "marks";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "mark_evaluations_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      marks: {
        Row: {
          approved_at: string | null;
          approved_by: string | null;
          assessment_id: string | null;
          component: string;
          course_id: string | null;
          created_at: string;
          created_by: string | null;
          deleted_at: string | null;
          deleted_by: string | null;
          entered_by: string | null;
          exam_id: string | null;
          final_marks: number | null;
          grace_marks: number;
          id: string;
          is_absent: boolean;
          is_malpractice: boolean;
          marks_obtained: number | null;
          max_marks: number;
          metadata: Json;
          moderation_delta: number;
          published_at: string | null;
          remarks: string | null;
          rubric_scores: Json;
          status: Database["public"]["Enums"]["mark_status"];
          student_id: string;
          tenant_id: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          approved_at?: string | null;
          approved_by?: string | null;
          assessment_id?: string | null;
          component?: string;
          course_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          deleted_at?: string | null;
          deleted_by?: string | null;
          entered_by?: string | null;
          exam_id?: string | null;
          final_marks?: number | null;
          grace_marks?: number;
          id?: string;
          is_absent?: boolean;
          is_malpractice?: boolean;
          marks_obtained?: number | null;
          max_marks?: number;
          metadata?: Json;
          moderation_delta?: number;
          published_at?: string | null;
          remarks?: string | null;
          rubric_scores?: Json;
          status?: Database["public"]["Enums"]["mark_status"];
          student_id: string;
          tenant_id: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          approved_at?: string | null;
          approved_by?: string | null;
          assessment_id?: string | null;
          component?: string;
          course_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          deleted_at?: string | null;
          deleted_by?: string | null;
          entered_by?: string | null;
          exam_id?: string | null;
          final_marks?: number | null;
          grace_marks?: number;
          id?: string;
          is_absent?: boolean;
          is_malpractice?: boolean;
          marks_obtained?: number | null;
          max_marks?: number;
          metadata?: Json;
          moderation_delta?: number;
          published_at?: string | null;
          remarks?: string | null;
          rubric_scores?: Json;
          status?: Database["public"]["Enums"]["mark_status"];
          student_id?: string;
          tenant_id?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "marks_assessment_id_fkey";
            columns: ["assessment_id"];
            isOneToOne: false;
            referencedRelation: "assessments";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "marks_course_id_fkey";
            columns: ["course_id"];
            isOneToOne: false;
            referencedRelation: "courses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "marks_exam_id_fkey";
            columns: ["exam_id"];
            isOneToOne: false;
            referencedRelation: "exams";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "marks_student_id_fkey";
            columns: ["student_id"];
            isOneToOne: false;
            referencedRelation: "students";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "marks_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      master_data_items: {
        Row: {
          code: string;
          created_at: string;
          created_by: string | null;
          deleted_at: string | null;
          deleted_by: string | null;
          id: string;
          is_active: boolean;
          label: string;
          metadata: Json;
          parent_id: string | null;
          sort_order: number;
          tenant_id: string | null;
          type_id: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          code: string;
          created_at?: string;
          created_by?: string | null;
          deleted_at?: string | null;
          deleted_by?: string | null;
          id?: string;
          is_active?: boolean;
          label: string;
          metadata?: Json;
          parent_id?: string | null;
          sort_order?: number;
          tenant_id?: string | null;
          type_id: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          code?: string;
          created_at?: string;
          created_by?: string | null;
          deleted_at?: string | null;
          deleted_by?: string | null;
          id?: string;
          is_active?: boolean;
          label?: string;
          metadata?: Json;
          parent_id?: string | null;
          sort_order?: number;
          tenant_id?: string | null;
          type_id?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "master_data_items_parent_id_fkey";
            columns: ["parent_id"];
            isOneToOne: false;
            referencedRelation: "master_data_items";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "master_data_items_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "master_data_items_type_id_fkey";
            columns: ["type_id"];
            isOneToOne: false;
            referencedRelation: "master_data_types";
            referencedColumns: ["id"];
          },
        ];
      };
      master_data_types: {
        Row: {
          created_at: string;
          description: string | null;
          id: string;
          is_system: boolean;
          key: string;
          name: string;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          id?: string;
          is_system?: boolean;
          key: string;
          name: string;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          id?: string;
          is_system?: boolean;
          key?: string;
          name?: string;
        };
        Relationships: [];
      };
      media_assets: {
        Row: {
          alt_text: string | null;
          caption: string | null;
          created_at: string;
          created_by: string | null;
          deleted_at: string | null;
          deleted_by: string | null;
          duration_seconds: number | null;
          file_size: number | null;
          folder_id: string | null;
          height: number | null;
          id: string;
          is_public: boolean;
          metadata: Json;
          mime_type: string | null;
          name: string;
          storage_bucket: string;
          storage_path: string;
          tenant_id: string;
          updated_at: string;
          updated_by: string | null;
          width: number | null;
        };
        Insert: {
          alt_text?: string | null;
          caption?: string | null;
          created_at?: string;
          created_by?: string | null;
          deleted_at?: string | null;
          deleted_by?: string | null;
          duration_seconds?: number | null;
          file_size?: number | null;
          folder_id?: string | null;
          height?: number | null;
          id?: string;
          is_public?: boolean;
          metadata?: Json;
          mime_type?: string | null;
          name: string;
          storage_bucket?: string;
          storage_path: string;
          tenant_id: string;
          updated_at?: string;
          updated_by?: string | null;
          width?: number | null;
        };
        Update: {
          alt_text?: string | null;
          caption?: string | null;
          created_at?: string;
          created_by?: string | null;
          deleted_at?: string | null;
          deleted_by?: string | null;
          duration_seconds?: number | null;
          file_size?: number | null;
          folder_id?: string | null;
          height?: number | null;
          id?: string;
          is_public?: boolean;
          metadata?: Json;
          mime_type?: string | null;
          name?: string;
          storage_bucket?: string;
          storage_path?: string;
          tenant_id?: string;
          updated_at?: string;
          updated_by?: string | null;
          width?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "media_assets_folder_id_fkey";
            columns: ["folder_id"];
            isOneToOne: false;
            referencedRelation: "media_folders";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "media_assets_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      media_folders: {
        Row: {
          created_at: string;
          created_by: string | null;
          deleted_at: string | null;
          deleted_by: string | null;
          id: string;
          name: string;
          parent_id: string | null;
          path: string | null;
          tenant_id: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          deleted_at?: string | null;
          deleted_by?: string | null;
          id?: string;
          name: string;
          parent_id?: string | null;
          path?: string | null;
          tenant_id: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          deleted_at?: string | null;
          deleted_by?: string | null;
          id?: string;
          name?: string;
          parent_id?: string | null;
          path?: string | null;
          tenant_id?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "media_folders_parent_id_fkey";
            columns: ["parent_id"];
            isOneToOne: false;
            referencedRelation: "media_folders";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "media_folders_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      notes: {
        Row: {
          author_id: string;
          body: string;
          created_at: string;
          created_by: string | null;
          deleted_at: string | null;
          deleted_by: string | null;
          entity_id: string;
          entity_type: string;
          id: string;
          is_private: boolean;
          tenant_id: string;
          title: string | null;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          author_id: string;
          body: string;
          created_at?: string;
          created_by?: string | null;
          deleted_at?: string | null;
          deleted_by?: string | null;
          entity_id: string;
          entity_type: string;
          id?: string;
          is_private?: boolean;
          tenant_id: string;
          title?: string | null;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          author_id?: string;
          body?: string;
          created_at?: string;
          created_by?: string | null;
          deleted_at?: string | null;
          deleted_by?: string | null;
          entity_id?: string;
          entity_type?: string;
          id?: string;
          is_private?: boolean;
          tenant_id?: string;
          title?: string | null;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "notes_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      notification_deliveries: {
        Row: {
          attempts: number;
          channel: Database["public"]["Enums"]["notification_channel"];
          created_at: string;
          delivered_at: string | null;
          destination: string | null;
          error: string | null;
          id: string;
          notification_id: string | null;
          payload: Json;
          provider: string | null;
          provider_message_id: string | null;
          recipient_id: string | null;
          scheduled_at: string | null;
          sent_at: string | null;
          status: Database["public"]["Enums"]["notification_status"];
          template_id: string | null;
          tenant_id: string | null;
          updated_at: string;
        };
        Insert: {
          attempts?: number;
          channel: Database["public"]["Enums"]["notification_channel"];
          created_at?: string;
          delivered_at?: string | null;
          destination?: string | null;
          error?: string | null;
          id?: string;
          notification_id?: string | null;
          payload?: Json;
          provider?: string | null;
          provider_message_id?: string | null;
          recipient_id?: string | null;
          scheduled_at?: string | null;
          sent_at?: string | null;
          status?: Database["public"]["Enums"]["notification_status"];
          template_id?: string | null;
          tenant_id?: string | null;
          updated_at?: string;
        };
        Update: {
          attempts?: number;
          channel?: Database["public"]["Enums"]["notification_channel"];
          created_at?: string;
          delivered_at?: string | null;
          destination?: string | null;
          error?: string | null;
          id?: string;
          notification_id?: string | null;
          payload?: Json;
          provider?: string | null;
          provider_message_id?: string | null;
          recipient_id?: string | null;
          scheduled_at?: string | null;
          sent_at?: string | null;
          status?: Database["public"]["Enums"]["notification_status"];
          template_id?: string | null;
          tenant_id?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "notification_deliveries_notification_id_fkey";
            columns: ["notification_id"];
            isOneToOne: false;
            referencedRelation: "notifications";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "notification_deliveries_template_id_fkey";
            columns: ["template_id"];
            isOneToOne: false;
            referencedRelation: "notification_templates";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "notification_deliveries_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      notification_preferences: {
        Row: {
          channel: Database["public"]["Enums"]["notification_channel"];
          created_at: string;
          enabled: boolean;
          event_key: string;
          id: string;
          tenant_id: string | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          channel: Database["public"]["Enums"]["notification_channel"];
          created_at?: string;
          enabled?: boolean;
          event_key: string;
          id?: string;
          tenant_id?: string | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          channel?: Database["public"]["Enums"]["notification_channel"];
          created_at?: string;
          enabled?: boolean;
          event_key?: string;
          id?: string;
          tenant_id?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "notification_preferences_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      notification_templates: {
        Row: {
          body: string;
          channel: Database["public"]["Enums"]["notification_channel"];
          created_at: string;
          created_by: string | null;
          deleted_at: string | null;
          deleted_by: string | null;
          event_key: string | null;
          id: string;
          is_active: boolean;
          key: string;
          name: string;
          subject: string | null;
          tenant_id: string | null;
          updated_at: string;
          updated_by: string | null;
          variables: Json;
        };
        Insert: {
          body: string;
          channel?: Database["public"]["Enums"]["notification_channel"];
          created_at?: string;
          created_by?: string | null;
          deleted_at?: string | null;
          deleted_by?: string | null;
          event_key?: string | null;
          id?: string;
          is_active?: boolean;
          key: string;
          name: string;
          subject?: string | null;
          tenant_id?: string | null;
          updated_at?: string;
          updated_by?: string | null;
          variables?: Json;
        };
        Update: {
          body?: string;
          channel?: Database["public"]["Enums"]["notification_channel"];
          created_at?: string;
          created_by?: string | null;
          deleted_at?: string | null;
          deleted_by?: string | null;
          event_key?: string | null;
          id?: string;
          is_active?: boolean;
          key?: string;
          name?: string;
          subject?: string | null;
          tenant_id?: string | null;
          updated_at?: string;
          updated_by?: string | null;
          variables?: Json;
        };
        Relationships: [
          {
            foreignKeyName: "notification_templates_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      notifications: {
        Row: {
          action_url: string | null;
          actor_id: string | null;
          archived_at: string | null;
          body: string | null;
          created_at: string;
          data: Json;
          entity_id: string | null;
          entity_type: string | null;
          event_key: string | null;
          icon: string | null;
          id: string;
          priority: Database["public"]["Enums"]["notification_priority"];
          read_at: string | null;
          recipient_id: string;
          tenant_id: string | null;
          title: string;
        };
        Insert: {
          action_url?: string | null;
          actor_id?: string | null;
          archived_at?: string | null;
          body?: string | null;
          created_at?: string;
          data?: Json;
          entity_id?: string | null;
          entity_type?: string | null;
          event_key?: string | null;
          icon?: string | null;
          id?: string;
          priority?: Database["public"]["Enums"]["notification_priority"];
          read_at?: string | null;
          recipient_id: string;
          tenant_id?: string | null;
          title: string;
        };
        Update: {
          action_url?: string | null;
          actor_id?: string | null;
          archived_at?: string | null;
          body?: string | null;
          created_at?: string;
          data?: Json;
          entity_id?: string | null;
          entity_type?: string | null;
          event_key?: string | null;
          icon?: string | null;
          id?: string;
          priority?: Database["public"]["Enums"]["notification_priority"];
          read_at?: string | null;
          recipient_id?: string;
          tenant_id?: string | null;
          title?: string;
        };
        Relationships: [
          {
            foreignKeyName: "notifications_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      permission_group_items: {
        Row: {
          created_at: string;
          group_id: string;
          id: string;
          permission_id: string;
        };
        Insert: {
          created_at?: string;
          group_id: string;
          id?: string;
          permission_id: string;
        };
        Update: {
          created_at?: string;
          group_id?: string;
          id?: string;
          permission_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "permission_group_items_group_id_fkey";
            columns: ["group_id"];
            isOneToOne: false;
            referencedRelation: "permission_groups";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "permission_group_items_permission_id_fkey";
            columns: ["permission_id"];
            isOneToOne: false;
            referencedRelation: "permissions";
            referencedColumns: ["id"];
          },
        ];
      };
      permission_groups: {
        Row: {
          created_at: string;
          created_by: string | null;
          deleted_at: string | null;
          deleted_by: string | null;
          description: string | null;
          id: string;
          is_system: boolean;
          key: string;
          name: string;
          tenant_id: string | null;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          deleted_at?: string | null;
          deleted_by?: string | null;
          description?: string | null;
          id?: string;
          is_system?: boolean;
          key: string;
          name: string;
          tenant_id?: string | null;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          deleted_at?: string | null;
          deleted_by?: string | null;
          description?: string | null;
          id?: string;
          is_system?: boolean;
          key?: string;
          name?: string;
          tenant_id?: string | null;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "permission_groups_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      permissions: {
        Row: {
          action: string;
          created_at: string;
          description: string | null;
          id: string;
          is_system: boolean;
          key: string;
          module: string;
          name: string;
          resource: string;
          updated_at: string;
        };
        Insert: {
          action: string;
          created_at?: string;
          description?: string | null;
          id?: string;
          is_system?: boolean;
          key: string;
          module: string;
          name: string;
          resource: string;
          updated_at?: string;
        };
        Update: {
          action?: string;
          created_at?: string;
          description?: string | null;
          id?: string;
          is_system?: boolean;
          key?: string;
          module?: string;
          name?: string;
          resource?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          created_at: string;
          created_by: string | null;
          date_of_birth: string | null;
          deleted_at: string | null;
          deleted_by: string | null;
          display_name: string | null;
          email: string | null;
          full_name: string | null;
          gender: Database["public"]["Enums"]["gender"] | null;
          id: string;
          is_platform_admin: boolean;
          last_active_tenant_id: string | null;
          locale: string;
          phone: string | null;
          timezone: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          avatar_url?: string | null;
          created_at?: string;
          created_by?: string | null;
          date_of_birth?: string | null;
          deleted_at?: string | null;
          deleted_by?: string | null;
          display_name?: string | null;
          email?: string | null;
          full_name?: string | null;
          gender?: Database["public"]["Enums"]["gender"] | null;
          id: string;
          is_platform_admin?: boolean;
          last_active_tenant_id?: string | null;
          locale?: string;
          phone?: string | null;
          timezone?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          avatar_url?: string | null;
          created_at?: string;
          created_by?: string | null;
          date_of_birth?: string | null;
          deleted_at?: string | null;
          deleted_by?: string | null;
          display_name?: string | null;
          email?: string | null;
          full_name?: string | null;
          gender?: Database["public"]["Enums"]["gender"] | null;
          id?: string;
          is_platform_admin?: boolean;
          last_active_tenant_id?: string | null;
          locale?: string;
          phone?: string | null;
          timezone?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_last_active_tenant_id_fkey";
            columns: ["last_active_tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      program_outcomes: {
        Row: {
          code: string;
          created_at: string;
          created_by: string | null;
          deleted_at: string | null;
          deleted_by: string | null;
          description: string;
          id: string;
          is_pso: boolean;
          program_id: string;
          tenant_id: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          code: string;
          created_at?: string;
          created_by?: string | null;
          deleted_at?: string | null;
          deleted_by?: string | null;
          description: string;
          id?: string;
          is_pso?: boolean;
          program_id: string;
          tenant_id: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          code?: string;
          created_at?: string;
          created_by?: string | null;
          deleted_at?: string | null;
          deleted_by?: string | null;
          description?: string;
          id?: string;
          is_pso?: boolean;
          program_id?: string;
          tenant_id?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "program_outcomes_program_id_fkey";
            columns: ["program_id"];
            isOneToOne: false;
            referencedRelation: "programs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "program_outcomes_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      programs: {
        Row: {
          campus_id: string | null;
          code: string;
          created_at: string;
          created_by: string | null;
          deleted_at: string | null;
          deleted_by: string | null;
          department_id: string | null;
          description: string | null;
          duration_years: number;
          id: string;
          intake_capacity: number | null;
          is_active: boolean;
          level: Database["public"]["Enums"]["program_level"];
          name: string;
          tenant_id: string;
          total_credits: number | null;
          total_semesters: number;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          campus_id?: string | null;
          code: string;
          created_at?: string;
          created_by?: string | null;
          deleted_at?: string | null;
          deleted_by?: string | null;
          department_id?: string | null;
          description?: string | null;
          duration_years?: number;
          id?: string;
          intake_capacity?: number | null;
          is_active?: boolean;
          level?: Database["public"]["Enums"]["program_level"];
          name: string;
          tenant_id: string;
          total_credits?: number | null;
          total_semesters?: number;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          campus_id?: string | null;
          code?: string;
          created_at?: string;
          created_by?: string | null;
          deleted_at?: string | null;
          deleted_by?: string | null;
          department_id?: string | null;
          description?: string | null;
          duration_years?: number;
          id?: string;
          intake_capacity?: number | null;
          is_active?: boolean;
          level?: Database["public"]["Enums"]["program_level"];
          name?: string;
          tenant_id?: string;
          total_credits?: number | null;
          total_semesters?: number;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "programs_campus_id_fkey";
            columns: ["campus_id"];
            isOneToOne: false;
            referencedRelation: "campuses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "programs_department_id_fkey";
            columns: ["department_id"];
            isOneToOne: false;
            referencedRelation: "departments";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "programs_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      question_paper_questions: {
        Row: {
          created_at: string;
          created_by: string | null;
          deleted_at: string | null;
          deleted_by: string | null;
          id: string;
          is_optional: boolean;
          marks: number;
          question_id: string;
          question_number: string | null;
          question_paper_id: string;
          section_label: string;
          sort_order: number;
          tenant_id: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          deleted_at?: string | null;
          deleted_by?: string | null;
          id?: string;
          is_optional?: boolean;
          marks?: number;
          question_id: string;
          question_number?: string | null;
          question_paper_id: string;
          section_label?: string;
          sort_order?: number;
          tenant_id: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          deleted_at?: string | null;
          deleted_by?: string | null;
          id?: string;
          is_optional?: boolean;
          marks?: number;
          question_id?: string;
          question_number?: string | null;
          question_paper_id?: string;
          section_label?: string;
          sort_order?: number;
          tenant_id?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "question_paper_questions_question_id_fkey";
            columns: ["question_id"];
            isOneToOne: false;
            referencedRelation: "questions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "question_paper_questions_question_paper_id_fkey";
            columns: ["question_paper_id"];
            isOneToOne: false;
            referencedRelation: "question_papers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "question_paper_questions_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      question_papers: {
        Row: {
          approved_at: string | null;
          approver_id: string | null;
          blueprint: Json;
          code: string | null;
          course_id: string | null;
          created_at: string;
          created_by: string | null;
          deleted_at: string | null;
          deleted_by: string | null;
          duration_minutes: number;
          exam_id: string | null;
          id: string;
          instructions: string | null;
          is_encrypted: boolean;
          metadata: Json;
          rejection_reason: string | null;
          release_at: string | null;
          set_label: string;
          setter_id: string | null;
          status: Database["public"]["Enums"]["question_paper_status"];
          tenant_id: string;
          title: string;
          total_marks: number;
          updated_at: string;
          updated_by: string | null;
          version: number;
        };
        Insert: {
          approved_at?: string | null;
          approver_id?: string | null;
          blueprint?: Json;
          code?: string | null;
          course_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          deleted_at?: string | null;
          deleted_by?: string | null;
          duration_minutes?: number;
          exam_id?: string | null;
          id?: string;
          instructions?: string | null;
          is_encrypted?: boolean;
          metadata?: Json;
          rejection_reason?: string | null;
          release_at?: string | null;
          set_label?: string;
          setter_id?: string | null;
          status?: Database["public"]["Enums"]["question_paper_status"];
          tenant_id: string;
          title: string;
          total_marks?: number;
          updated_at?: string;
          updated_by?: string | null;
          version?: number;
        };
        Update: {
          approved_at?: string | null;
          approver_id?: string | null;
          blueprint?: Json;
          code?: string | null;
          course_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          deleted_at?: string | null;
          deleted_by?: string | null;
          duration_minutes?: number;
          exam_id?: string | null;
          id?: string;
          instructions?: string | null;
          is_encrypted?: boolean;
          metadata?: Json;
          rejection_reason?: string | null;
          release_at?: string | null;
          set_label?: string;
          setter_id?: string | null;
          status?: Database["public"]["Enums"]["question_paper_status"];
          tenant_id?: string;
          title?: string;
          total_marks?: number;
          updated_at?: string;
          updated_by?: string | null;
          version?: number;
        };
        Relationships: [
          {
            foreignKeyName: "question_papers_course_id_fkey";
            columns: ["course_id"];
            isOneToOne: false;
            referencedRelation: "courses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "question_papers_exam_id_fkey";
            columns: ["exam_id"];
            isOneToOne: false;
            referencedRelation: "exams";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "question_papers_setter_id_fkey";
            columns: ["setter_id"];
            isOneToOne: false;
            referencedRelation: "faculty";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "question_papers_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      questions: {
        Row: {
          answer_key: string | null;
          bloom: Database["public"]["Enums"]["bloom_level"];
          body: string;
          course_id: string | null;
          course_outcome_id: string | null;
          created_at: string;
          created_by: string | null;
          deleted_at: string | null;
          deleted_by: string | null;
          difficulty: Database["public"]["Enums"]["question_difficulty"];
          id: string;
          is_active: boolean;
          marks: number;
          metadata: Json;
          options: Json;
          program_outcome_id: string | null;
          question_type: string;
          tenant_id: string;
          topic: string | null;
          unit: string | null;
          updated_at: string;
          updated_by: string | null;
          usage_count: number;
        };
        Insert: {
          answer_key?: string | null;
          bloom?: Database["public"]["Enums"]["bloom_level"];
          body: string;
          course_id?: string | null;
          course_outcome_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          deleted_at?: string | null;
          deleted_by?: string | null;
          difficulty?: Database["public"]["Enums"]["question_difficulty"];
          id?: string;
          is_active?: boolean;
          marks?: number;
          metadata?: Json;
          options?: Json;
          program_outcome_id?: string | null;
          question_type?: string;
          tenant_id: string;
          topic?: string | null;
          unit?: string | null;
          updated_at?: string;
          updated_by?: string | null;
          usage_count?: number;
        };
        Update: {
          answer_key?: string | null;
          bloom?: Database["public"]["Enums"]["bloom_level"];
          body?: string;
          course_id?: string | null;
          course_outcome_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          deleted_at?: string | null;
          deleted_by?: string | null;
          difficulty?: Database["public"]["Enums"]["question_difficulty"];
          id?: string;
          is_active?: boolean;
          marks?: number;
          metadata?: Json;
          options?: Json;
          program_outcome_id?: string | null;
          question_type?: string;
          tenant_id?: string;
          topic?: string | null;
          unit?: string | null;
          updated_at?: string;
          updated_by?: string | null;
          usage_count?: number;
        };
        Relationships: [
          {
            foreignKeyName: "questions_course_id_fkey";
            columns: ["course_id"];
            isOneToOne: false;
            referencedRelation: "courses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "questions_course_outcome_id_fkey";
            columns: ["course_outcome_id"];
            isOneToOne: false;
            referencedRelation: "course_outcomes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "questions_program_outcome_id_fkey";
            columns: ["program_outcome_id"];
            isOneToOne: false;
            referencedRelation: "program_outcomes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "questions_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      record_versions: {
        Row: {
          changed_by: string | null;
          created_at: string;
          entity_id: string;
          entity_type: string;
          id: string;
          reason: string | null;
          snapshot: Json;
          tenant_id: string | null;
          version: number;
        };
        Insert: {
          changed_by?: string | null;
          created_at?: string;
          entity_id: string;
          entity_type: string;
          id?: string;
          reason?: string | null;
          snapshot: Json;
          tenant_id?: string | null;
          version: number;
        };
        Update: {
          changed_by?: string | null;
          created_at?: string;
          entity_id?: string;
          entity_type?: string;
          id?: string;
          reason?: string | null;
          snapshot?: Json;
          tenant_id?: string | null;
          version?: number;
        };
        Relationships: [];
      };
      result_courses: {
        Row: {
          attempt_number: number;
          course_id: string | null;
          created_at: string;
          created_by: string | null;
          credits: number;
          deleted_at: string | null;
          deleted_by: string | null;
          exam_id: string | null;
          external_marks: number;
          grade: string | null;
          grade_point: number | null;
          id: string;
          internal_marks: number;
          is_pass: boolean;
          max_marks: number;
          result_id: string;
          tenant_id: string;
          total_marks: number;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          attempt_number?: number;
          course_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          credits?: number;
          deleted_at?: string | null;
          deleted_by?: string | null;
          exam_id?: string | null;
          external_marks?: number;
          grade?: string | null;
          grade_point?: number | null;
          id?: string;
          internal_marks?: number;
          is_pass?: boolean;
          max_marks?: number;
          result_id: string;
          tenant_id: string;
          total_marks?: number;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          attempt_number?: number;
          course_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          credits?: number;
          deleted_at?: string | null;
          deleted_by?: string | null;
          exam_id?: string | null;
          external_marks?: number;
          grade?: string | null;
          grade_point?: number | null;
          id?: string;
          internal_marks?: number;
          is_pass?: boolean;
          max_marks?: number;
          result_id?: string;
          tenant_id?: string;
          total_marks?: number;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "result_courses_course_id_fkey";
            columns: ["course_id"];
            isOneToOne: false;
            referencedRelation: "courses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "result_courses_exam_id_fkey";
            columns: ["exam_id"];
            isOneToOne: false;
            referencedRelation: "exams";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "result_courses_result_id_fkey";
            columns: ["result_id"];
            isOneToOne: false;
            referencedRelation: "results";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "result_courses_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      results: {
        Row: {
          approved_at: string | null;
          approved_by: string | null;
          backlog_count: number;
          cgpa: number | null;
          class_awarded: string | null;
          created_at: string;
          created_by: string | null;
          credits_earned: number;
          credits_registered: number;
          deleted_at: string | null;
          deleted_by: string | null;
          exam_session_id: string | null;
          frozen_at: string | null;
          grading_scale_id: string | null;
          id: string;
          is_frozen: boolean;
          is_locked: boolean;
          is_pass: boolean;
          locked_at: string | null;
          max_marks: number;
          metadata: Json;
          percentage: number | null;
          program_id: string | null;
          published_at: string | null;
          rank: number | null;
          remarks: string | null;
          semester_id: string | null;
          sgpa: number | null;
          status: Database["public"]["Enums"]["result_status"];
          student_id: string;
          tenant_id: string;
          total_marks: number;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          approved_at?: string | null;
          approved_by?: string | null;
          backlog_count?: number;
          cgpa?: number | null;
          class_awarded?: string | null;
          created_at?: string;
          created_by?: string | null;
          credits_earned?: number;
          credits_registered?: number;
          deleted_at?: string | null;
          deleted_by?: string | null;
          exam_session_id?: string | null;
          frozen_at?: string | null;
          grading_scale_id?: string | null;
          id?: string;
          is_frozen?: boolean;
          is_locked?: boolean;
          is_pass?: boolean;
          locked_at?: string | null;
          max_marks?: number;
          metadata?: Json;
          percentage?: number | null;
          program_id?: string | null;
          published_at?: string | null;
          rank?: number | null;
          remarks?: string | null;
          semester_id?: string | null;
          sgpa?: number | null;
          status?: Database["public"]["Enums"]["result_status"];
          student_id: string;
          tenant_id: string;
          total_marks?: number;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          approved_at?: string | null;
          approved_by?: string | null;
          backlog_count?: number;
          cgpa?: number | null;
          class_awarded?: string | null;
          created_at?: string;
          created_by?: string | null;
          credits_earned?: number;
          credits_registered?: number;
          deleted_at?: string | null;
          deleted_by?: string | null;
          exam_session_id?: string | null;
          frozen_at?: string | null;
          grading_scale_id?: string | null;
          id?: string;
          is_frozen?: boolean;
          is_locked?: boolean;
          is_pass?: boolean;
          locked_at?: string | null;
          max_marks?: number;
          metadata?: Json;
          percentage?: number | null;
          program_id?: string | null;
          published_at?: string | null;
          rank?: number | null;
          remarks?: string | null;
          semester_id?: string | null;
          sgpa?: number | null;
          status?: Database["public"]["Enums"]["result_status"];
          student_id?: string;
          tenant_id?: string;
          total_marks?: number;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "results_exam_session_id_fkey";
            columns: ["exam_session_id"];
            isOneToOne: false;
            referencedRelation: "exam_sessions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "results_grading_scale_id_fkey";
            columns: ["grading_scale_id"];
            isOneToOne: false;
            referencedRelation: "grading_scales";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "results_program_id_fkey";
            columns: ["program_id"];
            isOneToOne: false;
            referencedRelation: "programs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "results_semester_id_fkey";
            columns: ["semester_id"];
            isOneToOne: false;
            referencedRelation: "semesters";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "results_student_id_fkey";
            columns: ["student_id"];
            isOneToOne: false;
            referencedRelation: "students";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "results_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      revaluation_requests: {
        Row: {
          created_at: string;
          created_by: string | null;
          deleted_at: string | null;
          deleted_by: string | null;
          exam_id: string;
          fee_amount: number;
          id: string;
          kind: Database["public"]["Enums"]["revaluation_kind"];
          mark_id: string | null;
          original_marks: number | null;
          paid_at: string | null;
          payment_reference: string | null;
          payment_status: string;
          reason: string;
          review_notes: string | null;
          reviewed_at: string | null;
          reviewer_id: string | null;
          revised_marks: number | null;
          status: Database["public"]["Enums"]["approval_state"];
          student_id: string;
          tenant_id: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          deleted_at?: string | null;
          deleted_by?: string | null;
          exam_id: string;
          fee_amount?: number;
          id?: string;
          kind?: Database["public"]["Enums"]["revaluation_kind"];
          mark_id?: string | null;
          original_marks?: number | null;
          paid_at?: string | null;
          payment_reference?: string | null;
          payment_status?: string;
          reason: string;
          review_notes?: string | null;
          reviewed_at?: string | null;
          reviewer_id?: string | null;
          revised_marks?: number | null;
          status?: Database["public"]["Enums"]["approval_state"];
          student_id: string;
          tenant_id: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          deleted_at?: string | null;
          deleted_by?: string | null;
          exam_id?: string;
          fee_amount?: number;
          id?: string;
          kind?: Database["public"]["Enums"]["revaluation_kind"];
          mark_id?: string | null;
          original_marks?: number | null;
          paid_at?: string | null;
          payment_reference?: string | null;
          payment_status?: string;
          reason?: string;
          review_notes?: string | null;
          reviewed_at?: string | null;
          reviewer_id?: string | null;
          revised_marks?: number | null;
          status?: Database["public"]["Enums"]["approval_state"];
          student_id?: string;
          tenant_id?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "revaluation_requests_exam_id_fkey";
            columns: ["exam_id"];
            isOneToOne: false;
            referencedRelation: "exams";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "revaluation_requests_mark_id_fkey";
            columns: ["mark_id"];
            isOneToOne: false;
            referencedRelation: "marks";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "revaluation_requests_student_id_fkey";
            columns: ["student_id"];
            isOneToOne: false;
            referencedRelation: "students";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "revaluation_requests_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      role_permissions: {
        Row: {
          created_at: string;
          created_by: string | null;
          id: string;
          permission_id: string;
          role_id: string;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          id?: string;
          permission_id: string;
          role_id: string;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          id?: string;
          permission_id?: string;
          role_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "role_permissions_permission_id_fkey";
            columns: ["permission_id"];
            isOneToOne: false;
            referencedRelation: "permissions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "role_permissions_role_id_fkey";
            columns: ["role_id"];
            isOneToOne: false;
            referencedRelation: "roles";
            referencedColumns: ["id"];
          },
        ];
      };
      roles: {
        Row: {
          created_at: string;
          created_by: string | null;
          default_route: string | null;
          deleted_at: string | null;
          deleted_by: string | null;
          description: string | null;
          id: string;
          is_assignable: boolean;
          is_system: boolean;
          key: string;
          level: number;
          name: string;
          tenant_id: string | null;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          default_route?: string | null;
          deleted_at?: string | null;
          deleted_by?: string | null;
          description?: string | null;
          id?: string;
          is_assignable?: boolean;
          is_system?: boolean;
          key: string;
          level?: number;
          name: string;
          tenant_id?: string | null;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          default_route?: string | null;
          deleted_at?: string | null;
          deleted_by?: string | null;
          description?: string | null;
          id?: string;
          is_assignable?: boolean;
          is_system?: boolean;
          key?: string;
          level?: number;
          name?: string;
          tenant_id?: string | null;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "roles_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      rooms: {
        Row: {
          building_id: string | null;
          campus_id: string | null;
          capacity: number | null;
          code: string;
          created_at: string;
          created_by: string | null;
          deleted_at: string | null;
          deleted_by: string | null;
          department_id: string | null;
          equipment: string | null;
          floor: number;
          id: string;
          is_available: boolean;
          name: string;
          room_type: Database["public"]["Enums"]["room_type"];
          tenant_id: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          building_id?: string | null;
          campus_id?: string | null;
          capacity?: number | null;
          code: string;
          created_at?: string;
          created_by?: string | null;
          deleted_at?: string | null;
          deleted_by?: string | null;
          department_id?: string | null;
          equipment?: string | null;
          floor?: number;
          id?: string;
          is_available?: boolean;
          name: string;
          room_type?: Database["public"]["Enums"]["room_type"];
          tenant_id: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          building_id?: string | null;
          campus_id?: string | null;
          capacity?: number | null;
          code?: string;
          created_at?: string;
          created_by?: string | null;
          deleted_at?: string | null;
          deleted_by?: string | null;
          department_id?: string | null;
          equipment?: string | null;
          floor?: number;
          id?: string;
          is_available?: boolean;
          name?: string;
          room_type?: Database["public"]["Enums"]["room_type"];
          tenant_id?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "rooms_building_id_fkey";
            columns: ["building_id"];
            isOneToOne: false;
            referencedRelation: "buildings";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "rooms_campus_id_fkey";
            columns: ["campus_id"];
            isOneToOne: false;
            referencedRelation: "campuses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "rooms_department_id_fkey";
            columns: ["department_id"];
            isOneToOne: false;
            referencedRelation: "departments";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "rooms_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      rubric_criteria: {
        Row: {
          course_outcome_id: string | null;
          created_at: string;
          created_by: string | null;
          deleted_at: string | null;
          deleted_by: string | null;
          description: string | null;
          id: string;
          levels: Json;
          max_points: number;
          rubric_id: string;
          sort_order: number;
          tenant_id: string;
          title: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          course_outcome_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          deleted_at?: string | null;
          deleted_by?: string | null;
          description?: string | null;
          id?: string;
          levels?: Json;
          max_points?: number;
          rubric_id: string;
          sort_order?: number;
          tenant_id: string;
          title: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          course_outcome_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          deleted_at?: string | null;
          deleted_by?: string | null;
          description?: string | null;
          id?: string;
          levels?: Json;
          max_points?: number;
          rubric_id?: string;
          sort_order?: number;
          tenant_id?: string;
          title?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "rubric_criteria_course_outcome_id_fkey";
            columns: ["course_outcome_id"];
            isOneToOne: false;
            referencedRelation: "course_outcomes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "rubric_criteria_rubric_id_fkey";
            columns: ["rubric_id"];
            isOneToOne: false;
            referencedRelation: "rubrics";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "rubric_criteria_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      rubrics: {
        Row: {
          course_id: string | null;
          created_at: string;
          created_by: string | null;
          deleted_at: string | null;
          deleted_by: string | null;
          description: string | null;
          id: string;
          is_active: boolean;
          name: string;
          tenant_id: string;
          total_points: number;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          course_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          deleted_at?: string | null;
          deleted_by?: string | null;
          description?: string | null;
          id?: string;
          is_active?: boolean;
          name: string;
          tenant_id: string;
          total_points?: number;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          course_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          deleted_at?: string | null;
          deleted_by?: string | null;
          description?: string | null;
          id?: string;
          is_active?: boolean;
          name?: string;
          tenant_id?: string;
          total_points?: number;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "rubrics_course_id_fkey";
            columns: ["course_id"];
            isOneToOne: false;
            referencedRelation: "courses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "rubrics_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      search_index: {
        Row: {
          body: string | null;
          entity_id: string;
          entity_type: string;
          id: string;
          keywords: string | null;
          module: string | null;
          required_permission: string | null;
          search_vector: unknown;
          subtitle: string | null;
          tenant_id: string;
          title: string;
          updated_at: string;
          url: string | null;
        };
        Insert: {
          body?: string | null;
          entity_id: string;
          entity_type: string;
          id?: string;
          keywords?: string | null;
          module?: string | null;
          required_permission?: string | null;
          search_vector?: unknown;
          subtitle?: string | null;
          tenant_id: string;
          title: string;
          updated_at?: string;
          url?: string | null;
        };
        Update: {
          body?: string | null;
          entity_id?: string;
          entity_type?: string;
          id?: string;
          keywords?: string | null;
          module?: string | null;
          required_permission?: string | null;
          search_vector?: unknown;
          subtitle?: string | null;
          tenant_id?: string;
          title?: string;
          updated_at?: string;
          url?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "search_index_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      sections: {
        Row: {
          advisor_faculty_id: string | null;
          batch_id: string | null;
          campus_id: string | null;
          capacity: number | null;
          code: string;
          created_at: string;
          created_by: string | null;
          deleted_at: string | null;
          deleted_by: string | null;
          id: string;
          is_active: boolean;
          name: string;
          program_id: string | null;
          semester_id: string | null;
          tenant_id: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          advisor_faculty_id?: string | null;
          batch_id?: string | null;
          campus_id?: string | null;
          capacity?: number | null;
          code: string;
          created_at?: string;
          created_by?: string | null;
          deleted_at?: string | null;
          deleted_by?: string | null;
          id?: string;
          is_active?: boolean;
          name: string;
          program_id?: string | null;
          semester_id?: string | null;
          tenant_id: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          advisor_faculty_id?: string | null;
          batch_id?: string | null;
          campus_id?: string | null;
          capacity?: number | null;
          code?: string;
          created_at?: string;
          created_by?: string | null;
          deleted_at?: string | null;
          deleted_by?: string | null;
          id?: string;
          is_active?: boolean;
          name?: string;
          program_id?: string | null;
          semester_id?: string | null;
          tenant_id?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "sections_advisor_faculty_id_fkey";
            columns: ["advisor_faculty_id"];
            isOneToOne: false;
            referencedRelation: "faculty";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "sections_batch_id_fkey";
            columns: ["batch_id"];
            isOneToOne: false;
            referencedRelation: "batches";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "sections_campus_id_fkey";
            columns: ["campus_id"];
            isOneToOne: false;
            referencedRelation: "campuses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "sections_program_id_fkey";
            columns: ["program_id"];
            isOneToOne: false;
            referencedRelation: "programs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "sections_semester_id_fkey";
            columns: ["semester_id"];
            isOneToOne: false;
            referencedRelation: "semesters";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "sections_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      semesters: {
        Row: {
          created_at: string;
          created_by: string | null;
          credits: number | null;
          deleted_at: string | null;
          deleted_by: string | null;
          id: string;
          name: string;
          number: number;
          program_id: string;
          tenant_id: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          credits?: number | null;
          deleted_at?: string | null;
          deleted_by?: string | null;
          id?: string;
          name: string;
          number: number;
          program_id: string;
          tenant_id: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          credits?: number | null;
          deleted_at?: string | null;
          deleted_by?: string | null;
          id?: string;
          name?: string;
          number?: number;
          program_id?: string;
          tenant_id?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "semesters_program_id_fkey";
            columns: ["program_id"];
            isOneToOne: false;
            referencedRelation: "programs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "semesters_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      settings_definitions: {
        Row: {
          created_at: string;
          data_type: string;
          default_value: Json | null;
          description: string | null;
          id: string;
          is_secret: boolean;
          key: string;
          label: string;
          options: Json | null;
          scope: Database["public"]["Enums"]["setting_scope"];
          sort_order: number;
        };
        Insert: {
          created_at?: string;
          data_type?: string;
          default_value?: Json | null;
          description?: string | null;
          id?: string;
          is_secret?: boolean;
          key: string;
          label: string;
          options?: Json | null;
          scope?: Database["public"]["Enums"]["setting_scope"];
          sort_order?: number;
        };
        Update: {
          created_at?: string;
          data_type?: string;
          default_value?: Json | null;
          description?: string | null;
          id?: string;
          is_secret?: boolean;
          key?: string;
          label?: string;
          options?: Json | null;
          scope?: Database["public"]["Enums"]["setting_scope"];
          sort_order?: number;
        };
        Relationships: [];
      };
      specializations: {
        Row: {
          code: string;
          created_at: string;
          created_by: string | null;
          deleted_at: string | null;
          deleted_by: string | null;
          description: string | null;
          id: string;
          is_active: boolean;
          kind: Database["public"]["Enums"]["specialization_kind"];
          min_credits: number | null;
          name: string;
          program_id: string | null;
          tenant_id: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          code: string;
          created_at?: string;
          created_by?: string | null;
          deleted_at?: string | null;
          deleted_by?: string | null;
          description?: string | null;
          id?: string;
          is_active?: boolean;
          kind?: Database["public"]["Enums"]["specialization_kind"];
          min_credits?: number | null;
          name: string;
          program_id?: string | null;
          tenant_id: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          code?: string;
          created_at?: string;
          created_by?: string | null;
          deleted_at?: string | null;
          deleted_by?: string | null;
          description?: string | null;
          id?: string;
          is_active?: boolean;
          kind?: Database["public"]["Enums"]["specialization_kind"];
          min_credits?: number | null;
          name?: string;
          program_id?: string | null;
          tenant_id?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "specializations_program_id_fkey";
            columns: ["program_id"];
            isOneToOne: false;
            referencedRelation: "programs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "specializations_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      staff: {
        Row: {
          address: Json;
          campus_id: string | null;
          created_at: string;
          created_by: string | null;
          date_of_birth: string | null;
          date_of_joining: string | null;
          date_of_leaving: string | null;
          deleted_at: string | null;
          deleted_by: string | null;
          department_id: string | null;
          designation: string | null;
          email: string | null;
          employee_code: string;
          employment_status: Database["public"]["Enums"]["employment_status"];
          employment_type: Database["public"]["Enums"]["employment_type"];
          first_name: string;
          gender: Database["public"]["Enums"]["gender"] | null;
          id: string;
          last_name: string | null;
          metadata: Json;
          phone: string | null;
          photo_url: string | null;
          tenant_id: string;
          updated_at: string;
          updated_by: string | null;
          user_id: string | null;
        };
        Insert: {
          address?: Json;
          campus_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          date_of_birth?: string | null;
          date_of_joining?: string | null;
          date_of_leaving?: string | null;
          deleted_at?: string | null;
          deleted_by?: string | null;
          department_id?: string | null;
          designation?: string | null;
          email?: string | null;
          employee_code: string;
          employment_status?: Database["public"]["Enums"]["employment_status"];
          employment_type?: Database["public"]["Enums"]["employment_type"];
          first_name: string;
          gender?: Database["public"]["Enums"]["gender"] | null;
          id?: string;
          last_name?: string | null;
          metadata?: Json;
          phone?: string | null;
          photo_url?: string | null;
          tenant_id: string;
          updated_at?: string;
          updated_by?: string | null;
          user_id?: string | null;
        };
        Update: {
          address?: Json;
          campus_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          date_of_birth?: string | null;
          date_of_joining?: string | null;
          date_of_leaving?: string | null;
          deleted_at?: string | null;
          deleted_by?: string | null;
          department_id?: string | null;
          designation?: string | null;
          email?: string | null;
          employee_code?: string;
          employment_status?: Database["public"]["Enums"]["employment_status"];
          employment_type?: Database["public"]["Enums"]["employment_type"];
          first_name?: string;
          gender?: Database["public"]["Enums"]["gender"] | null;
          id?: string;
          last_name?: string | null;
          metadata?: Json;
          phone?: string | null;
          photo_url?: string | null;
          tenant_id?: string;
          updated_at?: string;
          updated_by?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "staff_campus_id_fkey";
            columns: ["campus_id"];
            isOneToOne: false;
            referencedRelation: "campuses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "staff_department_id_fkey";
            columns: ["department_id"];
            isOneToOne: false;
            referencedRelation: "departments";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "staff_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      states: {
        Row: {
          code: string | null;
          country_id: string;
          created_at: string;
          id: string;
          name: string;
        };
        Insert: {
          code?: string | null;
          country_id: string;
          created_at?: string;
          id?: string;
          name: string;
        };
        Update: {
          code?: string | null;
          country_id?: string;
          created_at?: string;
          id?: string;
          name?: string;
        };
        Relationships: [
          {
            foreignKeyName: "states_country_id_fkey";
            columns: ["country_id"];
            isOneToOne: false;
            referencedRelation: "countries";
            referencedColumns: ["id"];
          },
        ];
      };
      student_guardians: {
        Row: {
          annual_income: number | null;
          created_at: string;
          created_by: string | null;
          deleted_at: string | null;
          deleted_by: string | null;
          email: string | null;
          full_name: string;
          id: string;
          is_primary: boolean;
          occupation: string | null;
          phone: string | null;
          relation: string;
          student_id: string;
          tenant_id: string;
          updated_at: string;
          updated_by: string | null;
          user_id: string | null;
        };
        Insert: {
          annual_income?: number | null;
          created_at?: string;
          created_by?: string | null;
          deleted_at?: string | null;
          deleted_by?: string | null;
          email?: string | null;
          full_name: string;
          id?: string;
          is_primary?: boolean;
          occupation?: string | null;
          phone?: string | null;
          relation: string;
          student_id: string;
          tenant_id: string;
          updated_at?: string;
          updated_by?: string | null;
          user_id?: string | null;
        };
        Update: {
          annual_income?: number | null;
          created_at?: string;
          created_by?: string | null;
          deleted_at?: string | null;
          deleted_by?: string | null;
          email?: string | null;
          full_name?: string;
          id?: string;
          is_primary?: boolean;
          occupation?: string | null;
          phone?: string | null;
          relation?: string;
          student_id?: string;
          tenant_id?: string;
          updated_at?: string;
          updated_by?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "student_guardians_student_id_fkey";
            columns: ["student_id"];
            isOneToOne: false;
            referencedRelation: "students";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "student_guardians_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      students: {
        Row: {
          abc_id: string | null;
          academic_year_id: string | null;
          address: Json;
          admission_date: string | null;
          admission_number: string;
          batch_id: string | null;
          blood_group_id: string | null;
          campus_id: string | null;
          caste_id: string | null;
          category_id: string | null;
          created_at: string;
          created_by: string | null;
          current_semester_id: string | null;
          date_of_birth: string | null;
          deleted_at: string | null;
          deleted_by: string | null;
          department_id: string | null;
          email: string | null;
          emergency_contact: string | null;
          father_name: string | null;
          first_name: string;
          gender: Database["public"]["Enums"]["gender"] | null;
          graduation_date: string | null;
          guardian_email: string | null;
          guardian_name: string | null;
          guardian_phone: string | null;
          id: string;
          last_name: string | null;
          metadata: Json;
          middle_name: string | null;
          mother_name: string | null;
          nationality_id: string | null;
          phone: string | null;
          photo_url: string | null;
          program_id: string | null;
          registration_number: string | null;
          religion_id: string | null;
          roll_number: string | null;
          section_id: string | null;
          status: Database["public"]["Enums"]["student_status"];
          tenant_id: string;
          updated_at: string;
          updated_by: string | null;
          user_id: string | null;
        };
        Insert: {
          abc_id?: string | null;
          academic_year_id?: string | null;
          address?: Json;
          admission_date?: string | null;
          admission_number: string;
          batch_id?: string | null;
          blood_group_id?: string | null;
          campus_id?: string | null;
          caste_id?: string | null;
          category_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          current_semester_id?: string | null;
          date_of_birth?: string | null;
          deleted_at?: string | null;
          deleted_by?: string | null;
          department_id?: string | null;
          email?: string | null;
          emergency_contact?: string | null;
          father_name?: string | null;
          first_name: string;
          gender?: Database["public"]["Enums"]["gender"] | null;
          graduation_date?: string | null;
          guardian_email?: string | null;
          guardian_name?: string | null;
          guardian_phone?: string | null;
          id?: string;
          last_name?: string | null;
          metadata?: Json;
          middle_name?: string | null;
          mother_name?: string | null;
          nationality_id?: string | null;
          phone?: string | null;
          photo_url?: string | null;
          program_id?: string | null;
          registration_number?: string | null;
          religion_id?: string | null;
          roll_number?: string | null;
          section_id?: string | null;
          status?: Database["public"]["Enums"]["student_status"];
          tenant_id: string;
          updated_at?: string;
          updated_by?: string | null;
          user_id?: string | null;
        };
        Update: {
          abc_id?: string | null;
          academic_year_id?: string | null;
          address?: Json;
          admission_date?: string | null;
          admission_number?: string;
          batch_id?: string | null;
          blood_group_id?: string | null;
          campus_id?: string | null;
          caste_id?: string | null;
          category_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          current_semester_id?: string | null;
          date_of_birth?: string | null;
          deleted_at?: string | null;
          deleted_by?: string | null;
          department_id?: string | null;
          email?: string | null;
          emergency_contact?: string | null;
          father_name?: string | null;
          first_name?: string;
          gender?: Database["public"]["Enums"]["gender"] | null;
          graduation_date?: string | null;
          guardian_email?: string | null;
          guardian_name?: string | null;
          guardian_phone?: string | null;
          id?: string;
          last_name?: string | null;
          metadata?: Json;
          middle_name?: string | null;
          mother_name?: string | null;
          nationality_id?: string | null;
          phone?: string | null;
          photo_url?: string | null;
          program_id?: string | null;
          registration_number?: string | null;
          religion_id?: string | null;
          roll_number?: string | null;
          section_id?: string | null;
          status?: Database["public"]["Enums"]["student_status"];
          tenant_id?: string;
          updated_at?: string;
          updated_by?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "students_academic_year_id_fkey";
            columns: ["academic_year_id"];
            isOneToOne: false;
            referencedRelation: "academic_years";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "students_batch_id_fkey";
            columns: ["batch_id"];
            isOneToOne: false;
            referencedRelation: "batches";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "students_blood_group_id_fkey";
            columns: ["blood_group_id"];
            isOneToOne: false;
            referencedRelation: "master_data_items";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "students_campus_id_fkey";
            columns: ["campus_id"];
            isOneToOne: false;
            referencedRelation: "campuses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "students_caste_id_fkey";
            columns: ["caste_id"];
            isOneToOne: false;
            referencedRelation: "master_data_items";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "students_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "master_data_items";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "students_current_semester_id_fkey";
            columns: ["current_semester_id"];
            isOneToOne: false;
            referencedRelation: "semesters";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "students_department_id_fkey";
            columns: ["department_id"];
            isOneToOne: false;
            referencedRelation: "departments";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "students_nationality_id_fkey";
            columns: ["nationality_id"];
            isOneToOne: false;
            referencedRelation: "master_data_items";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "students_program_id_fkey";
            columns: ["program_id"];
            isOneToOne: false;
            referencedRelation: "programs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "students_religion_id_fkey";
            columns: ["religion_id"];
            isOneToOne: false;
            referencedRelation: "master_data_items";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "students_section_id_fkey";
            columns: ["section_id"];
            isOneToOne: false;
            referencedRelation: "sections";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "students_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      taggables: {
        Row: {
          created_at: string;
          created_by: string | null;
          entity_id: string;
          entity_type: string;
          id: string;
          tag_id: string;
          tenant_id: string;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          entity_id: string;
          entity_type: string;
          id?: string;
          tag_id: string;
          tenant_id: string;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          entity_id?: string;
          entity_type?: string;
          id?: string;
          tag_id?: string;
          tenant_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "taggables_tag_id_fkey";
            columns: ["tag_id"];
            isOneToOne: false;
            referencedRelation: "tags";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "taggables_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      tags: {
        Row: {
          color: string | null;
          created_at: string;
          created_by: string | null;
          deleted_at: string | null;
          deleted_by: string | null;
          description: string | null;
          id: string;
          name: string;
          slug: string;
          tenant_id: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          color?: string | null;
          created_at?: string;
          created_by?: string | null;
          deleted_at?: string | null;
          deleted_by?: string | null;
          description?: string | null;
          id?: string;
          name: string;
          slug: string;
          tenant_id: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          color?: string | null;
          created_at?: string;
          created_by?: string | null;
          deleted_at?: string | null;
          deleted_by?: string | null;
          description?: string | null;
          id?: string;
          name?: string;
          slug?: string;
          tenant_id?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "tags_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      tenant_features: {
        Row: {
          campus_id: string | null;
          config: Json;
          created_at: string;
          created_by: string | null;
          enabled: boolean;
          feature_id: string;
          id: string;
          tenant_id: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          campus_id?: string | null;
          config?: Json;
          created_at?: string;
          created_by?: string | null;
          enabled?: boolean;
          feature_id: string;
          id?: string;
          tenant_id: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          campus_id?: string | null;
          config?: Json;
          created_at?: string;
          created_by?: string | null;
          enabled?: boolean;
          feature_id?: string;
          id?: string;
          tenant_id?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "tenant_features_campus_id_fkey";
            columns: ["campus_id"];
            isOneToOne: false;
            referencedRelation: "campuses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tenant_features_feature_id_fkey";
            columns: ["feature_id"];
            isOneToOne: false;
            referencedRelation: "features";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tenant_features_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      tenant_members: {
        Row: {
          campus_id: string | null;
          created_at: string;
          created_by: string | null;
          deleted_at: string | null;
          deleted_by: string | null;
          employee_code: string | null;
          id: string;
          joined_at: string;
          status: Database["public"]["Enums"]["member_status"];
          tenant_id: string;
          updated_at: string;
          updated_by: string | null;
          user_id: string;
        };
        Insert: {
          campus_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          deleted_at?: string | null;
          deleted_by?: string | null;
          employee_code?: string | null;
          id?: string;
          joined_at?: string;
          status?: Database["public"]["Enums"]["member_status"];
          tenant_id: string;
          updated_at?: string;
          updated_by?: string | null;
          user_id: string;
        };
        Update: {
          campus_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          deleted_at?: string | null;
          deleted_by?: string | null;
          employee_code?: string | null;
          id?: string;
          joined_at?: string;
          status?: Database["public"]["Enums"]["member_status"];
          tenant_id?: string;
          updated_at?: string;
          updated_by?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "tenant_members_campus_id_fkey";
            columns: ["campus_id"];
            isOneToOne: false;
            referencedRelation: "campuses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tenant_members_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      tenant_settings: {
        Row: {
          campus_id: string | null;
          created_at: string;
          created_by: string | null;
          id: string;
          key: string;
          scope: Database["public"]["Enums"]["setting_scope"];
          tenant_id: string;
          updated_at: string;
          updated_by: string | null;
          value: Json | null;
        };
        Insert: {
          campus_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          key: string;
          scope?: Database["public"]["Enums"]["setting_scope"];
          tenant_id: string;
          updated_at?: string;
          updated_by?: string | null;
          value?: Json | null;
        };
        Update: {
          campus_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          key?: string;
          scope?: Database["public"]["Enums"]["setting_scope"];
          tenant_id?: string;
          updated_at?: string;
          updated_by?: string | null;
          value?: Json | null;
        };
        Relationships: [
          {
            foreignKeyName: "tenant_settings_campus_id_fkey";
            columns: ["campus_id"];
            isOneToOne: false;
            referencedRelation: "campuses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tenant_settings_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      tenants: {
        Row: {
          accreditation: string | null;
          affiliation: string | null;
          code: string | null;
          contact_email: string | null;
          contact_phone: string | null;
          created_at: string;
          created_by: string | null;
          currency: string;
          deleted_at: string | null;
          deleted_by: string | null;
          established_year: number | null;
          id: string;
          legal_name: string | null;
          locale: string;
          logo_url: string | null;
          name: string;
          primary_color: string | null;
          slug: string;
          status: Database["public"]["Enums"]["tenant_status"];
          timezone: string;
          updated_at: string;
          updated_by: string | null;
          website: string | null;
        };
        Insert: {
          accreditation?: string | null;
          affiliation?: string | null;
          code?: string | null;
          contact_email?: string | null;
          contact_phone?: string | null;
          created_at?: string;
          created_by?: string | null;
          currency?: string;
          deleted_at?: string | null;
          deleted_by?: string | null;
          established_year?: number | null;
          id?: string;
          legal_name?: string | null;
          locale?: string;
          logo_url?: string | null;
          name: string;
          primary_color?: string | null;
          slug: string;
          status?: Database["public"]["Enums"]["tenant_status"];
          timezone?: string;
          updated_at?: string;
          updated_by?: string | null;
          website?: string | null;
        };
        Update: {
          accreditation?: string | null;
          affiliation?: string | null;
          code?: string | null;
          contact_email?: string | null;
          contact_phone?: string | null;
          created_at?: string;
          created_by?: string | null;
          currency?: string;
          deleted_at?: string | null;
          deleted_by?: string | null;
          established_year?: number | null;
          id?: string;
          legal_name?: string | null;
          locale?: string;
          logo_url?: string | null;
          name?: string;
          primary_color?: string | null;
          slug?: string;
          status?: Database["public"]["Enums"]["tenant_status"];
          timezone?: string;
          updated_at?: string;
          updated_by?: string | null;
          website?: string | null;
        };
        Relationships: [];
      };
      time_slots: {
        Row: {
          campus_id: string | null;
          created_at: string;
          created_by: string | null;
          day_of_week: number;
          deleted_at: string | null;
          deleted_by: string | null;
          end_time: string;
          id: string;
          is_active: boolean;
          is_break: boolean;
          name: string;
          slot_order: number;
          start_time: string;
          tenant_id: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          campus_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          day_of_week?: number;
          deleted_at?: string | null;
          deleted_by?: string | null;
          end_time: string;
          id?: string;
          is_active?: boolean;
          is_break?: boolean;
          name: string;
          slot_order?: number;
          start_time: string;
          tenant_id: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          campus_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          day_of_week?: number;
          deleted_at?: string | null;
          deleted_by?: string | null;
          end_time?: string;
          id?: string;
          is_active?: boolean;
          is_break?: boolean;
          name?: string;
          slot_order?: number;
          start_time?: string;
          tenant_id?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "time_slots_campus_id_fkey";
            columns: ["campus_id"];
            isOneToOne: false;
            referencedRelation: "campuses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "time_slots_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      timetable_entries: {
        Row: {
          academic_session_id: string | null;
          campus_id: string | null;
          course_id: string | null;
          created_at: string;
          created_by: string | null;
          deleted_at: string | null;
          effective_from: string | null;
          effective_to: string | null;
          ends_at: string;
          faculty_id: string | null;
          id: string;
          is_cancelled: boolean;
          kind: Database["public"]["Enums"]["timetable_kind"];
          metadata: Json;
          notes: string | null;
          override_date: string | null;
          room_id: string | null;
          section_id: string | null;
          semester_id: string | null;
          session_type: Database["public"]["Enums"]["class_session_type"];
          skip_on_holiday: boolean;
          starts_at: string;
          tenant_id: string;
          time_slot_id: string | null;
          updated_at: string;
          updated_by: string | null;
          weekday: number;
        };
        Insert: {
          academic_session_id?: string | null;
          campus_id?: string | null;
          course_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          deleted_at?: string | null;
          effective_from?: string | null;
          effective_to?: string | null;
          ends_at: string;
          faculty_id?: string | null;
          id?: string;
          is_cancelled?: boolean;
          kind?: Database["public"]["Enums"]["timetable_kind"];
          metadata?: Json;
          notes?: string | null;
          override_date?: string | null;
          room_id?: string | null;
          section_id?: string | null;
          semester_id?: string | null;
          session_type?: Database["public"]["Enums"]["class_session_type"];
          skip_on_holiday?: boolean;
          starts_at: string;
          tenant_id: string;
          time_slot_id?: string | null;
          updated_at?: string;
          updated_by?: string | null;
          weekday: number;
        };
        Update: {
          academic_session_id?: string | null;
          campus_id?: string | null;
          course_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          deleted_at?: string | null;
          effective_from?: string | null;
          effective_to?: string | null;
          ends_at?: string;
          faculty_id?: string | null;
          id?: string;
          is_cancelled?: boolean;
          kind?: Database["public"]["Enums"]["timetable_kind"];
          metadata?: Json;
          notes?: string | null;
          override_date?: string | null;
          room_id?: string | null;
          section_id?: string | null;
          semester_id?: string | null;
          session_type?: Database["public"]["Enums"]["class_session_type"];
          skip_on_holiday?: boolean;
          starts_at?: string;
          tenant_id?: string;
          time_slot_id?: string | null;
          updated_at?: string;
          updated_by?: string | null;
          weekday?: number;
        };
        Relationships: [
          {
            foreignKeyName: "timetable_entries_academic_session_id_fkey";
            columns: ["academic_session_id"];
            isOneToOne: false;
            referencedRelation: "academic_sessions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "timetable_entries_campus_id_fkey";
            columns: ["campus_id"];
            isOneToOne: false;
            referencedRelation: "campuses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "timetable_entries_course_id_fkey";
            columns: ["course_id"];
            isOneToOne: false;
            referencedRelation: "courses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "timetable_entries_faculty_id_fkey";
            columns: ["faculty_id"];
            isOneToOne: false;
            referencedRelation: "faculty";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "timetable_entries_room_id_fkey";
            columns: ["room_id"];
            isOneToOne: false;
            referencedRelation: "rooms";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "timetable_entries_section_id_fkey";
            columns: ["section_id"];
            isOneToOne: false;
            referencedRelation: "sections";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "timetable_entries_semester_id_fkey";
            columns: ["semester_id"];
            isOneToOne: false;
            referencedRelation: "semesters";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "timetable_entries_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "timetable_entries_time_slot_id_fkey";
            columns: ["time_slot_id"];
            isOneToOne: false;
            referencedRelation: "time_slots";
            referencedColumns: ["id"];
          },
        ];
      };
      timetable_substitutions: {
        Row: {
          approved_at: string | null;
          approved_by: string | null;
          created_at: string;
          created_by: string | null;
          deleted_at: string | null;
          id: string;
          is_emergency: boolean;
          original_faculty_id: string | null;
          reason: string | null;
          room_id: string | null;
          status: Database["public"]["Enums"]["approval_state"];
          substitute_faculty_id: string | null;
          substitution_date: string;
          tenant_id: string;
          timetable_entry_id: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          approved_at?: string | null;
          approved_by?: string | null;
          created_at?: string;
          created_by?: string | null;
          deleted_at?: string | null;
          id?: string;
          is_emergency?: boolean;
          original_faculty_id?: string | null;
          reason?: string | null;
          room_id?: string | null;
          status?: Database["public"]["Enums"]["approval_state"];
          substitute_faculty_id?: string | null;
          substitution_date: string;
          tenant_id: string;
          timetable_entry_id: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          approved_at?: string | null;
          approved_by?: string | null;
          created_at?: string;
          created_by?: string | null;
          deleted_at?: string | null;
          id?: string;
          is_emergency?: boolean;
          original_faculty_id?: string | null;
          reason?: string | null;
          room_id?: string | null;
          status?: Database["public"]["Enums"]["approval_state"];
          substitute_faculty_id?: string | null;
          substitution_date?: string;
          tenant_id?: string;
          timetable_entry_id?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "timetable_substitutions_original_faculty_id_fkey";
            columns: ["original_faculty_id"];
            isOneToOne: false;
            referencedRelation: "faculty";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "timetable_substitutions_room_id_fkey";
            columns: ["room_id"];
            isOneToOne: false;
            referencedRelation: "rooms";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "timetable_substitutions_substitute_faculty_id_fkey";
            columns: ["substitute_faculty_id"];
            isOneToOne: false;
            referencedRelation: "faculty";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "timetable_substitutions_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "timetable_substitutions_timetable_entry_id_fkey";
            columns: ["timetable_entry_id"];
            isOneToOne: false;
            referencedRelation: "timetable_entries";
            referencedColumns: ["id"];
          },
        ];
      };
      user_permission_overrides: {
        Row: {
          created_at: string;
          created_by: string | null;
          effect: Database["public"]["Enums"]["permission_effect"];
          id: string;
          permission_id: string;
          reason: string | null;
          tenant_id: string | null;
          updated_at: string;
          updated_by: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          effect?: Database["public"]["Enums"]["permission_effect"];
          id?: string;
          permission_id: string;
          reason?: string | null;
          tenant_id?: string | null;
          updated_at?: string;
          updated_by?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          effect?: Database["public"]["Enums"]["permission_effect"];
          id?: string;
          permission_id?: string;
          reason?: string | null;
          tenant_id?: string | null;
          updated_at?: string;
          updated_by?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_permission_overrides_permission_id_fkey";
            columns: ["permission_id"];
            isOneToOne: false;
            referencedRelation: "permissions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "user_permission_overrides_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      user_roles: {
        Row: {
          campus_id: string | null;
          created_at: string;
          created_by: string | null;
          deleted_at: string | null;
          deleted_by: string | null;
          department_id: string | null;
          id: string;
          role_id: string;
          scope: Database["public"]["Enums"]["assignment_scope"];
          tenant_id: string | null;
          updated_at: string;
          updated_by: string | null;
          user_id: string;
          valid_from: string;
          valid_until: string | null;
        };
        Insert: {
          campus_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          deleted_at?: string | null;
          deleted_by?: string | null;
          department_id?: string | null;
          id?: string;
          role_id: string;
          scope?: Database["public"]["Enums"]["assignment_scope"];
          tenant_id?: string | null;
          updated_at?: string;
          updated_by?: string | null;
          user_id: string;
          valid_from?: string;
          valid_until?: string | null;
        };
        Update: {
          campus_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          deleted_at?: string | null;
          deleted_by?: string | null;
          department_id?: string | null;
          id?: string;
          role_id?: string;
          scope?: Database["public"]["Enums"]["assignment_scope"];
          tenant_id?: string | null;
          updated_at?: string;
          updated_by?: string | null;
          user_id?: string;
          valid_from?: string;
          valid_until?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "user_roles_campus_id_fkey";
            columns: ["campus_id"];
            isOneToOne: false;
            referencedRelation: "campuses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "user_roles_department_fk";
            columns: ["department_id"];
            isOneToOne: false;
            referencedRelation: "departments";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "user_roles_role_id_fkey";
            columns: ["role_id"];
            isOneToOne: false;
            referencedRelation: "roles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "user_roles_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      webhook_deliveries: {
        Row: {
          attempts: number;
          created_at: string;
          delivered_at: string | null;
          endpoint_id: string;
          error: string | null;
          event_id: string;
          id: string;
          next_retry_at: string | null;
          response_body: string | null;
          response_status: number | null;
          status: Database["public"]["Enums"]["job_status"];
          tenant_id: string;
          updated_at: string;
        };
        Insert: {
          attempts?: number;
          created_at?: string;
          delivered_at?: string | null;
          endpoint_id: string;
          error?: string | null;
          event_id: string;
          id?: string;
          next_retry_at?: string | null;
          response_body?: string | null;
          response_status?: number | null;
          status?: Database["public"]["Enums"]["job_status"];
          tenant_id: string;
          updated_at?: string;
        };
        Update: {
          attempts?: number;
          created_at?: string;
          delivered_at?: string | null;
          endpoint_id?: string;
          error?: string | null;
          event_id?: string;
          id?: string;
          next_retry_at?: string | null;
          response_body?: string | null;
          response_status?: number | null;
          status?: Database["public"]["Enums"]["job_status"];
          tenant_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "webhook_deliveries_endpoint_id_fkey";
            columns: ["endpoint_id"];
            isOneToOne: false;
            referencedRelation: "webhook_endpoints";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "webhook_deliveries_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "webhook_events";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "webhook_deliveries_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      webhook_endpoints: {
        Row: {
          created_at: string;
          created_by: string | null;
          deleted_at: string | null;
          deleted_by: string | null;
          events: string[];
          id: string;
          is_active: boolean;
          max_retries: number;
          name: string;
          secret_hash: string | null;
          tenant_id: string;
          updated_at: string;
          updated_by: string | null;
          url: string;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          deleted_at?: string | null;
          deleted_by?: string | null;
          events?: string[];
          id?: string;
          is_active?: boolean;
          max_retries?: number;
          name: string;
          secret_hash?: string | null;
          tenant_id: string;
          updated_at?: string;
          updated_by?: string | null;
          url: string;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          deleted_at?: string | null;
          deleted_by?: string | null;
          events?: string[];
          id?: string;
          is_active?: boolean;
          max_retries?: number;
          name?: string;
          secret_hash?: string | null;
          tenant_id?: string;
          updated_at?: string;
          updated_by?: string | null;
          url?: string;
        };
        Relationships: [
          {
            foreignKeyName: "webhook_endpoints_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      webhook_events: {
        Row: {
          created_at: string;
          entity_id: string | null;
          entity_type: string | null;
          event_key: string;
          id: string;
          payload: Json;
          tenant_id: string;
        };
        Insert: {
          created_at?: string;
          entity_id?: string | null;
          entity_type?: string | null;
          event_key: string;
          id?: string;
          payload?: Json;
          tenant_id: string;
        };
        Update: {
          created_at?: string;
          entity_id?: string | null;
          entity_type?: string | null;
          event_key?: string;
          id?: string;
          payload?: Json;
          tenant_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "webhook_events_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      widgets: {
        Row: {
          category: string | null;
          config_schema: Json;
          created_at: string;
          default_height: number;
          default_width: number;
          description: string | null;
          id: string;
          is_active: boolean;
          key: string;
          module: string | null;
          name: string;
          required_permission: string | null;
        };
        Insert: {
          category?: string | null;
          config_schema?: Json;
          created_at?: string;
          default_height?: number;
          default_width?: number;
          description?: string | null;
          id?: string;
          is_active?: boolean;
          key: string;
          module?: string | null;
          name: string;
          required_permission?: string | null;
        };
        Update: {
          category?: string | null;
          config_schema?: Json;
          created_at?: string;
          default_height?: number;
          default_width?: number;
          description?: string | null;
          id?: string;
          is_active?: boolean;
          key?: string;
          module?: string | null;
          name?: string;
          required_permission?: string | null;
        };
        Relationships: [];
      };
      workflow_actions: {
        Row: {
          action: Database["public"]["Enums"]["workflow_action_type"];
          actor_id: string | null;
          comment: string | null;
          created_at: string;
          id: string;
          instance_id: string;
          metadata: Json;
          step_instance_id: string | null;
          tenant_id: string;
        };
        Insert: {
          action: Database["public"]["Enums"]["workflow_action_type"];
          actor_id?: string | null;
          comment?: string | null;
          created_at?: string;
          id?: string;
          instance_id: string;
          metadata?: Json;
          step_instance_id?: string | null;
          tenant_id: string;
        };
        Update: {
          action?: Database["public"]["Enums"]["workflow_action_type"];
          actor_id?: string | null;
          comment?: string | null;
          created_at?: string;
          id?: string;
          instance_id?: string;
          metadata?: Json;
          step_instance_id?: string | null;
          tenant_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "workflow_actions_instance_id_fkey";
            columns: ["instance_id"];
            isOneToOne: false;
            referencedRelation: "workflow_instances";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "workflow_actions_step_instance_id_fkey";
            columns: ["step_instance_id"];
            isOneToOne: false;
            referencedRelation: "workflow_step_instances";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "workflow_actions_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      workflow_instances: {
        Row: {
          campus_id: string | null;
          completed_at: string | null;
          created_at: string;
          created_by: string | null;
          current_step_order: number;
          deleted_at: string | null;
          deleted_by: string | null;
          due_at: string | null;
          entity_id: string;
          entity_type: string;
          id: string;
          payload: Json;
          requested_by: string | null;
          status: Database["public"]["Enums"]["workflow_instance_status"];
          subject: string | null;
          tenant_id: string;
          updated_at: string;
          updated_by: string | null;
          version: number;
          workflow_id: string;
        };
        Insert: {
          campus_id?: string | null;
          completed_at?: string | null;
          created_at?: string;
          created_by?: string | null;
          current_step_order?: number;
          deleted_at?: string | null;
          deleted_by?: string | null;
          due_at?: string | null;
          entity_id: string;
          entity_type: string;
          id?: string;
          payload?: Json;
          requested_by?: string | null;
          status?: Database["public"]["Enums"]["workflow_instance_status"];
          subject?: string | null;
          tenant_id: string;
          updated_at?: string;
          updated_by?: string | null;
          version?: number;
          workflow_id: string;
        };
        Update: {
          campus_id?: string | null;
          completed_at?: string | null;
          created_at?: string;
          created_by?: string | null;
          current_step_order?: number;
          deleted_at?: string | null;
          deleted_by?: string | null;
          due_at?: string | null;
          entity_id?: string;
          entity_type?: string;
          id?: string;
          payload?: Json;
          requested_by?: string | null;
          status?: Database["public"]["Enums"]["workflow_instance_status"];
          subject?: string | null;
          tenant_id?: string;
          updated_at?: string;
          updated_by?: string | null;
          version?: number;
          workflow_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "workflow_instances_campus_id_fkey";
            columns: ["campus_id"];
            isOneToOne: false;
            referencedRelation: "campuses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "workflow_instances_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "workflow_instances_workflow_id_fkey";
            columns: ["workflow_id"];
            isOneToOne: false;
            referencedRelation: "workflows";
            referencedColumns: ["id"];
          },
        ];
      };
      workflow_step_instances: {
        Row: {
          assigned_role_id: string | null;
          assigned_user_id: string | null;
          completed_at: string | null;
          created_at: string;
          due_at: string | null;
          id: string;
          instance_id: string;
          name: string;
          status: Database["public"]["Enums"]["workflow_instance_status"];
          step_id: string | null;
          step_order: number;
          tenant_id: string;
          updated_at: string;
        };
        Insert: {
          assigned_role_id?: string | null;
          assigned_user_id?: string | null;
          completed_at?: string | null;
          created_at?: string;
          due_at?: string | null;
          id?: string;
          instance_id: string;
          name: string;
          status?: Database["public"]["Enums"]["workflow_instance_status"];
          step_id?: string | null;
          step_order: number;
          tenant_id: string;
          updated_at?: string;
        };
        Update: {
          assigned_role_id?: string | null;
          assigned_user_id?: string | null;
          completed_at?: string | null;
          created_at?: string;
          due_at?: string | null;
          id?: string;
          instance_id?: string;
          name?: string;
          status?: Database["public"]["Enums"]["workflow_instance_status"];
          step_id?: string | null;
          step_order?: number;
          tenant_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "workflow_step_instances_assigned_role_id_fkey";
            columns: ["assigned_role_id"];
            isOneToOne: false;
            referencedRelation: "roles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "workflow_step_instances_instance_id_fkey";
            columns: ["instance_id"];
            isOneToOne: false;
            referencedRelation: "workflow_instances";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "workflow_step_instances_step_id_fkey";
            columns: ["step_id"];
            isOneToOne: false;
            referencedRelation: "workflow_steps";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "workflow_step_instances_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      workflow_steps: {
        Row: {
          allow_delegate: boolean;
          approver_department_id: string | null;
          approver_permission: string | null;
          approver_role_id: string | null;
          approver_user_id: string | null;
          conditions: Json;
          created_at: string;
          id: string;
          mode: Database["public"]["Enums"]["workflow_step_mode"];
          name: string;
          on_approve: Json;
          on_reject: Json;
          sla_hours: number | null;
          step_order: number;
          tenant_id: string;
          updated_at: string;
          version: number;
          workflow_id: string;
        };
        Insert: {
          allow_delegate?: boolean;
          approver_department_id?: string | null;
          approver_permission?: string | null;
          approver_role_id?: string | null;
          approver_user_id?: string | null;
          conditions?: Json;
          created_at?: string;
          id?: string;
          mode?: Database["public"]["Enums"]["workflow_step_mode"];
          name: string;
          on_approve?: Json;
          on_reject?: Json;
          sla_hours?: number | null;
          step_order: number;
          tenant_id: string;
          updated_at?: string;
          version?: number;
          workflow_id: string;
        };
        Update: {
          allow_delegate?: boolean;
          approver_department_id?: string | null;
          approver_permission?: string | null;
          approver_role_id?: string | null;
          approver_user_id?: string | null;
          conditions?: Json;
          created_at?: string;
          id?: string;
          mode?: Database["public"]["Enums"]["workflow_step_mode"];
          name?: string;
          on_approve?: Json;
          on_reject?: Json;
          sla_hours?: number | null;
          step_order?: number;
          tenant_id?: string;
          updated_at?: string;
          version?: number;
          workflow_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "workflow_steps_approver_department_id_fkey";
            columns: ["approver_department_id"];
            isOneToOne: false;
            referencedRelation: "departments";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "workflow_steps_approver_role_id_fkey";
            columns: ["approver_role_id"];
            isOneToOne: false;
            referencedRelation: "roles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "workflow_steps_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "workflow_steps_workflow_id_fkey";
            columns: ["workflow_id"];
            isOneToOne: false;
            referencedRelation: "workflows";
            referencedColumns: ["id"];
          },
        ];
      };
      workflow_versions: {
        Row: {
          created_at: string;
          created_by: string | null;
          definition: Json;
          id: string;
          is_published: boolean;
          published_at: string | null;
          tenant_id: string;
          version: number;
          workflow_id: string;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          definition?: Json;
          id?: string;
          is_published?: boolean;
          published_at?: string | null;
          tenant_id: string;
          version: number;
          workflow_id: string;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          definition?: Json;
          id?: string;
          is_published?: boolean;
          published_at?: string | null;
          tenant_id?: string;
          version?: number;
          workflow_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "workflow_versions_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "workflow_versions_workflow_id_fkey";
            columns: ["workflow_id"];
            isOneToOne: false;
            referencedRelation: "workflows";
            referencedColumns: ["id"];
          },
        ];
      };
      workflows: {
        Row: {
          auto_start: boolean;
          created_at: string;
          created_by: string | null;
          current_version: number;
          deleted_at: string | null;
          deleted_by: string | null;
          description: string | null;
          entity_type: string;
          id: string;
          key: string;
          module: string;
          name: string;
          status: Database["public"]["Enums"]["workflow_status"];
          tenant_id: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          auto_start?: boolean;
          created_at?: string;
          created_by?: string | null;
          current_version?: number;
          deleted_at?: string | null;
          deleted_by?: string | null;
          description?: string | null;
          entity_type: string;
          id?: string;
          key: string;
          module: string;
          name: string;
          status?: Database["public"]["Enums"]["workflow_status"];
          tenant_id: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          auto_start?: boolean;
          created_at?: string;
          created_by?: string | null;
          current_version?: number;
          deleted_at?: string | null;
          deleted_by?: string | null;
          description?: string | null;
          entity_type?: string;
          id?: string;
          key?: string;
          module?: string;
          name?: string;
          status?: Database["public"]["Enums"]["workflow_status"];
          tenant_id?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "workflows_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      has_permission: {
        Args: {
          _permission_key: string;
          _tenant_id?: string;
          _user_id?: string;
        };
        Returns: boolean;
      };
      has_role: {
        Args: { _role_key: string; _tenant_id?: string; _user_id?: string };
        Returns: boolean;
      };
      is_platform_admin: { Args: { _user_id?: string }; Returns: boolean };
      is_tenant_member: {
        Args: { _tenant_id: string; _user_id?: string };
        Returns: boolean;
      };
      my_access: { Args: never; Returns: Json };
      show_limit: { Args: never; Returns: number };
      show_trgm: { Args: { "": string }; Returns: string[] };
      user_tenant_ids: { Args: { _user_id?: string }; Returns: string[] };
    };
    Enums: {
      ai_job_kind:
        | "chat"
        | "question_paper"
        | "assignment"
        | "lesson_plan"
        | "report"
        | "prediction"
        | "summary"
        | "embedding"
        | "other";
      allocation_role: "lead" | "co_faculty" | "lab_instructor" | "tutor" | "guest";
      approval_state: "pending" | "approved" | "rejected" | "cancelled";
      assessment_category:
        | "internal"
        | "mid_semester"
        | "end_semester"
        | "quiz"
        | "assignment"
        | "project"
        | "practical"
        | "lab"
        | "seminar"
        | "presentation"
        | "viva"
        | "continuous"
        | "custom";
      assignment_scope: "global" | "tenant" | "campus" | "department";
      attendance_mode:
        | "manual"
        | "qr"
        | "barcode"
        | "rfid"
        | "biometric"
        | "nfc"
        | "gps"
        | "self_checkin"
        | "bulk"
        | "import";
      attendance_status:
        "present" | "absent" | "late" | "excused" | "on_leave" | "on_duty" | "medical" | "holiday";
      attendee_kind: "student" | "faculty" | "staff";
      audit_action:
        | "create"
        | "update"
        | "delete"
        | "restore"
        | "login"
        | "logout"
        | "export"
        | "import"
        | "view"
        | "approve"
        | "reject"
        | "assign"
        | "custom";
      bloom_level: "remember" | "understand" | "apply" | "analyze" | "evaluate" | "create";
      calendar_event_type:
        "academic" | "exam" | "holiday" | "event" | "meeting" | "deadline" | "personal" | "other";
      certificate_kind:
        "marksheet" | "grade_card" | "transcript" | "provisional" | "migration" | "bonafide";
      class_session_type:
        | "lecture"
        | "practical"
        | "lab"
        | "seminar"
        | "workshop"
        | "tutorial"
        | "exam"
        | "daily"
        | "hostel"
        | "transport"
        | "other";
      course_type:
        "core" | "elective" | "open_elective" | "lab" | "project" | "internship" | "audit";
      curriculum_category:
        | "core"
        | "elective"
        | "open_elective"
        | "lab"
        | "project"
        | "internship"
        | "skill"
        | "value_added"
        | "audit"
        | "mandatory_non_credit";
      curriculum_status: "draft" | "pending_approval" | "active" | "superseded" | "archived";
      custom_field_type:
        | "text"
        | "textarea"
        | "number"
        | "decimal"
        | "boolean"
        | "date"
        | "datetime"
        | "select"
        | "multiselect"
        | "email"
        | "phone"
        | "url"
        | "file"
        | "json";
      document_status: "draft" | "pending" | "verified" | "rejected" | "expired" | "archived";
      employment_status:
        "active" | "probation" | "on_leave" | "resigned" | "terminated" | "retired";
      employment_type: "full_time" | "part_time" | "contract" | "visiting" | "guest" | "intern";
      enrollment_status: "registered" | "active" | "completed" | "withdrawn" | "failed";
      evaluation_kind: "first" | "second" | "third" | "moderation" | "revaluation" | "challenge";
      exam_duty_role: "invigilator" | "observer" | "squad" | "coordinator" | "relief";
      exam_registration_status:
        "pending" | "eligible" | "ineligible" | "registered" | "withheld" | "cancelled";
      exam_status:
        | "planned"
        | "scheduled"
        | "registration_open"
        | "in_progress"
        | "evaluation"
        | "completed"
        | "published"
        | "cancelled";
      export_format: "csv" | "xlsx" | "pdf" | "json";
      gender: "male" | "female" | "other" | "undisclosed";
      io_job_status:
        "pending" | "validating" | "processing" | "completed" | "failed" | "partial" | "cancelled";
      job_status: "queued" | "running" | "succeeded" | "failed" | "cancelled" | "retrying";
      leave_kind: "casual" | "medical" | "duty" | "sports" | "maternity" | "bereavement" | "other";
      lms_assignment_mode: "individual" | "group";
      lms_attempt_status: "in_progress" | "submitted" | "auto_submitted" | "evaluated";
      lms_content_kind:
        | "page"
        | "note"
        | "pdf"
        | "ppt"
        | "doc"
        | "sheet"
        | "image"
        | "video"
        | "audio"
        | "zip"
        | "link"
        | "youtube"
        | "drive"
        | "other";
      lms_discussion_kind: "question" | "discussion" | "announcement";
      lms_live_provider: "google_meet" | "zoom" | "teams" | "other";
      lms_node_kind: "module" | "chapter" | "lesson" | "topic";
      lms_plan_kind: "lesson" | "weekly" | "semester" | "teaching";
      lms_progress_state: "not_started" | "in_progress" | "completed";
      lms_publish_status: "draft" | "pending_approval" | "scheduled" | "published" | "archived";
      lms_question_kind: "mcq" | "msq" | "subjective" | "numerical" | "coding";
      lms_submission_channel: "online" | "offline" | "both";
      lms_submission_status: "draft" | "submitted" | "late" | "returned" | "graded" | "resubmit";
      mark_status:
        "draft" | "submitted" | "under_moderation" | "approved" | "published" | "rejected";
      member_status: "invited" | "active" | "suspended" | "left";
      notification_channel: "in_app" | "email" | "sms" | "push" | "whatsapp";
      notification_priority: "low" | "normal" | "high" | "urgent";
      notification_status:
        "pending" | "queued" | "sent" | "delivered" | "failed" | "read" | "cancelled";
      permission_effect: "allow" | "deny";
      program_level:
        "certificate" | "diploma" | "undergraduate" | "postgraduate" | "doctorate" | "postdoctoral";
      question_difficulty: "easy" | "moderate" | "difficult";
      question_paper_status:
        "draft" | "pending_approval" | "approved" | "rejected" | "locked" | "released";
      result_status:
        "draft" | "provisional" | "pending_approval" | "approved" | "published" | "withheld";
      revaluation_kind: "revaluation" | "challenge" | "retotal" | "photocopy";
      room_type:
        "classroom" | "lab" | "seminar_hall" | "auditorium" | "library" | "office" | "other";
      setting_scope:
        | "general"
        | "academic"
        | "finance"
        | "notification"
        | "branding"
        | "security"
        | "integration";
      specialization_kind: "major" | "minor" | "specialization" | "honours";
      student_status:
        | "applicant"
        | "enrolled"
        | "on_leave"
        | "graduated"
        | "dropped"
        | "suspended"
        | "transferred";
      tenant_status: "trial" | "active" | "suspended" | "cancelled";
      timetable_kind: "recurring" | "temporary";
      workflow_action_type: "approve" | "reject" | "return" | "comment" | "reassign" | "cancel";
      workflow_instance_status:
        "pending" | "in_progress" | "approved" | "rejected" | "returned" | "cancelled" | "expired";
      workflow_status: "draft" | "active" | "archived";
      workflow_step_mode: "serial" | "parallel" | "any";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      ai_job_kind: [
        "chat",
        "question_paper",
        "assignment",
        "lesson_plan",
        "report",
        "prediction",
        "summary",
        "embedding",
        "other",
      ],
      allocation_role: ["lead", "co_faculty", "lab_instructor", "tutor", "guest"],
      approval_state: ["pending", "approved", "rejected", "cancelled"],
      assessment_category: [
        "internal",
        "mid_semester",
        "end_semester",
        "quiz",
        "assignment",
        "project",
        "practical",
        "lab",
        "seminar",
        "presentation",
        "viva",
        "continuous",
        "custom",
      ],
      assignment_scope: ["global", "tenant", "campus", "department"],
      attendance_mode: [
        "manual",
        "qr",
        "barcode",
        "rfid",
        "biometric",
        "nfc",
        "gps",
        "self_checkin",
        "bulk",
        "import",
      ],
      attendance_status: [
        "present",
        "absent",
        "late",
        "excused",
        "on_leave",
        "on_duty",
        "medical",
        "holiday",
      ],
      attendee_kind: ["student", "faculty", "staff"],
      audit_action: [
        "create",
        "update",
        "delete",
        "restore",
        "login",
        "logout",
        "export",
        "import",
        "view",
        "approve",
        "reject",
        "assign",
        "custom",
      ],
      bloom_level: ["remember", "understand", "apply", "analyze", "evaluate", "create"],
      calendar_event_type: [
        "academic",
        "exam",
        "holiday",
        "event",
        "meeting",
        "deadline",
        "personal",
        "other",
      ],
      certificate_kind: [
        "marksheet",
        "grade_card",
        "transcript",
        "provisional",
        "migration",
        "bonafide",
      ],
      class_session_type: [
        "lecture",
        "practical",
        "lab",
        "seminar",
        "workshop",
        "tutorial",
        "exam",
        "daily",
        "hostel",
        "transport",
        "other",
      ],
      course_type: ["core", "elective", "open_elective", "lab", "project", "internship", "audit"],
      curriculum_category: [
        "core",
        "elective",
        "open_elective",
        "lab",
        "project",
        "internship",
        "skill",
        "value_added",
        "audit",
        "mandatory_non_credit",
      ],
      curriculum_status: ["draft", "pending_approval", "active", "superseded", "archived"],
      custom_field_type: [
        "text",
        "textarea",
        "number",
        "decimal",
        "boolean",
        "date",
        "datetime",
        "select",
        "multiselect",
        "email",
        "phone",
        "url",
        "file",
        "json",
      ],
      document_status: ["draft", "pending", "verified", "rejected", "expired", "archived"],
      employment_status: ["active", "probation", "on_leave", "resigned", "terminated", "retired"],
      employment_type: ["full_time", "part_time", "contract", "visiting", "guest", "intern"],
      enrollment_status: ["registered", "active", "completed", "withdrawn", "failed"],
      evaluation_kind: ["first", "second", "third", "moderation", "revaluation", "challenge"],
      exam_duty_role: ["invigilator", "observer", "squad", "coordinator", "relief"],
      exam_registration_status: [
        "pending",
        "eligible",
        "ineligible",
        "registered",
        "withheld",
        "cancelled",
      ],
      exam_status: [
        "planned",
        "scheduled",
        "registration_open",
        "in_progress",
        "evaluation",
        "completed",
        "published",
        "cancelled",
      ],
      export_format: ["csv", "xlsx", "pdf", "json"],
      gender: ["male", "female", "other", "undisclosed"],
      io_job_status: [
        "pending",
        "validating",
        "processing",
        "completed",
        "failed",
        "partial",
        "cancelled",
      ],
      job_status: ["queued", "running", "succeeded", "failed", "cancelled", "retrying"],
      leave_kind: ["casual", "medical", "duty", "sports", "maternity", "bereavement", "other"],
      lms_assignment_mode: ["individual", "group"],
      lms_attempt_status: ["in_progress", "submitted", "auto_submitted", "evaluated"],
      lms_content_kind: [
        "page",
        "note",
        "pdf",
        "ppt",
        "doc",
        "sheet",
        "image",
        "video",
        "audio",
        "zip",
        "link",
        "youtube",
        "drive",
        "other",
      ],
      lms_discussion_kind: ["question", "discussion", "announcement"],
      lms_live_provider: ["google_meet", "zoom", "teams", "other"],
      lms_node_kind: ["module", "chapter", "lesson", "topic"],
      lms_plan_kind: ["lesson", "weekly", "semester", "teaching"],
      lms_progress_state: ["not_started", "in_progress", "completed"],
      lms_publish_status: ["draft", "pending_approval", "scheduled", "published", "archived"],
      lms_question_kind: ["mcq", "msq", "subjective", "numerical", "coding"],
      lms_submission_channel: ["online", "offline", "both"],
      lms_submission_status: ["draft", "submitted", "late", "returned", "graded", "resubmit"],
      mark_status: ["draft", "submitted", "under_moderation", "approved", "published", "rejected"],
      member_status: ["invited", "active", "suspended", "left"],
      notification_channel: ["in_app", "email", "sms", "push", "whatsapp"],
      notification_priority: ["low", "normal", "high", "urgent"],
      notification_status: [
        "pending",
        "queued",
        "sent",
        "delivered",
        "failed",
        "read",
        "cancelled",
      ],
      permission_effect: ["allow", "deny"],
      program_level: [
        "certificate",
        "diploma",
        "undergraduate",
        "postgraduate",
        "doctorate",
        "postdoctoral",
      ],
      question_difficulty: ["easy", "moderate", "difficult"],
      question_paper_status: [
        "draft",
        "pending_approval",
        "approved",
        "rejected",
        "locked",
        "released",
      ],
      result_status: [
        "draft",
        "provisional",
        "pending_approval",
        "approved",
        "published",
        "withheld",
      ],
      revaluation_kind: ["revaluation", "challenge", "retotal", "photocopy"],
      room_type: ["classroom", "lab", "seminar_hall", "auditorium", "library", "office", "other"],
      setting_scope: [
        "general",
        "academic",
        "finance",
        "notification",
        "branding",
        "security",
        "integration",
      ],
      specialization_kind: ["major", "minor", "specialization", "honours"],
      student_status: [
        "applicant",
        "enrolled",
        "on_leave",
        "graduated",
        "dropped",
        "suspended",
        "transferred",
      ],
      tenant_status: ["trial", "active", "suspended", "cancelled"],
      timetable_kind: ["recurring", "temporary"],
      workflow_action_type: ["approve", "reject", "return", "comment", "reassign", "cancel"],
      workflow_instance_status: [
        "pending",
        "in_progress",
        "approved",
        "rejected",
        "returned",
        "cancelled",
        "expired",
      ],
      workflow_status: ["draft", "active", "archived"],
      workflow_step_mode: ["serial", "parallel", "any"],
    },
  },
} as const;
