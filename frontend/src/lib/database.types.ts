// Supabase database types used by the frontend data layer.
// Keep this aligned with the live schema when tables change.
export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export type Database = {
  public: {
    Tables: {
      texts: {
        Row: {
          id: string;
          content: string;
          category: string;
          difficulty: string;
          language: string;
          word_count: number;
          source: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          content: string;
          category: string;
          difficulty: string;
          language: string;
          word_count: number;
          source?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          content?: string;
          category?: string;
          difficulty?: string;
          language?: string;
          word_count?: number;
          source?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      words: {
        Row: {
          id: string;
          word: string;
          language: string;
          difficulty: string | null;
          category: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          word: string;
          language?: string;
          difficulty?: string | null;
          category?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          word?: string;
          language?: string;
          difficulty?: string | null;
          category?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          user_id: string;
          username: string;
          avatar_url: string | null;
          public_profile: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          username: string;
          avatar_url?: string | null;
          public_profile?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          username?: string;
          avatar_url?: string | null;
          public_profile?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      user_settings: {
        Row: {
          user_id: string;
          theme: string;
          language: string;
          default_typing_mode: string;
          default_words_count: number;
          default_word_difficulty: string;
          default_no_mistake: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          theme?: string;
          language?: string;
          default_typing_mode?: string;
          default_words_count?: number;
          default_word_difficulty?: string;
          default_no_mistake?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          theme?: string;
          language?: string;
          default_typing_mode?: string;
          default_words_count?: number;
          default_word_difficulty?: string;
          default_no_mistake?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      typing_runs: {
        Row: {
          id: string;
          user_id: string;
          text_id: string | null;
          mode: string;
          language: string;
          difficulty: string | null;
          words_count: number | null;
          no_mistake: boolean;
          wpm: number;
          accuracy: number;
          duration_ms: number;
          typed_chars: number;
          correct_chars: number;
          mistakes: number;
          completed_words: number;
          total_words: number;
          failed_by_mistake: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          text_id?: string | null;
          mode: string;
          language?: string;
          difficulty?: string | null;
          words_count?: number | null;
          no_mistake?: boolean;
          wpm: number;
          accuracy: number;
          duration_ms: number;
          typed_chars: number;
          correct_chars: number;
          mistakes: number;
          completed_words: number;
          total_words: number;
          failed_by_mistake?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          text_id?: string | null;
          mode?: string;
          language?: string;
          difficulty?: string | null;
          words_count?: number | null;
          no_mistake?: boolean;
          wpm?: number;
          accuracy?: number;
          duration_ms?: number;
          typed_chars?: number;
          correct_chars?: number;
          mistakes?: number;
          completed_words?: number;
          total_words?: number;
          failed_by_mistake?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      typing_errors: {
        Row: {
          id: string;
          run_id: string;
          user_id: string;
          word: string;
          word_number: number;
          char_position: number;
          expected: string;
          typed: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          run_id: string;
          user_id?: string;
          word: string;
          word_number: number;
          char_position: number;
          expected: string;
          typed: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          run_id?: string;
          user_id?: string;
          word?: string;
          word_number?: number;
          char_position?: number;
          expected?: string;
          typed?: string;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      get_auth_email_for_username: {
        Args: {
          value: string;
        };
        Returns: string | null;
      };
      is_username_available: {
        Args: {
          value: string;
        };
        Returns: boolean;
      };
      is_valid_username: {
        Args: {
          value: string;
        };
        Returns: boolean;
      };
      normalize_username: {
        Args: {
          value: string;
        };
        Returns: string;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
