import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database, Json } from "@/lib/supabase/database.types";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

interface LiveCurrentTable {
  Row: {
    live_id: number;
    live_started_at: string | null;
    live_title: string;
    refreshed_at: string;
    season_participant_id: string;
    thumbnail_url: string;
    viewer_count: number;
  };
  Insert: {
    live_id: number;
    live_started_at?: string | null;
    live_title: string;
    refreshed_at: string;
    season_participant_id: string;
    thumbnail_url: string;
    viewer_count: number;
  };
  Update: {
    live_id?: number;
    live_started_at?: string | null;
    live_title?: string;
    refreshed_at?: string;
    season_participant_id?: string;
    thumbnail_url?: string;
    viewer_count?: number;
  };
  Relationships: [
    {
      foreignKeyName: "live_current_season_participant_id_fkey";
      columns: ["season_participant_id"];
      isOneToOne: true;
      referencedRelation: "season_participants";
      referencedColumns: ["id"];
    },
  ];
}

interface LiveRefreshStateTable {
  Row: {
    lock_expires_at: string | null;
    lock_owner: string | null;
    refreshed_at: string | null;
    singleton: boolean;
  };
  Insert: {
    lock_expires_at?: string | null;
    lock_owner?: string | null;
    refreshed_at?: string | null;
    singleton?: boolean;
  };
  Update: {
    lock_expires_at?: string | null;
    lock_owner?: string | null;
    refreshed_at?: string | null;
    singleton?: boolean;
  };
  Relationships: [];
}

type LiveDatabase = Omit<Database, "public"> & {
  public: Omit<Database["public"], "Functions" | "Tables"> & {
    Tables: Database["public"]["Tables"] & {
      live_current: LiveCurrentTable;
      live_refresh_state: LiveRefreshStateTable;
    };
    Functions: Database["public"]["Functions"] & {
      release_live_refresh: {
        Args: { p_run_id: string };
        Returns: undefined;
      };
      replace_live_current: {
        Args: {
          p_live_streams: Json;
          p_refreshed_at: string;
          p_run_id: string;
        };
        Returns: number;
      };
      try_acquire_live_refresh: {
        Args: { p_lease_seconds?: number; p_run_id: string };
        Returns: boolean;
      };
    };
  };
};

export function getLiveDatabaseClient(): SupabaseClient<LiveDatabase> {
  return getSupabaseAdminClient() as unknown as SupabaseClient<LiveDatabase>;
}
