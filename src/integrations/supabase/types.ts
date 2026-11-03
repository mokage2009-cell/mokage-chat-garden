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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      chat_messages: {
        Row: {
          body: string
          call_duration_sec: number | null
          call_status: string | null
          call_type: string | null
          context: string
          created_at: string
          id: string
          media_type: string | null
          media_url: string | null
          scope_id: string
          sender_login_id: string
        }
        Insert: {
          body?: string
          call_duration_sec?: number | null
          call_status?: string | null
          call_type?: string | null
          context: string
          created_at?: string
          id?: string
          media_type?: string | null
          media_url?: string | null
          scope_id: string
          sender_login_id: string
        }
        Update: {
          body?: string
          call_duration_sec?: number | null
          call_status?: string | null
          call_type?: string | null
          context?: string
          created_at?: string
          id?: string
          media_type?: string | null
          media_url?: string | null
          scope_id?: string
          sender_login_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_sender_login_id_fkey"
            columns: ["sender_login_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["login_id"]
          },
        ]
      }
      communities: {
        Row: {
          avatar_image_url: string | null
          created_at: string
          description: string
          dissolved_at: string | null
          header_image_url: string | null
          id: string
          join_mode: string
          name: string
          owner_login_id: string
          owner_message: string
        }
        Insert: {
          avatar_image_url?: string | null
          created_at?: string
          description?: string
          dissolved_at?: string | null
          header_image_url?: string | null
          id?: string
          join_mode?: string
          name: string
          owner_login_id: string
          owner_message?: string
        }
        Update: {
          avatar_image_url?: string | null
          created_at?: string
          description?: string
          dissolved_at?: string | null
          header_image_url?: string | null
          id?: string
          join_mode?: string
          name?: string
          owner_login_id?: string
          owner_message?: string
        }
        Relationships: [
          {
            foreignKeyName: "communities_owner_login_id_fkey"
            columns: ["owner_login_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["login_id"]
          },
        ]
      }
      community_chat_rooms: {
        Row: {
          community_id: string
          created_at: string
          deleted_at: string | null
          id: string
          last_message_at: string | null
          name: string
        }
        Insert: {
          community_id: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          last_message_at?: string | null
          name: string
        }
        Update: {
          community_id?: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          last_message_at?: string | null
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_chat_rooms_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
        ]
      }
      community_memberships: {
        Row: {
          applicant_login_id: string
          community_id: string
          created_at: string
          id: string
          role: string
        }
        Insert: {
          applicant_login_id: string
          community_id: string
          created_at?: string
          id?: string
          role?: string
        }
        Update: {
          applicant_login_id?: string
          community_id?: string
          created_at?: string
          id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_memberships_applicant_login_id_fkey"
            columns: ["applicant_login_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["login_id"]
          },
          {
            foreignKeyName: "community_memberships_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
        ]
      }
      deleted_user_ids: {
        Row: {
          deleted_at: string
          login_id: string
        }
        Insert: {
          deleted_at?: string
          login_id: string
        }
        Update: {
          deleted_at?: string
          login_id?: string
        }
        Relationships: []
      }
      friend_posts: {
        Row: {
          author_login_id: string
          created_at: string
          id: string
          message: string
          title: string
        }
        Insert: {
          author_login_id: string
          created_at?: string
          id?: string
          message?: string
          title: string
        }
        Update: {
          author_login_id?: string
          created_at?: string
          id?: string
          message?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "friend_posts_author_login_id_fkey"
            columns: ["author_login_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["login_id"]
          },
        ]
      }
      friend_requests: {
        Row: {
          applicant_login_id: string
          created_at: string
          id: string
          post_id: string | null
          status: string
          target_login_id: string | null
        }
        Insert: {
          applicant_login_id: string
          created_at?: string
          id?: string
          post_id?: string | null
          status?: string
          target_login_id?: string | null
        }
        Update: {
          applicant_login_id?: string
          created_at?: string
          id?: string
          post_id?: string | null
          status?: string
          target_login_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "friend_requests_applicant_login_id_fkey"
            columns: ["applicant_login_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["login_id"]
          },
          {
            foreignKeyName: "friend_requests_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "friend_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "friend_requests_target_login_id_fkey"
            columns: ["target_login_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["login_id"]
          },
        ]
      }
      notifications: {
        Row: {
          actor_login_id: string | null
          body: string
          created_at: string
          id: string
          is_read: boolean
          recipient_login_id: string
          title: string
          type: string
        }
        Insert: {
          actor_login_id?: string | null
          body?: string
          created_at?: string
          id?: string
          is_read?: boolean
          recipient_login_id: string
          title: string
          type: string
        }
        Update: {
          actor_login_id?: string | null
          body?: string
          created_at?: string
          id?: string
          is_read?: boolean
          recipient_login_id?: string
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_actor_login_id_fkey"
            columns: ["actor_login_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["login_id"]
          },
          {
            foreignKeyName: "notifications_recipient_login_id_fkey"
            columns: ["recipient_login_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["login_id"]
          },
        ]
      }
      profiles: {
        Row: {
          account_number: number
          age: number | null
          avatar_image_url: string | null
          bio: string
          display_name: string
          gender: string
          header_image_url: string | null
          hobbies: string[]
          login_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          account_number: number
          age?: number | null
          avatar_image_url?: string | null
          bio?: string
          display_name: string
          gender?: string
          header_image_url?: string | null
          hobbies?: string[]
          login_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          account_number?: number
          age?: number | null
          avatar_image_url?: string | null
          bio?: string
          display_name?: string
          gender?: string
          header_image_url?: string | null
          hobbies?: string[]
          login_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      timeline_posts: {
        Row: {
          author_login_id: string
          created_at: string
          id: string
          message: string
          title: string
        }
        Insert: {
          author_login_id: string
          created_at?: string
          id?: string
          message?: string
          title: string
        }
        Update: {
          author_login_id?: string
          created_at?: string
          id?: string
          message?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "timeline_posts_author_login_id_fkey"
            columns: ["author_login_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["login_id"]
          },
        ]
      }
      user_feedback: {
        Row: {
          created_at: string
          id: string
          message: string
          sender_login_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          sender_login_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          sender_login_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_feedback_sender_login_id_fkey"
            columns: ["sender_login_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["login_id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      approve_community_member: {
        Args: { p_actor_login_id: string; p_membership_id: string }
        Returns: undefined
      }
      create_community_chat_room: {
        Args: {
          p_actor_login_id: string
          p_community_id: string
          p_name: string
        }
        Returns: string
      }
      current_login_id: { Args: never; Returns: string }
      delete_community_chat_room: {
        Args: { p_actor_login_id: string; p_room_id: string }
        Returns: undefined
      }
      dissolve_community: {
        Args: { p_actor_login_id: string; p_community_id: string }
        Returns: undefined
      }
      is_app_owner: { Args: never; Returns: boolean }
      reject_community_member: {
        Args: { p_actor_login_id: string; p_membership_id: string }
        Returns: undefined
      }
      update_community_join_mode: {
        Args: {
          p_actor_login_id: string
          p_community_id: string
          p_join_mode: string
        }
        Returns: undefined
      }
      update_community_owner_profile: {
        Args: {
          p_actor_login_id: string
          p_avatar_image_url: string
          p_community_id: string
          p_header_image_url: string
          p_name: string
          p_owner_message: string
        }
        Returns: undefined
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
    Enums: {},
  },
} as const
