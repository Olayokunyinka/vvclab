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
      admin_activity_log: {
        Row: {
          action: string
          admin_user_id: string | null
          created_at: string
          details: Json
          id: string
          target_user_id: string | null
        }
        Insert: {
          action: string
          admin_user_id?: string | null
          created_at?: string
          details?: Json
          id?: string
          target_user_id?: string | null
        }
        Update: {
          action?: string
          admin_user_id?: string | null
          created_at?: string
          details?: Json
          id?: string
          target_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_activity_log_admin_user_id_fkey"
            columns: ["admin_user_id"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_users: {
        Row: {
          created_at: string
          email: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_call_log: {
        Row: {
          cached_tokens: number | null
          call_type: string
          completion_tokens: number | null
          created_at: string
          duration_ms: number | null
          error_message: string | null
          finish_reason: string | null
          id: string
          is_byok: boolean | null
          model: string | null
          model_used: string | null
          prompt_tokens: number | null
          provider: string | null
          reasoning_tokens: number | null
          response_id: string | null
          status: string
          tokens_used: number
          total_tokens: number | null
          upstream_completion_cost_usd: number | null
          upstream_cost_usd: number | null
          upstream_prompt_cost_usd: number | null
          user_id: string | null
        }
        Insert: {
          cached_tokens?: number | null
          call_type: string
          completion_tokens?: number | null
          created_at?: string
          duration_ms?: number | null
          error_message?: string | null
          finish_reason?: string | null
          id?: string
          is_byok?: boolean | null
          model?: string | null
          model_used?: string | null
          prompt_tokens?: number | null
          provider?: string | null
          reasoning_tokens?: number | null
          response_id?: string | null
          status: string
          tokens_used?: number
          total_tokens?: number | null
          upstream_completion_cost_usd?: number | null
          upstream_cost_usd?: number | null
          upstream_prompt_cost_usd?: number | null
          user_id?: string | null
        }
        Update: {
          cached_tokens?: number | null
          call_type?: string
          completion_tokens?: number | null
          created_at?: string
          duration_ms?: number | null
          error_message?: string | null
          finish_reason?: string | null
          id?: string
          is_byok?: boolean | null
          model?: string | null
          model_used?: string | null
          prompt_tokens?: number | null
          provider?: string | null
          reasoning_tokens?: number | null
          response_id?: string | null
          status?: string
          tokens_used?: number
          total_tokens?: number | null
          upstream_completion_cost_usd?: number | null
          upstream_cost_usd?: number | null
          upstream_prompt_cost_usd?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      briefs: {
        Row: {
          content: Json
          created_at: string
          id: string
          user_id: string
          video_uuid: string
        }
        Insert: {
          content: Json
          created_at?: string
          id?: string
          user_id: string
          video_uuid: string
        }
        Update: {
          content?: Json
          created_at?: string
          id?: string
          user_id?: string
          video_uuid?: string
        }
        Relationships: [
          {
            foreignKeyName: "briefs_video_uuid_fkey"
            columns: ["video_uuid"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      channels: {
        Row: {
          channel_id: string
          created_at: string
          id: string
          subscriber_count: number | null
          thumbnail_url: string | null
          title: string
          uploads_playlist_id: string | null
        }
        Insert: {
          channel_id: string
          created_at?: string
          id?: string
          subscriber_count?: number | null
          thumbnail_url?: string | null
          title: string
          uploads_playlist_id?: string | null
        }
        Update: {
          channel_id?: string
          created_at?: string
          id?: string
          subscriber_count?: number | null
          thumbnail_url?: string | null
          title?: string
          uploads_playlist_id?: string | null
        }
        Relationships: []
      }
      linkedin_post_runs: {
        Row: {
          created_at: string
          id: string
          user_id: string
          video_channel: string | null
          video_id: string
          video_thumbnail: string | null
          video_title: string
        }
        Insert: {
          created_at?: string
          id?: string
          user_id: string
          video_channel?: string | null
          video_id: string
          video_thumbnail?: string | null
          video_title: string
        }
        Update: {
          created_at?: string
          id?: string
          user_id?: string
          video_channel?: string | null
          video_id?: string
          video_thumbnail?: string | null
          video_title?: string
        }
        Relationships: []
      }
      linkedin_run_posts: {
        Row: {
          body: string
          created_at: string
          cta: string | null
          hook: string
          id: string
          idx: number
          image_path: string | null
          image_prompt: string | null
          run_id: string
          type: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          cta?: string | null
          hook: string
          id?: string
          idx: number
          image_path?: string | null
          image_prompt?: string | null
          run_id: string
          type: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          cta?: string | null
          hook?: string
          id?: string
          idx?: number
          image_path?: string | null
          image_prompt?: string | null
          run_id?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "linkedin_run_posts_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "linkedin_post_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      my_channels: {
        Row: {
          channel_id: string
          created_at: string
          id: string
          style_profile: Json
          subscriber_count: number | null
          thumbnail_url: string | null
          title: string
          updated_at: string
          user_id: string
          videos_analyzed: number
        }
        Insert: {
          channel_id: string
          created_at?: string
          id?: string
          style_profile?: Json
          subscriber_count?: number | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string
          user_id: string
          videos_analyzed?: number
        }
        Update: {
          channel_id?: string
          created_at?: string
          id?: string
          style_profile?: Json
          subscriber_count?: number | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          user_id?: string
          videos_analyzed?: number
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string
          created_at: string
          id: string
          metadata: Json
          read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          metadata?: Json
          read?: boolean
          title: string
          type: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          metadata?: Json
          read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          brand_blueprint: Json
          created_at: string
          email: string | null
          full_name: string | null
          is_suspended: boolean
          onboarding_completed: boolean
          onboarding_step: number
          photo_url: string | null
          suspension_reason: string | null
          theme: string
          updated_at: string
          user_id: string
        }
        Insert: {
          brand_blueprint?: Json
          created_at?: string
          email?: string | null
          full_name?: string | null
          is_suspended?: boolean
          onboarding_completed?: boolean
          onboarding_step?: number
          photo_url?: string | null
          suspension_reason?: string | null
          theme?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          brand_blueprint?: Json
          created_at?: string
          email?: string | null
          full_name?: string | null
          is_suspended?: boolean
          onboarding_completed?: boolean
          onboarding_step?: number
          photo_url?: string | null
          suspension_reason?: string | null
          theme?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      scheduled_briefs: {
        Row: {
          brief_id: string | null
          created_at: string
          id: string
          notes: string | null
          scheduled_for: string
          status: string
          title: string
          updated_at: string
          user_id: string
          video_uuid: string
        }
        Insert: {
          brief_id?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          scheduled_for: string
          status?: string
          title: string
          updated_at?: string
          user_id: string
          video_uuid: string
        }
        Update: {
          brief_id?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          scheduled_for?: string
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
          video_uuid?: string
        }
        Relationships: []
      }
      scores: {
        Row: {
          criteria: Json
          id: string
          total: number
          updated_at: string
          user_id: string | null
          video_uuid: string
        }
        Insert: {
          criteria?: Json
          id?: string
          total?: number
          updated_at?: string
          user_id?: string | null
          video_uuid: string
        }
        Update: {
          criteria?: Json
          id?: string
          total?: number
          updated_at?: string
          user_id?: string | null
          video_uuid?: string
        }
        Relationships: [
          {
            foreignKeyName: "scores_video_uuid_fkey"
            columns: ["video_uuid"]
            isOneToOne: true
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      thumbnail_generations: {
        Row: {
          created_at: string
          id: string
          month: string
          prompt_used: string | null
          user_id: string
          variation_left: string | null
          variation_right: string | null
          video_uuid: string
        }
        Insert: {
          created_at?: string
          id?: string
          month: string
          prompt_used?: string | null
          user_id: string
          variation_left?: string | null
          variation_right?: string | null
          video_uuid: string
        }
        Update: {
          created_at?: string
          id?: string
          month?: string
          prompt_used?: string | null
          user_id?: string
          variation_left?: string | null
          variation_right?: string | null
          video_uuid?: string
        }
        Relationships: []
      }
      user_competitors: {
        Row: {
          channel_uuid: string
          created_at: string
          user_id: string
        }
        Insert: {
          channel_uuid: string
          created_at?: string
          user_id: string
        }
        Update: {
          channel_uuid?: string
          created_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_competitors_channel_uuid_fkey"
            columns: ["channel_uuid"]
            isOneToOne: false
            referencedRelation: "channels"
            referencedColumns: ["id"]
          },
        ]
      }
      videos: {
        Row: {
          channel_uuid: string
          comment_count: number | null
          created_at: string
          description: string | null
          duration_seconds: number | null
          id: string
          like_count: number | null
          published_at: string | null
          tags: string[] | null
          thumbnail_url: string | null
          title: string
          video_id: string
          view_count: number | null
        }
        Insert: {
          channel_uuid: string
          comment_count?: number | null
          created_at?: string
          description?: string | null
          duration_seconds?: number | null
          id?: string
          like_count?: number | null
          published_at?: string | null
          tags?: string[] | null
          thumbnail_url?: string | null
          title: string
          video_id: string
          view_count?: number | null
        }
        Update: {
          channel_uuid?: string
          comment_count?: number | null
          created_at?: string
          description?: string | null
          duration_seconds?: number | null
          id?: string
          like_count?: number | null
          published_at?: string | null
          tags?: string[] | null
          thumbnail_url?: string | null
          title?: string
          video_id?: string
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "videos_channel_uuid_fkey"
            columns: ["channel_uuid"]
            isOneToOne: false
            referencedRelation: "channels"
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
