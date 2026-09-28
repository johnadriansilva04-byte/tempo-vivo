/** Tipos Database tipados manualmente — mantêm o client Supabase type-safe sem codegen. */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string;
          bio: string;
          role: string;
          location: string;
          birth_date: string | null;
          target_lifespan: number;
          avatar_url: string | null;
          cover_url: string | null;
          slug: string | null;
          phone: string | null;
          presentation: string;
          is_public: boolean;
          show_schedule: boolean;
          show_projects: boolean;
          show_achievements: boolean;
          show_family: boolean;
          meetings_enabled: boolean;
          meeting_duration_min: number;
          meeting_buffer_min: number;
          meeting_max_per_day: number;
          meeting_requires_approval: boolean;
          meeting_requirements: string;
          created_at: string;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          full_name?: string;
          bio?: string;
          role?: string;
          location?: string;
          birth_date?: string | null;
          target_lifespan?: number;
          avatar_url?: string | null;
          cover_url?: string | null;
          slug?: string | null;
          phone?: string | null;
          presentation?: string;
          is_public?: boolean;
          show_schedule?: boolean;
          show_projects?: boolean;
          show_achievements?: boolean;
          show_family?: boolean;
          meetings_enabled?: boolean;
          meeting_duration_min?: number;
          meeting_buffer_min?: number;
          meeting_max_per_day?: number;
          meeting_requires_approval?: boolean;
          meeting_requirements?: string;
          created_at?: string;
          updated_at?: string | null;
        };
        Update: {
          full_name?: string;
          bio?: string;
          role?: string;
          location?: string;
          birth_date?: string | null;
          target_lifespan?: number;
          avatar_url?: string | null;
          cover_url?: string | null;
          slug?: string | null;
          phone?: string | null;
          presentation?: string;
          is_public?: boolean;
          show_schedule?: boolean;
          show_projects?: boolean;
          show_achievements?: boolean;
          show_family?: boolean;
          meetings_enabled?: boolean;
          meeting_duration_min?: number;
          meeting_buffer_min?: number;
          meeting_max_per_day?: number;
          meeting_requires_approval?: boolean;
          meeting_requirements?: string;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      daily_logs: {
        Row: {
          id: string;
          user_id: string;
          log_date: string;
          planned_text: string;
          executed_text: string;
          summary_text: string;
          status: "OPEN" | "VALIDATING" | "LOCKED";
          locked_at: string | null;
          created_at: string;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          log_date: string;
          planned_text?: string;
          executed_text?: string;
          summary_text?: string;
          status?: "OPEN" | "VALIDATING" | "LOCKED";
          locked_at?: string | null;
          created_at?: string;
          updated_at?: string | null;
        };
        Update: {
          planned_text?: string;
          executed_text?: string;
          summary_text?: string;
          status?: "OPEN" | "VALIDATING" | "LOCKED";
          locked_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "daily_logs_user_id_fkey";
            columns: ["user_id"];
            isOneToOne?: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      weekly_focus: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          description: string;
          week_number: number;
          year: number;
          progress_pct: number;
          created_at: string;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          description?: string;
          week_number: number;
          year: number;
          progress_pct?: number;
          created_at?: string;
          updated_at?: string | null;
        };
        Update: {
          title?: string;
          description?: string;
          progress_pct?: number;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "weekly_focus_user_id_fkey";
            columns: ["user_id"];
            isOneToOne?: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      career_chapters: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          period: string;
          document_type:
            | "PROLOGUE"
            | "RESUME"
            | "EXPERIENCE"
            | "EDUCATION"
            | "CERTIFICATE"
            | "SKILL"
            | "LANGUAGE"
            | "PRODUCTION";
          content: string;
          created_at: string;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          period?: string;
          document_type?:
            | "PROLOGUE"
            | "RESUME"
            | "EXPERIENCE"
            | "EDUCATION"
            | "CERTIFICATE"
            | "SKILL"
            | "LANGUAGE"
            | "PRODUCTION";
          content?: string;
          created_at?: string;
          updated_at?: string | null;
        };
        Update: {
          title?: string;
          period?: string;
          document_type?:
            | "PROLOGUE"
            | "RESUME"
            | "EXPERIENCE"
            | "EDUCATION"
            | "CERTIFICATE"
            | "SKILL"
            | "LANGUAGE"
            | "PRODUCTION";
          content?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "career_chapters_user_id_fkey";
            columns: ["user_id"];
            isOneToOne?: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      projects: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string;
          status: "Em andamento" | "Pesquisa" | "Planejado" | "Concluído";
          progress: number;
          objective: string;
          period: string;
          activities: string;
          results: string;
          links: string;
          created_at: string;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          description?: string;
          status?: "Em andamento" | "Pesquisa" | "Planejado" | "Concluído";
          progress?: number;
          objective?: string;
          period?: string;
          activities?: string;
          results?: string;
          links?: string;
          created_at?: string;
          updated_at?: string | null;
        };
        Update: {
          name?: string;
          description?: string;
          status?: "Em andamento" | "Pesquisa" | "Planejado" | "Concluído";
          progress?: number;
          objective?: string;
          period?: string;
          activities?: string;
          results?: string;
          links?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "projects_user_id_fkey";
            columns: ["user_id"];
            isOneToOne?: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      milestones: {
        Row: {
          id: string;
          user_id: string;
          year: string;
          title: string;
          description: string;
          category: string;
          created_at: string;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          year: string;
          title: string;
          description?: string;
          category?: string;
          created_at?: string;
          updated_at?: string | null;
        };
        Update: {
          year?: string;
          title?: string;
          description?: string;
          category?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "milestones_user_id_fkey";
            columns: ["user_id"];
            isOneToOne?: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      time_capsules: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          content: string;
          unlock_at: string;
          opened_at: string | null;
          created_at: string;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          content: string;
          unlock_at: string;
          opened_at?: string | null;
          created_at?: string;
          updated_at?: string | null;
        };
        Update: {
          opened_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "time_capsules_user_id_fkey";
            columns: ["user_id"];
            isOneToOne?: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      recurring_commitments: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          category: string;
          start_time: string;
          end_time: string;
          weekdays: number[];
          note: string;
          is_active: boolean;
          created_at: string;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          category?: string;
          start_time: string;
          end_time: string;
          weekdays?: number[];
          note?: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string | null;
        };
        Update: {
          title?: string;
          category?: string;
          start_time?: string;
          end_time?: string;
          weekdays?: number[];
          note?: string;
          is_active?: boolean;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "recurring_commitments_user_id_fkey";
            columns: ["user_id"];
            isOneToOne?: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      commitment_exceptions: {
        Row: {
          id: string;
          user_id: string;
          commitment_id: string;
          exception_date: string;
          mode: "cancelled" | "edited";
          title: string;
          start_time: string;
          end_time: string;
          note: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          commitment_id: string;
          exception_date: string;
          mode: "cancelled" | "edited";
          title?: string;
          start_time?: string;
          end_time?: string;
          note?: string;
          created_at?: string;
        };
        Update: {
          mode?: "cancelled" | "edited";
          title?: string;
          start_time?: string;
          end_time?: string;
          note?: string;
        };
        Relationships: [
          {
            foreignKeyName: "commitment_exceptions_commitment_id_fkey";
            columns: ["commitment_id"];
            isOneToOne?: false;
            referencedRelation: "recurring_commitments";
            referencedColumns: ["id"];
          },
        ];
      };
      one_off_events: {
        Row: {
          id: string;
          user_id: string;
          event_date: string;
          start_time: string;
          end_time: string;
          title: string;
          note: string;
          source: "manual" | "meeting";
          meeting_request_id: string | null;
          created_at: string;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          event_date: string;
          start_time: string;
          end_time: string;
          title: string;
          note?: string;
          source?: "manual" | "meeting";
          meeting_request_id?: string | null;
          created_at?: string;
          updated_at?: string | null;
        };
        Update: {
          event_date?: string;
          start_time?: string;
          end_time?: string;
          title?: string;
          note?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "one_off_events_user_id_fkey";
            columns: ["user_id"];
            isOneToOne?: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      availability_rules: {
        Row: {
          id: string;
          user_id: string;
          weekday: number;
          is_available: boolean;
          start_time: string;
          end_time: string;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          weekday: number;
          is_available: boolean;
          start_time?: string;
          end_time?: string;
          updated_at?: string | null;
        };
        Update: {
          is_available?: boolean;
          start_time?: string;
          end_time?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "availability_rules_user_id_fkey";
            columns: ["user_id"];
            isOneToOne?: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      meeting_requests: {
        Row: {
          id: string;
          owner_id: string;
          event_date: string;
          start_time: string;
          end_time: string;
          requester_name: string;
          requester_contact: string;
          reason: string;
          status:
            "PENDING" | "ACCEPTED" | "DECLINED" | "CANCELLED" | "RESCHEDULED";
          counter_start_time: string | null;
          counter_end_time: string | null;
          counter_event_date: string | null;
          counter_note: string;
          created_at: string;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          owner_id: string;
          event_date: string;
          start_time: string;
          end_time: string;
          requester_name: string;
          requester_contact: string;
          reason?: string;
          status?:
            "PENDING" | "ACCEPTED" | "DECLINED" | "CANCELLED" | "RESCHEDULED";
          counter_start_time?: string | null;
          counter_end_time?: string | null;
          counter_event_date?: string | null;
          counter_note?: string;
          created_at?: string;
          updated_at?: string | null;
        };
        Update: {
          status?:
            "PENDING" | "ACCEPTED" | "DECLINED" | "CANCELLED" | "RESCHEDULED";
          counter_start_time?: string | null;
          counter_end_time?: string | null;
          counter_event_date?: string | null;
          counter_note?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "meeting_requests_owner_id_fkey";
            columns: ["owner_id"];
            isOneToOne?: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      family_members: {
        Row: {
          id: string;
          user_id: string;
          display_name: string;
          phone: string;
          relation:
            | "mae"
            | "pai"
            | "filho"
            | "filha"
            | "irmao"
            | "irma"
            | "avo"
            | "avo_f"
            | "tio"
            | "tia"
            | "primo"
            | "prima"
            | "conjuge"
            | "outro";
          member_user_id: string | null;
          invite_status: "PENDING" | "LINKED" | "DECLINED" | "REMOVED";
          privacy: "PUBLIC" | "FAMILY" | "PRIVATE";
          note: string;
          created_at: string;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          display_name: string;
          phone: string;
          relation?:
            | "mae"
            | "pai"
            | "filho"
            | "filha"
            | "irmao"
            | "irma"
            | "avo"
            | "avo_f"
            | "tio"
            | "tia"
            | "primo"
            | "prima"
            | "conjuge"
            | "outro";
          member_user_id?: string | null;
          invite_status?: "PENDING" | "LINKED" | "DECLINED" | "REMOVED";
          privacy?: "PUBLIC" | "FAMILY" | "PRIVATE";
          note?: string;
          created_at?: string;
          updated_at?: string | null;
        };
        Update: {
          display_name?: string;
          phone?: string;
          relation?:
            | "mae"
            | "pai"
            | "filho"
            | "filha"
            | "irmao"
            | "irma"
            | "avo"
            | "avo_f"
            | "tio"
            | "tia"
            | "primo"
            | "prima"
            | "conjuge"
            | "outro";
          member_user_id?: string | null;
          invite_status?: "PENDING" | "LINKED" | "DECLINED" | "REMOVED";
          privacy?: "PUBLIC" | "FAMILY" | "PRIVATE";
          note?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "family_members_user_id_fkey";
            columns: ["user_id"];
            isOneToOne?: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      v_daily_logs_recent: {
        Row: {
          id: string;
          user_id: string;
          log_date: string;
          planned_text: string;
          executed_text: string;
          summary_text: string;
          status: "OPEN" | "VALIDATING" | "LOCKED";
          locked_at: string | null;
          created_at: string;
        };
        Relationships: [];
      };
    };
    Functions: {
      upsert_prologue: {
        Args: { p_user_id: string; p_content: string };
        Returns: string;
      };
      health_check: { Args: Record<string, never>; Returns: boolean };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export const SINGLETON_USER_ID =
  "00000000-0000-0000-0000-000000000001" as const;
