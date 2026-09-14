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
      live_current: {
        Row: {
          live_id: number
          live_started_at: string | null
          live_title: string
          refreshed_at: string
          season_participant_id: string
          thumbnail_url: string
          viewer_count: number
        }
        Insert: {
          live_id: number
          live_started_at?: string | null
          live_title: string
          refreshed_at: string
          season_participant_id: string
          thumbnail_url: string
          viewer_count: number
        }
        Update: {
          live_id?: number
          live_started_at?: string | null
          live_title?: string
          refreshed_at?: string
          season_participant_id?: string
          thumbnail_url?: string
          viewer_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "live_current_season_participant_id_fkey"
            columns: ["season_participant_id"]
            isOneToOne: true
            referencedRelation: "season_participants"
            referencedColumns: ["id"]
          },
        ]
      }
      live_refresh_state: {
        Row: {
          lock_expires_at: string | null
          lock_owner: string | null
          refreshed_at: string | null
          singleton: boolean
        }
        Insert: {
          lock_expires_at?: string | null
          lock_owner?: string | null
          refreshed_at?: string | null
          singleton?: boolean
        }
        Update: {
          lock_expires_at?: string | null
          lock_owner?: string | null
          refreshed_at?: string | null
          singleton?: boolean
        }
        Relationships: []
      }
      live_viewer_snapshots: {
        Row: {
          id: string
          sampled_at: string
          season_participant_id: string
          viewer_count: number
        }
        Insert: {
          id?: string
          sampled_at: string
          season_participant_id: string
          viewer_count: number
        }
        Update: {
          id?: string
          sampled_at?: string
          season_participant_id?: string
          viewer_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "live_viewer_snapshots_season_participant_id_fkey"
            columns: ["season_participant_id"]
            isOneToOne: false
            referencedRelation: "season_participants"
            referencedColumns: ["id"]
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
      report_categories: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
          report_type: string
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          report_type: string
          slug: string
          sort_order: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          report_type?: string
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      report_media: {
        Row: {
          byte_size: number | null
          clip_url: string | null
          created_at: string
          id: string
          media_type: string
          mime_type: string | null
          object_key: string | null
          report_id: string
          sort_order: number
        }
        Insert: {
          byte_size?: number | null
          clip_url?: string | null
          created_at?: string
          id?: string
          media_type: string
          mime_type?: string | null
          object_key?: string | null
          report_id: string
          sort_order: number
        }
        Update: {
          byte_size?: number | null
          clip_url?: string | null
          created_at?: string
          id?: string
          media_type?: string
          mime_type?: string | null
          object_key?: string | null
          report_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "report_media_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "reports"
            referencedColumns: ["id"]
          },
        ]
      }
      report_participants: {
        Row: {
          created_at: string
          is_primary: boolean
          report_id: string
          season_id: number
          season_participant_id: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          is_primary?: boolean
          report_id: string
          season_id: number
          season_participant_id: string
          sort_order: number
        }
        Update: {
          created_at?: string
          is_primary?: boolean
          report_id?: string
          season_id?: number
          season_participant_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "report_participants_participant_same_season_fkey"
            columns: ["season_participant_id", "season_id"]
            isOneToOne: false
            referencedRelation: "season_participants"
            referencedColumns: ["id", "season_id"]
          },
          {
            foreignKeyName: "report_participants_report_same_season_fkey"
            columns: ["report_id", "season_id"]
            isOneToOne: false
            referencedRelation: "reports"
            referencedColumns: ["id", "season_id"]
          },
        ]
      }
      report_tags: {
        Row: {
          created_at: string
          report_id: string
          sort_order: number
          tag_id: string
        }
        Insert: {
          created_at?: string
          report_id: string
          sort_order: number
          tag_id: string
        }
        Update: {
          created_at?: string
          report_id?: string
          sort_order?: number
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "report_tags_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "reports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "report_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "timeline_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      report_user_restrictions: {
        Row: {
          can_submit: boolean
          created_at: string
          created_by_user_id: string
          reason: string
          suspended_until: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          can_submit?: boolean
          created_at?: string
          created_by_user_id: string
          reason: string
          suspended_until?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          can_submit?: boolean
          created_at?: string
          created_by_user_id?: string
          reason?: string
          suspended_until?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "report_user_restrictions_created_by_user_id_fkey"
            columns: ["created_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "report_user_restrictions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          category_id: string | null
          content: string
          created_at: string
          id: string
          occurred_at: string | null
          report_type: string
          reporter_user_id: string
          season_id: number | null
          status: string
          timeline_event_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          category_id?: string | null
          content: string
          created_at?: string
          id?: string
          occurred_at?: string | null
          report_type: string
          reporter_user_id: string
          season_id?: number | null
          status?: string
          timeline_event_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          category_id?: string | null
          content?: string
          created_at?: string
          id?: string
          occurred_at?: string | null
          report_type?: string
          reporter_user_id?: string
          season_id?: number | null
          status?: string
          timeline_event_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reports_category_scope_fkey"
            columns: ["category_id", "report_type"]
            isOneToOne: false
            referencedRelation: "report_categories"
            referencedColumns: ["id", "report_type"]
          },
          {
            foreignKeyName: "reports_reporter_user_id_fkey"
            columns: ["reporter_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_timeline_event_same_season_fkey"
            columns: ["timeline_event_id", "season_id"]
            isOneToOne: false
            referencedRelation: "timeline_events"
            referencedColumns: ["id", "season_id"]
          },
        ]
      }
      season_participants: {
        Row: {
          admission_recruitment_id: string | null
          bio: string | null
          created_at: string
          full_body_image_key: string | null
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
          full_body_image_key?: string | null
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
          full_body_image_key?: string | null
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
          filter_order: number | null
          id: string
          is_filter_visible: boolean
          is_quick_filter: boolean
          name: string
          parent_affiliation_id: string | null
          quick_filter_label: string | null
          slug: string
          type: string
        }
        Insert: {
          created_at?: string
          filter_order?: number | null
          id?: string
          is_filter_visible?: boolean
          is_quick_filter?: boolean
          name: string
          parent_affiliation_id?: string | null
          quick_filter_label?: string | null
          slug: string
          type: string
        }
        Update: {
          created_at?: string
          filter_order?: number | null
          id?: string
          is_filter_visible?: boolean
          is_quick_filter?: boolean
          name?: string
          parent_affiliation_id?: string | null
          quick_filter_label?: string | null
          slug?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "streamer_affiliations_parent_affiliation_id_fkey"
            columns: ["parent_affiliation_id"]
            isOneToOne: false
            referencedRelation: "streamer_affiliations"
            referencedColumns: ["id"]
          },
        ]
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
      timeline_event_media: {
        Row: {
          byte_size: number | null
          clip_url: string | null
          created_at: string
          id: string
          media_type: string
          mime_type: string | null
          object_key: string | null
          sort_order: number
          timeline_event_id: string
        }
        Insert: {
          byte_size?: number | null
          clip_url?: string | null
          created_at?: string
          id?: string
          media_type: string
          mime_type?: string | null
          object_key?: string | null
          sort_order: number
          timeline_event_id: string
        }
        Update: {
          byte_size?: number | null
          clip_url?: string | null
          created_at?: string
          id?: string
          media_type?: string
          mime_type?: string | null
          object_key?: string | null
          sort_order?: number
          timeline_event_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "timeline_event_media_timeline_event_id_fkey"
            columns: ["timeline_event_id"]
            isOneToOne: false
            referencedRelation: "timeline_events"
            referencedColumns: ["id"]
          },
        ]
      }
      timeline_event_participants: {
        Row: {
          created_at: string
          is_primary: boolean
          season_id: number
          season_participant_id: string
          sort_order: number
          timeline_event_id: string
        }
        Insert: {
          created_at?: string
          is_primary?: boolean
          season_id: number
          season_participant_id: string
          sort_order: number
          timeline_event_id: string
        }
        Update: {
          created_at?: string
          is_primary?: boolean
          season_id?: number
          season_participant_id?: string
          sort_order?: number
          timeline_event_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "timeline_event_participants_event_same_season_fkey"
            columns: ["timeline_event_id", "season_id"]
            isOneToOne: false
            referencedRelation: "timeline_events"
            referencedColumns: ["id", "season_id"]
          },
          {
            foreignKeyName: "timeline_event_participants_participant_same_season_fkey"
            columns: ["season_participant_id", "season_id"]
            isOneToOne: false
            referencedRelation: "season_participants"
            referencedColumns: ["id", "season_id"]
          },
        ]
      }
      timeline_event_revisions: {
        Row: {
          after_data: Json
          before_data: Json
          created_at: string
          editor_user_id: string
          id: string
          reason: string | null
          timeline_event_id: string
        }
        Insert: {
          after_data: Json
          before_data: Json
          created_at?: string
          editor_user_id: string
          id?: string
          reason?: string | null
          timeline_event_id: string
        }
        Update: {
          after_data?: Json
          before_data?: Json
          created_at?: string
          editor_user_id?: string
          id?: string
          reason?: string | null
          timeline_event_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "timeline_event_revisions_editor_user_id_fkey"
            columns: ["editor_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timeline_event_revisions_timeline_event_id_fkey"
            columns: ["timeline_event_id"]
            isOneToOne: false
            referencedRelation: "timeline_events"
            referencedColumns: ["id"]
          },
        ]
      }
      timeline_event_tags: {
        Row: {
          created_at: string
          sort_order: number
          tag_id: string
          timeline_event_id: string
        }
        Insert: {
          created_at?: string
          sort_order: number
          tag_id: string
          timeline_event_id: string
        }
        Update: {
          created_at?: string
          sort_order?: number
          tag_id?: string
          timeline_event_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "timeline_event_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "timeline_tags"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timeline_event_tags_timeline_event_id_fkey"
            columns: ["timeline_event_id"]
            isOneToOne: false
            referencedRelation: "timeline_events"
            referencedColumns: ["id"]
          },
        ]
      }
      timeline_events: {
        Row: {
          category_id: string
          content: string
          created_at: string
          id: string
          merged_into_event_id: string | null
          occurred_at: string
          publication_status: string
          season_id: number
          title: string
          updated_at: string
        }
        Insert: {
          category_id: string
          content: string
          created_at?: string
          id?: string
          merged_into_event_id?: string | null
          occurred_at: string
          publication_status?: string
          season_id: number
          title: string
          updated_at?: string
        }
        Update: {
          category_id?: string
          content?: string
          created_at?: string
          id?: string
          merged_into_event_id?: string | null
          occurred_at?: string
          publication_status?: string
          season_id?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "timeline_events_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "report_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timeline_events_merged_into_same_season_fkey"
            columns: ["merged_into_event_id", "season_id"]
            isOneToOne: false
            referencedRelation: "timeline_events"
            referencedColumns: ["id", "season_id"]
          },
          {
            foreignKeyName: "timeline_events_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
        ]
      }
      timeline_tags: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_sessions: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          token_hash: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at: string
          id?: string
          token_hash: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          token_hash?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          chzzk_channel_id: string
          chzzk_channel_name: string
          created_at: string
          id: string
          last_login_at: string
          role: string
          status: string
          updated_at: string
        }
        Insert: {
          chzzk_channel_id: string
          chzzk_channel_name: string
          created_at?: string
          id?: string
          last_login_at?: string
          role?: string
          status?: string
          updated_at?: string
        }
        Update: {
          chzzk_channel_id?: string
          chzzk_channel_name?: string
          created_at?: string
          id?: string
          last_login_at?: string
          role?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      live_viewer_snapshots_view: {
        Row: {
          id: string | null
          rp_name: string | null
          sampled_at: string | null
          season_participant_id: string | null
          streamer_name: string | null
          viewer_count: number | null
        }
        Relationships: [
          {
            foreignKeyName: "live_viewer_snapshots_season_participant_id_fkey"
            columns: ["season_participant_id"]
            isOneToOne: false
            referencedRelation: "season_participants"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      create_report:
        | {
            Args: { p_payload: Json }
            Returns: {
              created_report_id: string
              created_timeline_event_id: string
            }[]
          }
        | {
            Args: {
              p_category_id: string
              p_clip_urls: string[]
              p_content: string
              p_images: Json
              p_occurred_at: string
              p_participant_ids: string[]
              p_report_id: string
              p_report_type: string
              p_reporter_user_id: string
              p_season_id: number
              p_tag_ids: string[]
              p_timeline_event_id: string
              p_title: string
            }
            Returns: {
              created_report_id: string
              created_timeline_event_id: string
            }[]
          }
      get_timeline_page: { Args: { p_filters: Json }; Returns: Json }
      release_live_refresh: { Args: { p_run_id: string }; Returns: undefined }
      replace_live_current: {
        Args: { p_live_streams: Json; p_refreshed_at: string; p_run_id: string }
        Returns: number
      }
      search_report_participants: {
        Args: { p_limit?: number; p_query: string }
        Returns: {
          organization_name: string
          role: string
          rp_name: string
          season_participant_id: string
          streamer_name: string
        }[]
      }
      try_acquire_live_refresh: {
        Args: { p_lease_seconds?: number; p_run_id: string }
        Returns: boolean
      }
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
