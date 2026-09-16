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
      archive_chapters: {
        Row: {
          archive_id: string
          created_at: string
          description: string | null
          id: string
          season_day_id: string | null
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          archive_id: string
          created_at?: string
          description?: string | null
          id?: string
          season_day_id?: string | null
          sort_order: number
          title: string
          updated_at?: string
        }
        Update: {
          archive_id?: string
          created_at?: string
          description?: string | null
          id?: string
          season_day_id?: string | null
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "archive_chapters_archive_id_fkey"
            columns: ["archive_id"]
            isOneToOne: false
            referencedRelation: "archives"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "archive_chapters_season_day_id_fkey"
            columns: ["season_day_id"]
            isOneToOne: false
            referencedRelation: "season_days"
            referencedColumns: ["id"]
          },
        ]
      }
      archive_items: {
        Row: {
          archive_id: string
          chapter_id: string
          clip_id: string
          created_at: string
          id: string
          note: string | null
          sort_order: number
          updated_at: string
        }
        Insert: {
          archive_id: string
          chapter_id: string
          clip_id: string
          created_at?: string
          id?: string
          note?: string | null
          sort_order: number
          updated_at?: string
        }
        Update: {
          archive_id?: string
          chapter_id?: string
          clip_id?: string
          created_at?: string
          id?: string
          note?: string | null
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "archive_items_archive_chapter_fkey"
            columns: ["archive_id", "chapter_id"]
            isOneToOne: false
            referencedRelation: "archive_chapters"
            referencedColumns: ["archive_id", "id"]
          },
          {
            foreignKeyName: "archive_items_clip_id_fkey"
            columns: ["clip_id"]
            isOneToOne: false
            referencedRelation: "clips"
            referencedColumns: ["id"]
          },
        ]
      }
      archive_revisions: {
        Row: {
          archive_id: string
          created_at: string
          created_by: string
          id: string
          revision_number: number
          snapshot: Json
        }
        Insert: {
          archive_id: string
          created_at?: string
          created_by: string
          id?: string
          revision_number: number
          snapshot: Json
        }
        Update: {
          archive_id?: string
          created_at?: string
          created_by?: string
          id?: string
          revision_number?: number
          snapshot?: Json
        }
        Relationships: [
          {
            foreignKeyName: "archive_revisions_archive_id_fkey"
            columns: ["archive_id"]
            isOneToOne: false
            referencedRelation: "archives"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "archive_revisions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      archives: {
        Row: {
          archive_kind: string
          category: string
          created_at: string
          current_revision: number | null
          deleted_at: string | null
          description: string | null
          edit_policy: string
          id: string
          owner_id: string | null
          published_at: string | null
          season_id: number
          status: string
          structure_mode: string | null
          system_participant_id: string | null
          title: string
          updated_at: string
          visibility: string
        }
        Insert: {
          archive_kind?: string
          category: string
          created_at?: string
          current_revision?: number | null
          deleted_at?: string | null
          description?: string | null
          edit_policy?: string
          id?: string
          owner_id?: string | null
          published_at?: string | null
          season_id: number
          status?: string
          structure_mode?: string | null
          system_participant_id?: string | null
          title: string
          updated_at?: string
          visibility?: string
        }
        Update: {
          archive_kind?: string
          category?: string
          created_at?: string
          current_revision?: number | null
          deleted_at?: string | null
          description?: string | null
          edit_policy?: string
          id?: string
          owner_id?: string | null
          published_at?: string | null
          season_id?: number
          status?: string
          structure_mode?: string | null
          system_participant_id?: string | null
          title?: string
          updated_at?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "archives_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "archives_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "archives_system_participant_same_season_fkey"
            columns: ["system_participant_id", "season_id"]
            isOneToOne: false
            referencedRelation: "season_participants"
            referencedColumns: ["id", "season_id"]
          },
        ]
      }
      character_career_events: {
        Row: {
          created_at: string
          event_at: string | null
          event_date: string
          event_type: string
          from_organization_id: string | null
          from_role: string | null
          id: string
          note: string | null
          participant_id: string
          season_day_id: string | null
          season_id: number
          sequence_in_day: number
          source_url: string | null
          to_organization_id: string | null
          to_role: string | null
        }
        Insert: {
          created_at?: string
          event_at?: string | null
          event_date: string
          event_type: string
          from_organization_id?: string | null
          from_role?: string | null
          id?: string
          note?: string | null
          participant_id: string
          season_day_id?: string | null
          season_id: number
          sequence_in_day: number
          source_url?: string | null
          to_organization_id?: string | null
          to_role?: string | null
        }
        Update: {
          created_at?: string
          event_at?: string | null
          event_date?: string
          event_type?: string
          from_organization_id?: string | null
          from_role?: string | null
          id?: string
          note?: string | null
          participant_id?: string
          season_day_id?: string | null
          season_id?: number
          sequence_in_day?: number
          source_url?: string | null
          to_organization_id?: string | null
          to_role?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "character_career_events_from_organization_same_season_fkey"
            columns: ["from_organization_id", "season_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id", "season_id"]
          },
          {
            foreignKeyName: "character_career_events_participant_same_season_fkey"
            columns: ["participant_id", "season_id"]
            isOneToOne: false
            referencedRelation: "season_participants"
            referencedColumns: ["id", "season_id"]
          },
          {
            foreignKeyName: "character_career_events_season_day_same_season_fkey"
            columns: ["season_day_id", "season_id"]
            isOneToOne: false
            referencedRelation: "season_days"
            referencedColumns: ["id", "season_id"]
          },
          {
            foreignKeyName: "character_career_events_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "character_career_events_to_organization_same_season_fkey"
            columns: ["to_organization_id", "season_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id", "season_id"]
          },
        ]
      }
      clips: {
        Row: {
          clip_created_at: string
          clip_url: string
          collected_at: string
          created_at: string
          duration_seconds: number | null
          id: string
          provider: string
          provider_clip_id: string
          provider_video_id: string | null
          season_day_id: string | null
          season_id: number
          season_participant_id: string | null
          streamer_id: string
          thumbnail_url: string | null
          title: string
          updated_at: string
          view_count: number | null
        }
        Insert: {
          clip_created_at: string
          clip_url: string
          collected_at: string
          created_at?: string
          duration_seconds?: number | null
          id?: string
          provider?: string
          provider_clip_id: string
          provider_video_id?: string | null
          season_day_id?: string | null
          season_id: number
          season_participant_id?: string | null
          streamer_id: string
          thumbnail_url?: string | null
          title: string
          updated_at?: string
          view_count?: number | null
        }
        Update: {
          clip_created_at?: string
          clip_url?: string
          collected_at?: string
          created_at?: string
          duration_seconds?: number | null
          id?: string
          provider?: string
          provider_clip_id?: string
          provider_video_id?: string | null
          season_day_id?: string | null
          season_id?: number
          season_participant_id?: string | null
          streamer_id?: string
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "clips_participant_same_season_fkey"
            columns: ["season_participant_id", "season_id"]
            isOneToOne: false
            referencedRelation: "season_participants"
            referencedColumns: ["id", "season_id"]
          },
          {
            foreignKeyName: "clips_season_day_same_season_fkey"
            columns: ["season_day_id", "season_id"]
            isOneToOne: false
            referencedRelation: "season_days"
            referencedColumns: ["id", "season_id"]
          },
          {
            foreignKeyName: "clips_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clips_streamer_id_fkey"
            columns: ["streamer_id"]
            isOneToOne: false
            referencedRelation: "streamers"
            referencedColumns: ["id"]
          },
        ]
      }
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
      replays: {
        Row: {
          collected_at: string
          created_at: string
          duration_seconds: number | null
          id: string
          live_started_at: string | null
          provider: string
          provider_video_id: string
          provider_video_no: number | null
          published_at: string | null
          replay_url: string
          season_day_id: string | null
          season_id: number
          season_participant_id: string | null
          sort_at: string | null
          streamer_id: string
          thumbnail_url: string | null
          title: string
          updated_at: string
          view_count: number | null
        }
        Insert: {
          collected_at: string
          created_at?: string
          duration_seconds?: number | null
          id?: string
          live_started_at?: string | null
          provider?: string
          provider_video_id: string
          provider_video_no?: number | null
          published_at?: string | null
          replay_url: string
          season_day_id?: string | null
          season_id: number
          season_participant_id?: string | null
          sort_at?: string | null
          streamer_id: string
          thumbnail_url?: string | null
          title: string
          updated_at?: string
          view_count?: number | null
        }
        Update: {
          collected_at?: string
          created_at?: string
          duration_seconds?: number | null
          id?: string
          live_started_at?: string | null
          provider?: string
          provider_video_id?: string
          provider_video_no?: number | null
          published_at?: string | null
          replay_url?: string
          season_day_id?: string | null
          season_id?: number
          season_participant_id?: string | null
          sort_at?: string | null
          streamer_id?: string
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "replays_participant_same_season_fkey"
            columns: ["season_participant_id", "season_id"]
            isOneToOne: false
            referencedRelation: "season_participants"
            referencedColumns: ["id", "season_id"]
          },
          {
            foreignKeyName: "replays_season_day_same_season_fkey"
            columns: ["season_day_id", "season_id"]
            isOneToOne: false
            referencedRelation: "season_days"
            referencedColumns: ["id", "season_id"]
          },
          {
            foreignKeyName: "replays_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "replays_streamer_id_fkey"
            columns: ["streamer_id"]
            isOneToOne: false
            referencedRelation: "streamers"
            referencedColumns: ["id"]
          },
        ]
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
      season_days: {
        Row: {
          created_at: string
          day_number: number
          ends_at: string
          id: string
          season_id: number
          session_date: string
          starts_at: string
        }
        Insert: {
          created_at?: string
          day_number: number
          ends_at: string
          id?: string
          season_id: number
          session_date: string
          starts_at: string
        }
        Update: {
          created_at?: string
          day_number?: number
          ends_at?: string
          id?: string
          season_id?: number
          session_date?: string
          starts_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "season_days_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
        ]
      }
      season_participants: {
        Row: {
          admission_recruitment_id: string | null
          bio: string | null
          birth_date: string | null
          created_at: string
          full_body_image_key: string | null
          id: string
          portrait_image_key: string | null
          portrait_image_source_url: string | null
          rp_name: string | null
          season_id: number
          stated_age: number | null
          streamer_id: string
        }
        Insert: {
          admission_recruitment_id?: string | null
          bio?: string | null
          birth_date?: string | null
          created_at?: string
          full_body_image_key?: string | null
          id?: string
          portrait_image_key?: string | null
          portrait_image_source_url?: string | null
          rp_name?: string | null
          season_id: number
          stated_age?: number | null
          streamer_id: string
        }
        Update: {
          admission_recruitment_id?: string | null
          bio?: string | null
          birth_date?: string | null
          created_at?: string
          full_body_image_key?: string | null
          id?: string
          portrait_image_key?: string | null
          portrait_image_source_url?: string | null
          rp_name?: string | null
          season_id?: number
          stated_age?: number | null
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
      create_archive: {
        Args: {
          p_actor_user_id: string
          p_content: Json
          p_metadata: Json
          p_season_id: number
        }
        Returns: {
          archive_id: string
          current_revision: number
          snapshot: Json
        }[]
      }
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
      restore_archive: {
        Args: { p_actor_user_id: string; p_archive_id: string }
        Returns: undefined
      }
      restore_archive_revision: {
        Args: {
          p_actor_user_id: string
          p_archive_id: string
          p_base_revision: number
          p_revision_number: number
        }
        Returns: {
          archive_id: string
          current_revision: number
          snapshot: Json
        }[]
      }
      save_archive: {
        Args: {
          p_actor_user_id: string
          p_archive_id: string
          p_base_revision: number
          p_content: Json
          p_metadata?: Json
        }
        Returns: {
          archive_id: string
          current_revision: number
          snapshot: Json
        }[]
      }
      save_archive_content: {
        Args: {
          p_actor_user_id: string
          p_archive_id: string
          p_base_revision: number
          p_content: Json
        }
        Returns: {
          archive_id: string
          current_revision: number
          snapshot: Json
        }[]
      }
      search_report_participants: {
        Args: { p_limit?: number; p_query: string }
        Returns: {
          organization_name: string
          profile_image_key: string
          role: string
          rp_name: string
          season_participant_id: string
          streamer_name: string
        }[]
      }
      soft_delete_archive: {
        Args: { p_actor_user_id: string; p_archive_id: string }
        Returns: undefined
      }
      try_acquire_live_refresh: {
        Args: { p_lease_seconds?: number; p_run_id: string }
        Returns: boolean
      }
      update_archive_metadata: {
        Args: {
          p_actor_user_id: string
          p_archive_id: string
          p_base_revision: number
          p_metadata: Json
        }
        Returns: {
          archive_id: string
          current_revision: number
          snapshot: Json
        }[]
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
