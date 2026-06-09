export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      agent_events: {
        Row: {
          created_at: string | null
          event_data: Json
          event_type: string
          id: string
          notified_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          event_data: Json
          event_type: string
          id?: string
          notified_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          event_data?: Json
          event_type?: string
          id?: string
          notified_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      agent_memories: {
        Row: {
          content: string
          created_at: string | null
          embedding: string | null
          id: string
          metadata: Json | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          embedding?: string | null
          id?: string
          metadata?: Json | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          embedding?: string | null
          id?: string
          metadata?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      conversations: {
        Row: {
          created_at: string
          id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      docs_changelog: {
        Row: {
          changes: Json
          created_at: string
          date: string
          id: string
          version: string
        }
        Insert: {
          changes?: Json
          created_at?: string
          date: string
          id?: string
          version: string
        }
        Update: {
          changes?: Json
          created_at?: string
          date?: string
          id?: string
          version?: string
        }
        Relationships: []
      }
      docs_sections: {
        Row: {
          category: string
          content: Json
          created_at: string
          id: string
          is_published: boolean
          slug: string
          sort_order: number
          subtitle: string | null
          title: string
          updated_at: string
        }
        Insert: {
          category?: string
          content?: Json
          created_at?: string
          id?: string
          is_published?: boolean
          slug: string
          sort_order?: number
          subtitle?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          content?: Json
          created_at?: string
          id?: string
          is_published?: boolean
          slug?: string
          sort_order?: number
          subtitle?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      docs_team_members: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          email: string | null
          full_name: string
          id: string
          is_active: boolean
          role: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          email?: string | null
          full_name: string
          id?: string
          is_active?: boolean
          role: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          is_active?: boolean
          role?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      docs_visibility: {
        Row: {
          end_at: string | null
          id: string
          is_public: boolean
          start_at: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          end_at?: string | null
          id?: string
          is_public?: boolean
          start_at?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          end_at?: string | null
          id?: string
          is_public?: boolean
          start_at?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      materials: {
        Row: {
          content: string | null
          created_at: string
          deleted_at: string | null
          file_size: number | null
          fts: unknown
          id: string
          is_starred: boolean
          metadata: Json | null
          mime_type: string | null
          name: string
          parent_id: string | null
          storage_path: string | null
          type: string
          updated_at: string
          url: string | null
          user_id: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          deleted_at?: string | null
          file_size?: number | null
          fts?: unknown
          id?: string
          is_starred?: boolean
          metadata?: Json | null
          mime_type?: string | null
          name: string
          parent_id?: string | null
          storage_path?: string | null
          type: string
          updated_at?: string
          url?: string | null
          user_id: string
        }
        Update: {
          content?: string | null
          created_at?: string
          deleted_at?: string | null
          file_size?: number | null
          fts?: unknown
          id?: string
          is_starred?: boolean
          metadata?: Json | null
          mime_type?: string | null
          name?: string
          parent_id?: string | null
          storage_path?: string | null
          type?: string
          updated_at?: string
          url?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "materials_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          proposal_id: string | null
          role: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          proposal_id?: string | null
          role: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          proposal_id?: string | null
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      mochi_chats: {
        Row: {
          created_at: string | null
          id: string
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          title?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      mochi_conversations: {
        Row: {
          content: string | null
          created_at: string | null
          feedback: string | null
          feedback_updated_at: string | null
          id: string
          mochi_chat_id: string | null
          role: string
          tool_calls: Json | null
          tool_result: string | null
          user_id: string
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          feedback?: string | null
          feedback_updated_at?: string | null
          id?: string
          mochi_chat_id?: string | null
          role: string
          tool_calls?: Json | null
          tool_result?: string | null
          user_id: string
        }
        Update: {
          content?: string | null
          created_at?: string | null
          feedback?: string | null
          feedback_updated_at?: string | null
          id?: string
          mochi_chat_id?: string | null
          role?: string
          tool_calls?: Json | null
          tool_result?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mochi_conversations_mochi_chat_id_fkey"
            columns: ["mochi_chat_id"]
            isOneToOne: false
            referencedRelation: "mochi_chats"
            referencedColumns: ["id"]
          },
        ]
      }
      mochi_crons: {
        Row: {
          created_at: string | null
          cron_expr: string
          enabled: boolean | null
          id: string
          label: string
          last_run_at: string | null
          prompt: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          cron_expr: string
          enabled?: boolean | null
          id?: string
          label: string
          last_run_at?: string | null
          prompt?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          cron_expr?: string
          enabled?: boolean | null
          id?: string
          label?: string
          last_run_at?: string | null
          prompt?: string | null
          user_id?: string
        }
        Relationships: []
      }
      mochi_settings: {
        Row: {
          enabled: boolean | null
          max_crons: number | null
          tone: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          enabled?: boolean | null
          max_crons?: number | null
          tone?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          enabled?: boolean | null
          max_crons?: number | null
          tone?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      note_topics: {
        Row: {
          created_at: string
          note_id: string
          topic_id: string
        }
        Insert: {
          created_at?: string
          note_id: string
          topic_id: string
        }
        Update: {
          created_at?: string
          note_id?: string
          topic_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "note_topics_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
        ]
      }
      notes: {
        Row: {
          content: string
          content_fts: unknown
          created_at: string
          deleted_at: string | null
          id: string
          is_archived: boolean
          starred: boolean
          tags: string[]
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content?: string
          content_fts?: unknown
          created_at?: string
          deleted_at?: string | null
          id?: string
          is_archived?: boolean
          starred?: boolean
          tags?: string[]
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          content_fts?: unknown
          created_at?: string
          deleted_at?: string | null
          id?: string
          is_archived?: boolean
          starred?: boolean
          tags?: string[]
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      question_sets: {
        Row: {
          created_at: string
          difficulty: string
          extra_context: string | null
          generation_error: string | null
          generation_mode: string | null
          generation_status: string | null
          id: string
          material_id: string | null
          question_count: number
          time_limit: number | null
          title: string
          topic_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          difficulty?: string
          extra_context?: string | null
          generation_error?: string | null
          generation_mode?: string | null
          generation_status?: string | null
          id?: string
          material_id?: string | null
          question_count?: number
          time_limit?: number | null
          title: string
          topic_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          difficulty?: string
          extra_context?: string | null
          generation_error?: string | null
          generation_mode?: string | null
          generation_status?: string | null
          id?: string
          material_id?: string | null
          question_count?: number
          time_limit?: number | null
          title?: string
          topic_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "question_sets_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "question_sets_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
        ]
      }
      questions: {
        Row: {
          answer: string
          chapter: string | null
          created_at: string
          difficulty: string
          explanation: string | null
          id: string
          options: Json
          order: number
          question: string
          question_set_id: string
          question_type: string | null
          subject_name: string | null
          tags: string[]
          topic_name: string | null
        }
        Insert: {
          answer: string
          chapter?: string | null
          created_at?: string
          difficulty?: string
          explanation?: string | null
          id?: string
          options: Json
          order?: number
          question: string
          question_set_id: string
          question_type?: string | null
          subject_name?: string | null
          tags?: string[]
          topic_name?: string | null
        }
        Update: {
          answer?: string
          chapter?: string | null
          created_at?: string
          difficulty?: string
          explanation?: string | null
          id?: string
          options?: Json
          order?: number
          question?: string
          question_set_id?: string
          question_type?: string | null
          subject_name?: string | null
          tags?: string[]
          topic_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "questions_question_set_id_fkey"
            columns: ["question_set_id"]
            isOneToOne: false
            referencedRelation: "question_sets"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_attempts: {
        Row: {
          attempted_at: string
          id: string
          is_correct: boolean
          question_id: string | null
          question_set_id: string | null
          quiz_id: string | null
          selected_answer: string
          tags: string[]
          user_id: string
        }
        Insert: {
          attempted_at?: string
          id?: string
          is_correct: boolean
          question_id?: string | null
          question_set_id?: string | null
          quiz_id?: string | null
          selected_answer: string
          tags?: string[]
          user_id: string
        }
        Update: {
          attempted_at?: string
          id?: string
          is_correct?: boolean
          question_id?: string | null
          question_set_id?: string | null
          quiz_id?: string | null
          selected_answer?: string
          tags?: string[]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_attempts_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_attempts_question_set_id_fkey"
            columns: ["question_set_id"]
            isOneToOne: false
            referencedRelation: "question_sets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_attempts_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_session_answers: {
        Row: {
          created_at: string
          id: string
          is_correct: boolean
          question_id: string
          selected_answer: string | null
          session_id: string
          time_taken_seconds: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_correct?: boolean
          question_id: string
          selected_answer?: string | null
          session_id: string
          time_taken_seconds?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          is_correct?: boolean
          question_id?: string
          selected_answer?: string | null
          session_id?: string
          time_taken_seconds?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "quiz_session_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_session_answers_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "quiz_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_sessions: {
        Row: {
          completed_at: string | null
          id: string
          metadata: Json | null
          mode: string
          question_set_id: string | null
          score: number
          started_at: string
          time_taken_seconds: number | null
          total_questions: number
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          id?: string
          metadata?: Json | null
          mode: string
          question_set_id?: string | null
          score?: number
          started_at?: string
          time_taken_seconds?: number | null
          total_questions?: number
          user_id: string
        }
        Update: {
          completed_at?: string | null
          id?: string
          metadata?: Json | null
          mode?: string
          question_set_id?: string | null
          score?: number
          started_at?: string
          time_taken_seconds?: number | null
          total_questions?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_sessions_question_set_id_fkey"
            columns: ["question_set_id"]
            isOneToOne: false
            referencedRelation: "question_sets"
            referencedColumns: ["id"]
          },
        ]
      }
      quizzes: {
        Row: {
          answer: string
          created_at: string
          created_by: string | null
          id: string
          material_id: string | null
          options: Json
          question: string
          subject: string | null
          tags: string[]
          topic: string | null
        }
        Insert: {
          answer: string
          created_at?: string
          created_by?: string | null
          id?: string
          material_id?: string | null
          options: Json
          question: string
          subject?: string | null
          tags?: string[]
          topic?: string | null
        }
        Update: {
          answer?: string
          created_at?: string
          created_by?: string | null
          id?: string
          material_id?: string | null
          options?: Json
          question?: string
          subject?: string | null
          tags?: string[]
          topic?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quizzes_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
        ]
      }
      resources: {
        Row: {
          content: string | null
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          title: string
          type: string
          url: string | null
          user_id: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
          title: string
          type: string
          url?: string | null
          user_id: string
        }
        Update: {
          content?: string | null
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          title?: string
          type?: string
          url?: string | null
          user_id?: string
        }
        Relationships: []
      }
      review_history: {
        Row: {
          commit_message: string | null
          difficulty_before: string | null
          difficulty_selected: string
          ease_factor: number
          id: string
          interval_after_days: number
          interval_before_days: number
          review_number: number
          reviewed_at: string
          time_taken_seconds: number | null
          topic_id: string
          user_id: string
        }
        Insert: {
          commit_message?: string | null
          difficulty_before?: string | null
          difficulty_selected: string
          ease_factor: number
          id?: string
          interval_after_days: number
          interval_before_days: number
          review_number: number
          reviewed_at?: string
          time_taken_seconds?: number | null
          topic_id: string
          user_id: string
        }
        Update: {
          commit_message?: string | null
          difficulty_before?: string | null
          difficulty_selected?: string
          ease_factor?: number
          id?: string
          interval_after_days?: number
          interval_before_days?: number
          review_number?: number
          reviewed_at?: string
          time_taken_seconds?: number | null
          topic_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_history_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
        ]
      }
      study_commits: {
        Row: {
          committed_at: string | null
          difficulty: string
          duration_minutes: number
          id: string
          notes: string | null
          subject_name: string | null
          topic_id: string | null
          topic_name: string | null
          user_id: string
        }
        Insert: {
          committed_at?: string | null
          difficulty: string
          duration_minutes: number
          id?: string
          notes?: string | null
          subject_name?: string | null
          topic_id?: string | null
          topic_name?: string | null
          user_id: string
        }
        Update: {
          committed_at?: string | null
          difficulty?: string
          duration_minutes?: number
          id?: string
          notes?: string | null
          subject_name?: string | null
          topic_id?: string | null
          topic_name?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "study_commits_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
        ]
      }
      study_plans: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          plan_data: Json | null
          prompt: string | null
          status: string
          title: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          plan_data?: Json | null
          prompt?: string | null
          status?: string
          title?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          plan_data?: Json | null
          prompt?: string | null
          status?: string
          title?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      subject_updates: {
        Row: {
          body: string
          created_at: string
          health: string | null
          id: string
          subject_id: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          health?: string | null
          id?: string
          subject_id: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          health?: string | null
          id?: string
          subject_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subject_updates_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      subjects: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          icon: string | null
          id: string
          name: string
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      topic_materials: {
        Row: {
          created_at: string
          id: string
          material_id: string
          topic_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          material_id: string
          topic_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          material_id?: string
          topic_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "topic_materials_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "topic_materials_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
        ]
      }
      topics: {
        Row: {
          correct_reviews: number
          created_at: string
          current_difficulty: string | null
          current_interval_days: number
          description: string | null
          ease_factor: number
          first_reviewed_at: string | null
          fts: unknown
          id: string
          last_reviewed_at: string | null
          next_review_date: string
          notes: string | null
          plan_id: string | null
          state: string
          streak: number
          subject_id: string | null
          tags: string[] | null
          title: string
          total_reviews: number
          user_id: string
        }
        Insert: {
          correct_reviews?: number
          created_at?: string
          current_difficulty?: string | null
          current_interval_days?: number
          description?: string | null
          ease_factor?: number
          first_reviewed_at?: string | null
          fts?: unknown
          id?: string
          last_reviewed_at?: string | null
          next_review_date?: string
          notes?: string | null
          plan_id?: string | null
          state?: string
          streak?: number
          subject_id?: string | null
          tags?: string[] | null
          title: string
          total_reviews?: number
          user_id: string
        }
        Update: {
          correct_reviews?: number
          created_at?: string
          current_difficulty?: string | null
          current_interval_days?: number
          description?: string | null
          ease_factor?: number
          first_reviewed_at?: string | null
          fts?: unknown
          id?: string
          last_reviewed_at?: string | null
          next_review_date?: string
          notes?: string | null
          plan_id?: string | null
          state?: string
          streak?: number
          subject_id?: string | null
          tags?: string[] | null
          title?: string
          total_reviews?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "topics_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "study_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "topics_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      user_daily_quiz_report: {
        Row: {
          accuracy: number | null
          correct_answers: number | null
          questions_answered: number | null
          quizzes_taken: number | null
          report_date: string | null
          total_time_seconds: number | null
          unique_topics: number | null
          user_id: string | null
        }
        Relationships: []
      }
      user_topic_quiz_gaps: {
        Row: {
          accuracy: number | null
          correct_count: number | null
          subject_name: string | null
          topic_name: string | null
          total_attempts: number | null
          user_id: string | null
        }
        Relationships: []
      }
      user_weekly_quiz_report: {
        Row: {
          accuracy: number | null
          correct_answers: number | null
          questions_answered: number | null
          quizzes_taken: number | null
          total_time_seconds: number | null
          user_id: string | null
          week_start: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      increment_session_score: {
        Args: { session_uuid: string }
        Returns: undefined
      }
      match_agent_memories: {
        Args: {
          p_embedding: string
          p_match_count?: number
          p_match_threshold?: number
          p_user_id: string
        }
        Returns: {
          content: string
          created_at: string
          embedding: string
          id: string
          metadata: Json
          similarity: number
          user_id: string
        }[]
      }
      migrate_user_data_by_email: {
        Args: { p_email: string; p_new_user_id: string }
        Returns: string
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
