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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      activity_requirements: {
        Row: {
          activity_id: string
          created_at: string | null
          id: string
          requires_activity_id: string
        }
        Insert: {
          activity_id: string
          created_at?: string | null
          id?: string
          requires_activity_id: string
        }
        Update: {
          activity_id?: string
          created_at?: string | null
          id?: string
          requires_activity_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_requirements_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "active_activity_hierarchy"
            referencedColumns: ["activity_id"]
          },
          {
            foreignKeyName: "activity_requirements_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "typeforms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_requirements_requires_activity_id_fkey"
            columns: ["requires_activity_id"]
            isOneToOne: false
            referencedRelation: "active_activity_hierarchy"
            referencedColumns: ["activity_id"]
          },
          {
            foreignKeyName: "activity_requirements_requires_activity_id_fkey"
            columns: ["requires_activity_id"]
            isOneToOne: false
            referencedRelation: "typeforms"
            referencedColumns: ["id"]
          },
        ]
      }
      api_key: {
        Row: {
          decrypted_secret: string | null
        }
        Insert: {
          decrypted_secret?: string | null
        }
        Update: {
          decrypted_secret?: string | null
        }
        Relationships: []
      }
      levels: {
        Row: {
          created_at: string
          description: string | null
          id: string
          order_index: number | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          order_index?: number | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          order_index?: number | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      practice_calls: {
        Row: {
          call_data: Json | null
          call_duration_secs: number | null
          conversation_id: string | null
          created_at: string
          id: string
          scoring_status: string
          status_reason: string | null
          transcript: Json | null
          transcript_text: string | null
          user_id: string
        }
        Insert: {
          call_data?: Json | null
          call_duration_secs?: number | null
          conversation_id?: string | null
          created_at?: string
          id?: string
          scoring_status: string
          status_reason?: string | null
          transcript?: Json | null
          transcript_text?: string | null
          user_id: string
        }
        Update: {
          call_data?: Json | null
          call_duration_secs?: number | null
          conversation_id?: string | null
          created_at?: string
          id?: string
          scoring_status?: string
          status_reason?: string | null
          transcript?: Json | null
          transcript_text?: string | null
          user_id?: string
        }
        Relationships: []
      }
      prompts: {
        Row: {
          created_at: string | null
          id: string
          label: string
          template: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          label: string
          template: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          label?: string
          template?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      scorecards: {
        Row: {
          created_at: string
          feedback: string
          id: string
          practice_call_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          feedback: string
          id?: string
          practice_call_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          feedback?: string
          id?: string
          practice_call_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "scorecards_practice_call_id_fkey"
            columns: ["practice_call_id"]
            isOneToOne: true
            referencedRelation: "practice_calls"
            referencedColumns: ["id"]
          },
        ]
      }
      typeforms: {
        Row: {
          activity_slug: string
          created_at: string
          description: string | null
          form_id: string | null
          hint: string | null
          id: string
          level_id: string | null
          order_index: number
          published: boolean
          title: string
          updated_at: string
        }
        Insert: {
          activity_slug: string
          created_at?: string
          description?: string | null
          form_id?: string | null
          hint?: string | null
          id?: string
          level_id?: string | null
          order_index?: number
          published?: boolean
          title: string
          updated_at?: string
        }
        Update: {
          activity_slug?: string
          created_at?: string
          description?: string | null
          form_id?: string | null
          hint?: string | null
          id?: string
          level_id?: string | null
          order_index?: number
          published?: boolean
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "typeforms_level_id_fkey"
            columns: ["level_id"]
            isOneToOne: false
            referencedRelation: "active_activity_hierarchy"
            referencedColumns: ["level_id"]
          },
          {
            foreignKeyName: "typeforms_level_id_fkey"
            columns: ["level_id"]
            isOneToOne: false
            referencedRelation: "levels"
            referencedColumns: ["id"]
          },
        ]
      }
      user_activity_completions: {
        Row: {
          activity_id: string
          completed_at: string
          user_id: string
        }
        Insert: {
          activity_id: string
          completed_at?: string
          user_id: string
        }
        Update: {
          activity_id?: string
          completed_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_activity_completions_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "active_activity_hierarchy"
            referencedColumns: ["activity_id"]
          },
          {
            foreignKeyName: "user_activity_completions_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "typeforms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_activity_completions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          created_at: string
          id: string
          role: string
          updated_at: string
          username: string
        }
        Insert: {
          created_at?: string
          id: string
          role?: string
          updated_at?: string
          username: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: string
          updated_at?: string
          username?: string
        }
        Relationships: []
      }
    }
    Views: {
      active_activity_hierarchy: {
        Row: {
          activity_description: string | null
          activity_id: string | null
          activity_order: number | null
          activity_published: boolean | null
          activity_slug: string | null
          activity_title: string | null
          form_id: string | null
          hint: string | null
          level_description: string | null
          level_id: string | null
          level_order: number | null
          level_title: string | null
          requires_activity_ids: string[] | null
        }
        Relationships: []
      }
    }
    Functions: {
      can_user_access_activity: {
        Args: { p_activity_id: string; p_user_id: string }
        Returns: boolean
      }
      complete_activity: {
        Args: { p_activity_id: string; p_user_id: string }
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
