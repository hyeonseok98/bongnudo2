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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      job_applications: {
        Row: {
          created_at: string
          id: string
          interview_order: number | null
          notes: string | null
          participant_id: string
          recruitment_id: string
          result: Database["public"]["Enums"]["job_application_result"]
          role_after_pass: string | null
          session_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          interview_order?: number | null
          notes?: string | null
          participant_id: string
          recruitment_id: string
          result?: Database["public"]["Enums"]["job_application_result"]
          role_after_pass?: string | null
          session_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          interview_order?: number | null
          notes?: string | null
          participant_id?: string
          recruitment_id?: string
          result?: Database["public"]["Enums"]["job_application_result"]
          role_after_pass?: string | null
          session_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "job_applications_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "season_participants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_applications_recruitment_id_fkey"
            columns: ["recruitment_id"]
            isOneToOne: false
            referencedRelation: "job_recruitments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_applications_session_recruitment_fkey"
            columns: ["session_id", "recruitment_id"]
            isOneToOne: false
            referencedRelation: "job_interview_sessions"
            referencedColumns: ["id", "recruitment_id"]
          },
        ]
      }
      job_interview_sessions: {
        Row: {
          created_at: string
          host_name: string | null
          host_streamer_id: string | null
          id: string
          interview_session_key: string
          notes: string | null
          recruitment_id: string
          round: number
          starts_at: string
        }
        Insert: {
          created_at?: string
          host_name?: string | null
          host_streamer_id?: string | null
          id?: string
          interview_session_key: string
          notes?: string | null
          recruitment_id: string
          round: number
          starts_at: string
        }
        Update: {
          created_at?: string
          host_name?: string | null
          host_streamer_id?: string | null
          id?: string
          interview_session_key?: string
          notes?: string | null
          recruitment_id?: string
          round?: number
          starts_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_interview_sessions_host_streamer_id_fkey"
            columns: ["host_streamer_id"]
            isOneToOne: false
            referencedRelation: "streamers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_interview_sessions_recruitment_id_fkey"
            columns: ["recruitment_id"]
            isOneToOne: false
            referencedRelation: "job_recruitments"
            referencedColumns: ["id"]
          },
        ]
      }
      job_recruitments: {
        Row: {
          closes_at: string | null
          created_at: string
          id: string
          job_id: string
          notes: string | null
          opens_at: string | null
          recruitment_key: string
          recruitment_type: string
          round: number
          season_id: number
          status: string
          target_organization_id: string | null
          title: string
        }
        Insert: {
          closes_at?: string | null
          created_at?: string
          id?: string
          job_id: string
          notes?: string | null
          opens_at?: string | null
          recruitment_key: string
          recruitment_type: string
          round: number
          season_id: number
          status: string
          target_organization_id?: string | null
          title: string
        }
        Update: {
          closes_at?: string | null
          created_at?: string
          id?: string
          job_id?: string
          notes?: string | null
          opens_at?: string | null
          recruitment_key?: string
          recruitment_type?: string
          round?: number
          season_id?: number
          status?: string
          target_organization_id?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_recruitments_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "public_jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_recruitments_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_recruitments_target_organization_same_season_fkey"
            columns: ["target_organization_id", "season_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id", "season_id"]
          },
        ]
      }
      organization_memberships: {
        Row: {
          created_at: string
          display_order: number
          id: string
          is_primary: boolean
          joined_at: string | null
          left_at: string | null
          organization_id: string
          participant_id: string
          role: string | null
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          is_primary?: boolean
          joined_at?: string | null
          left_at?: string | null
          organization_id: string
          participant_id: string
          role?: string | null
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          is_primary?: boolean
          joined_at?: string | null
          left_at?: string | null
          organization_id?: string
          participant_id?: string
          role?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organization_memberships_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_memberships_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "season_participants"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_role_histories: {
        Row: {
          created_at: string
          end_date: string | null
          id: string
          is_leader: boolean
          membership_id: string
          role: string | null
          start_date: string | null
        }
        Insert: {
          created_at?: string
          end_date?: string | null
          id?: string
          is_leader?: boolean
          membership_id: string
          role?: string | null
          start_date?: string | null
        }
        Update: {
          created_at?: string
          end_date?: string | null
          id?: string
          is_leader?: boolean
          membership_id?: string
          role?: string | null
          start_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organization_role_histories_membership_id_fkey"
            columns: ["membership_id"]
            isOneToOne: false
            referencedRelation: "organization_memberships"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          description: string | null
          id: string
          logo_image_key: string | null
          logo_image_source_url: string | null
          name: string
          parent_id: string | null
          season_id: number
          slug: string
          type: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          logo_image_key?: string | null
          logo_image_source_url?: string | null
          name: string
          parent_id?: string | null
          season_id: number
          slug: string
          type: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          logo_image_key?: string | null
          logo_image_source_url?: string | null
          name?: string
          parent_id?: string | null
          season_id?: number
          slug?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "organizations_parent_same_season_fkey"
            columns: ["parent_id", "season_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id", "season_id"]
          },
          {
            foreignKeyName: "organizations_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
        ]
      }
      participant_recruitments: {
        Row: {
          announced_at: string | null
          closes_at: string | null
          created_at: string
          id: string
          opens_at: string | null
          round: number
          season_id: number
          title: string
        }
        Insert: {
          announced_at?: string | null
          closes_at?: string | null
          created_at?: string
          id?: string
          opens_at?: string | null
          round: number
          season_id: number
          title: string
        }
        Update: {
          announced_at?: string | null
          closes_at?: string | null
          created_at?: string
          id?: string
          opens_at?: string | null
          round?: number
          season_id?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "participant_recruitments_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
        ]
      }
      public_jobs: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      season_participants: {
        Row: {
          admission_recruitment_id: string | null
          bio: string | null
          created_at: string
          id: string
          portrait_image_key: string | null
          portrait_image_source_url: string | null
          rp_name: string | null
          season_id: number
          streamer_id: string
        }
        Insert: {
          admission_recruitment_id?: string | null
          bio?: string | null
          created_at?: string
          id?: string
          portrait_image_key?: string | null
          portrait_image_source_url?: string | null
          rp_name?: string | null
          season_id: number
          streamer_id: string
        }
        Update: {
          admission_recruitment_id?: string | null
          bio?: string | null
          created_at?: string
          id?: string
          portrait_image_key?: string | null
          portrait_image_source_url?: string | null
          rp_name?: string | null
          season_id?: number
          streamer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "season_participants_admission_same_season_fkey"
            columns: ["admission_recruitment_id", "season_id"]
            isOneToOne: false
            referencedRelation: "participant_recruitments"
            referencedColumns: ["id", "season_id"]
          },
          {
            foreignKeyName: "season_participants_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "season_participants_streamer_id_fkey"
            columns: ["streamer_id"]
            isOneToOne: false
            referencedRelation: "streamers"
            referencedColumns: ["id"]
          },
        ]
      }
      seasons: {
        Row: {
          created_at: string
          end_date: string | null
          id: number
          is_active: boolean
          name: string
          slug: string
          start_date: string | null
        }
        Insert: {
          created_at?: string
          end_date?: string | null
          id: number
          is_active?: boolean
          name: string
          slug: string
          start_date?: string | null
        }
        Update: {
          created_at?: string
          end_date?: string | null
          id?: number
          is_active?: boolean
          name?: string
          slug?: string
          start_date?: string | null
        }
        Relationships: []
      }
      streamer_affiliation_memberships: {
        Row: {
          affiliation_id: string
          created_at: string
          id: string
          sort_order: number
          streamer_id: string
        }
        Insert: {
          affiliation_id: string
          created_at?: string
          id?: string
          sort_order: number
          streamer_id: string
        }
        Update: {
          affiliation_id?: string
          created_at?: string
          id?: string
          sort_order?: number
          streamer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "streamer_affiliation_memberships_affiliation_id_fkey"
            columns: ["affiliation_id"]
            isOneToOne: false
            referencedRelation: "streamer_affiliations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "streamer_affiliation_memberships_streamer_id_fkey"
            columns: ["streamer_id"]
            isOneToOne: false
            referencedRelation: "streamers"
            referencedColumns: ["id"]
          },
        ]
      }
      streamer_affiliations: {
        Row: {
          created_at: string
          id: string
          name: string
          slug: string
          type: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          slug: string
          type: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          slug?: string
          type?: string
        }
        Relationships: []
      }
      streamer_groups: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      streamers: {
        Row: {
          chzzk_channel_id: string | null
          created_at: string
          group_id: string | null
          id: string
          name: string
          profile_image_key: string | null
          profile_image_source_url: string | null
          slug: string
        }
        Insert: {
          chzzk_channel_id?: string | null
          created_at?: string
          group_id?: string | null
          id?: string
          name: string
          profile_image_key?: string | null
          profile_image_source_url?: string | null
          slug: string
        }
        Update: {
          chzzk_channel_id?: string | null
          created_at?: string
          group_id?: string | null
          id?: string
          name?: string
          profile_image_key?: string | null
          profile_image_source_url?: string | null
          slug?: string
        }
        Relationships: [
          {
            foreignKeyName: "streamers_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "streamer_groups"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      job_application_result:
        | "pending"
        | "passed"
        | "failed"
        | "withdrawn"
        | "no_show"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      job_application_result: [
        "pending",
        "passed",
        "failed",
        "withdrawn",
        "no_show",
      ],
    },
  },
} as const
