export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.4";
  };
  public: {
    Tables: {
      conversations: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      messages: {
        Row: {
          id: string;
          conversation_id: string;
          role: string;
          content: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          role: string;
          content: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          conversation_id?: string;
          role?: string;
          content?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey";
            columns: ["conversation_id"];
            isOneToOne: false;
            referencedRelation: "conversations";
            referencedColumns: ["id"];
          },
        ];
      };
      resources: {
        Row: {
          content: string | null;
          created_at: string;
          entity_id: string;
          entity_type: string;
          id: string;
          title: string;
          type: string;
          url: string | null;
          user_id: string;
        };
        Insert: {
          content?: string | null;
          created_at?: string;
          entity_id: string;
          entity_type: string;
          id?: string;
          title: string;
          type: string;
          url?: string | null;
          user_id: string;
        };
        Update: {
          content?: string | null;
          created_at?: string;
          entity_id?: string;
          entity_type?: string;
          id?: string;
          title?: string;
          type?: string;
          url?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      review_history: {
        Row: {
          commit_message: string | null;
          difficulty_before: string | null;
          difficulty_selected: string;
          ease_factor: number;
          id: string;
          interval_after_days: number;
          interval_before_days: number;
          review_number: number;
          reviewed_at: string;
          time_taken_seconds: number | null;
          topic_id: string;
          user_id: string;
        };
        Insert: {
          commit_message?: string | null;
          difficulty_before?: string | null;
          difficulty_selected: string;
          ease_factor: number;
          id?: string;
          interval_after_days: number;
          interval_before_days: number;
          review_number: number;
          reviewed_at?: string;
          time_taken_seconds?: number | null;
          topic_id: string;
          user_id: string;
        };
        Update: {
          commit_message?: string | null;
          difficulty_before?: string | null;
          difficulty_selected?: string;
          ease_factor?: number;
          id?: string;
          interval_after_days?: number;
          interval_before_days?: number;
          review_number?: number;
          reviewed_at?: string;
          time_taken_seconds?: number | null;
          topic_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "review_history_topic_id_fkey";
            columns: ["topic_id"];
            isOneToOne: false;
            referencedRelation: "topics";
            referencedColumns: ["id"];
          },
        ];
      };
      subject_updates: {
        Row: {
          body: string;
          created_at: string;
          health: string | null;
          id: string;
          subject_id: string;
          user_id: string;
        };
        Insert: {
          body: string;
          created_at?: string;
          health?: string | null;
          id?: string;
          subject_id: string;
          user_id: string;
        };
        Update: {
          body?: string;
          created_at?: string;
          health?: string | null;
          id?: string;
          subject_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "subject_updates_subject_id_fkey";
            columns: ["subject_id"];
            isOneToOne: false;
            referencedRelation: "subjects";
            referencedColumns: ["id"];
          },
        ];
      };
      subjects: {
        Row: {
          color: string | null;
          created_at: string;
          description: string | null;
          icon: string | null;
          id: string;
          name: string;
          user_id: string;
        };
        Insert: {
          color?: string | null;
          created_at?: string;
          description?: string | null;
          icon?: string | null;
          id?: string;
          name: string;
          user_id: string;
        };
        Update: {
          color?: string | null;
          created_at?: string;
          description?: string | null;
          icon?: string | null;
          id?: string;
          name?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      notes: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          content: string;
          tags: string[];
          starred: boolean;
          deleted_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title?: string;
          content?: string;
          tags?: string[];
          starred?: boolean;
          deleted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          content?: string;
          tags?: string[];
          starred?: boolean;
          deleted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      materials: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          type: string;
          mime_type: string | null;
          file_size: number | null;
          storage_path: string | null;
          url: string | null;
          content: string | null;
          parent_id: string | null;
          is_starred: boolean;
          deleted_at: string | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          type: string;
          mime_type?: string | null;
          file_size?: number | null;
          storage_path?: string | null;
          url?: string | null;
          content?: string | null;
          parent_id?: string | null;
          is_starred?: boolean;
          deleted_at?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          type?: string;
          mime_type?: string | null;
          file_size?: number | null;
          storage_path?: string | null;
          url?: string | null;
          content?: string | null;
          parent_id?: string | null;
          is_starred?: boolean;
          deleted_at?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      topics: {
        Row: {
          correct_reviews: number;
          created_at: string;
          current_difficulty: string | null;
          current_interval_days: number;
          description: string | null;
          ease_factor: number;
          first_reviewed_at: string | null;
          fts: unknown;
          id: string;
          last_reviewed_at: string | null;
          next_review_date: string;
          notes: string | null;
          state: string;
          streak: number;
          subject_id: string | null;
          tags: string[] | null;
          title: string;
          total_reviews: number;
          user_id: string;
        };
        Insert: {
          correct_reviews?: number;
          created_at?: string;
          current_difficulty?: string | null;
          current_interval_days?: number;
          description?: string | null;
          ease_factor?: number;
          first_reviewed_at?: string | null;
          fts?: unknown;
          id?: string;
          last_reviewed_at?: string | null;
          next_review_date?: string;
          notes?: string | null;
          state?: string;
          streak?: number;
          subject_id?: string | null;
          tags?: string[] | null;
          title: string;
          total_reviews?: number;
          user_id: string;
        };
        Update: {
          correct_reviews?: number;
          created_at?: string;
          current_difficulty?: string | null;
          current_interval_days?: number;
          description?: string | null;
          ease_factor?: number;
          first_reviewed_at?: string | null;
          fts?: unknown;
          id?: string;
          last_reviewed_at?: string | null;
          next_review_date?: string;
          notes?: string | null;
          state?: string;
          streak?: number;
          subject_id?: string | null;
          tags?: string[] | null;
          title?: string;
          total_reviews?: number;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "topics_subject_id_fkey";
            columns: ["subject_id"];
            isOneToOne: false;
            referencedRelation: "subjects";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
