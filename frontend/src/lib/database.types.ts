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
      typing_runs: {
        Row: {
          id: number;
          created_at: string;
          mode: string;
          wpm: number;
          accuracy: number;
          duration_seconds: number;
          typed_chars: number;
          correct_chars: number;
          mistakes: number;
          total_words: number;
          completed_words: number;
          error_events: Json;
          user_id: string | null;
        };
        Insert: {
          id?: number;
          created_at?: string;
          mode: string;
          wpm: number;
          accuracy: number;
          duration_seconds: number;
          typed_chars: number;
          correct_chars: number;
          mistakes: number;
          total_words: number;
          completed_words: number;
          error_events: Json;
          user_id?: string | null;
        };
        Update: {
          id?: number;
          created_at?: string;
          mode?: string;
          wpm?: number;
          accuracy?: number;
          duration_seconds?: number;
          typed_chars?: number;
          correct_chars?: number;
          mistakes?: number;
          total_words?: number;
          completed_words?: number;
          error_events?: Json;
          user_id?: string | null;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
