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
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
