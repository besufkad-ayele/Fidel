/**
 * Hand-maintained until `pnpm db:types` can run with SUPABASE_ACCESS_TOKEN.
 * Covers identity + curriculum tables used by student/admin content flows.
 */
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

type PublishStatus = 'draft' | 'in_review' | 'published' | 'archived'
type LessonPart = 'cultural_insight' | 'language_lesson' | 'practice'

type EmptyRelationships = []

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          role: 'student' | 'teacher' | 'admin'
          admin_title: 'super_admin' | 'content_manager' | 'program_coordinator' | 'support' | null
          full_name: string
          avatar_url: string | null
          email: string
          phone: string | null
          timezone: string
          locale: string
          welcome_seen_at: string | null
          invited_at: string | null
          activated_at: string | null
          is_active: boolean
          suspended_reason: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          role?: 'student' | 'teacher' | 'admin'
          admin_title?: 'super_admin' | 'content_manager' | 'program_coordinator' | 'support' | null
          full_name?: string
          avatar_url?: string | null
          email: string
          phone?: string | null
          timezone?: string
          locale?: string
          welcome_seen_at?: string | null
          invited_at?: string | null
          activated_at?: string | null
          is_active?: boolean
          suspended_reason?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          role?: 'student' | 'teacher' | 'admin'
          admin_title?: 'super_admin' | 'content_manager' | 'program_coordinator' | 'support' | null
          full_name?: string
          avatar_url?: string | null
          email?: string
          phone?: string | null
          timezone?: string
          locale?: string
          welcome_seen_at?: string | null
          invited_at?: string | null
          activated_at?: string | null
          is_active?: boolean
          suspended_reason?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: EmptyRelationships
      }
      levels: {
        Row: {
          id: string
          fidel_char: string
          cefr_equivalent: string
          title: string
          subtitle: string | null
          description: string | null
          can_do_summary: string | null
          sort_order: number
          status: PublishStatus
          is_coming_soon: boolean
          cover_image_path: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          fidel_char: string
          cefr_equivalent: string
          title: string
          sort_order: number
          subtitle?: string | null
          description?: string | null
          can_do_summary?: string | null
          status?: PublishStatus
          is_coming_soon?: boolean
          cover_image_path?: string | null
        }
        Update: {
          id?: string
          fidel_char?: string
          cefr_equivalent?: string
          title?: string
          subtitle?: string | null
          description?: string | null
          can_do_summary?: string | null
          sort_order?: number
          status?: PublishStatus
          is_coming_soon?: boolean
          cover_image_path?: string | null
        }
        Relationships: EmptyRelationships
      }
      units: {
        Row: {
          id: string
          level_id: string
          slug: string
          title: string
          subtitle: string | null
          description: string | null
          estimated_minutes: number
          sort_order: number
          status: PublishStatus
          cover_image_path: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          level_id: string
          slug: string
          title: string
          sort_order: number
          subtitle?: string | null
          description?: string | null
          estimated_minutes?: number
          status?: PublishStatus
          cover_image_path?: string | null
        }
        Update: {
          id?: string
          level_id?: string
          slug?: string
          title?: string
          subtitle?: string | null
          description?: string | null
          estimated_minutes?: number
          sort_order?: number
          status?: PublishStatus
          cover_image_path?: string | null
        }
        Relationships: EmptyRelationships
      }
      lesson_parts: {
        Row: {
          id: string
          unit_id: string
          part: LessonPart
          content: Json
          status: PublishStatus
          created_at: string
          updated_at: string
        }
        Insert: {
          unit_id: string
          part: LessonPart
          id?: string
          content?: Json
          status?: PublishStatus
        }
        Update: {
          id?: string
          unit_id?: string
          part?: LessonPart
          content?: Json
          status?: PublishStatus
        }
        Relationships: EmptyRelationships
      }
      vocabulary_items: {
        Row: {
          id: string
          level_id: string
          amharic: string
          transliteration: string | null
          english: string
          part_of_speech: string | null
          example_amharic: string | null
          example_english: string | null
          audio_slow_path: string | null
          audio_normal_path: string | null
          audio_natural_path: string | null
          notes: string | null
          tags: string[]
          difficulty_weight: number
          created_at: string
          updated_at: string
        }
        Insert: {
          amharic: string
          english: string
          level_id: string
          id?: string
          transliteration?: string | null
          part_of_speech?: string | null
          notes?: string | null
          tags?: string[]
          difficulty_weight?: number
        }
        Update: {
          id?: string
          level_id?: string
          amharic?: string
          transliteration?: string | null
          english?: string
          part_of_speech?: string | null
          notes?: string | null
          difficulty_weight?: number
        }
        Relationships: EmptyRelationships
      }
      unit_vocabulary: {
        Row: {
          unit_id: string
          vocabulary_id: string
          sort_order: number
          is_core: boolean
        }
        Insert: {
          unit_id: string
          vocabulary_id: string
          sort_order?: number
          is_core?: boolean
        }
        Update: {
          unit_id?: string
          vocabulary_id?: string
          sort_order?: number
          is_core?: boolean
        }
        Relationships: EmptyRelationships
      }
      vocabulary_reviews: {
        Row: {
          id: string
          student_id: string
          vocabulary_id: string
          box: number
          ease: number
          interval_days: number
          repetitions: number
          last_rating: number | null
          last_reviewed_at: string | null
          next_review_at: string
          created_at: string
          updated_at: string
        }
        Insert: {
          student_id: string
          vocabulary_id: string
          id?: string
          box?: number
          ease?: number
          interval_days?: number
          repetitions?: number
          last_rating?: number | null
          last_reviewed_at?: string | null
          next_review_at?: string
        }
        Update: {
          box?: number
          ease?: number
          interval_days?: number
          repetitions?: number
          last_rating?: number | null
          last_reviewed_at?: string | null
          next_review_at?: string
          updated_at?: string
        }
        Relationships: EmptyRelationships
      }
      homework_assignments: {
        Row: {
          id: string
          unit_id: string | null
          session_id: string | null
          student_id: string | null
          assigned_by: string | null
          title: string
          instructions: string
          is_unit_default: boolean
          due_at: string | null
          allow_text: boolean
          allow_audio: boolean
          allow_video: boolean
          allow_files: boolean
          max_audio_seconds: number | null
          max_video_seconds: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          title: string
          instructions: string
          id?: string
          unit_id?: string | null
          student_id?: string | null
          assigned_by?: string | null
          is_unit_default?: boolean
          allow_text?: boolean
          allow_audio?: boolean
          allow_video?: boolean
          allow_files?: boolean
          max_audio_seconds?: number | null
          max_video_seconds?: number | null
        }
        Update: {
          title?: string
          instructions?: string
          unit_id?: string | null
          is_unit_default?: boolean
          allow_audio?: boolean
          allow_video?: boolean
          max_audio_seconds?: number | null
        }
        Relationships: EmptyRelationships
      }
      homework_submissions: {
        Row: {
          id: string
          assignment_id: string
          student_id: string
          attempt_no: number
          text_response: string | null
          file_paths: string[]
          audio_path: string | null
          video_path: string | null
          status: 'assigned' | 'submitted' | 'reviewed' | 'needs_resubmission'
          reviewed_by: string | null
          feedback: string | null
          grade: number | null
          submitted_at: string
          reviewed_at: string | null
        }
        Insert: {
          assignment_id: string
          student_id: string
          id?: string
          attempt_no?: number
          text_response?: string | null
          file_paths?: string[]
          audio_path?: string | null
          video_path?: string | null
        }
        Update: {
          text_response?: string | null
          audio_path?: string | null
          video_path?: string | null
          status?: 'assigned' | 'submitted' | 'reviewed' | 'needs_resubmission'
          feedback?: string | null
          grade?: number | null
        }
        Relationships: EmptyRelationships
      }
      blog_posts: {
        Row: {
          id: string
          slug: string
          title: string
          excerpt: string | null
          body_md: string
          cover_path: string | null
          cover_alt: string | null
          video_url: string | null
          video_path: string | null
          video_caption: string | null
          gallery: Json
          reference_links: Json
          blocks: Json
          author_id: string | null
          tags: string[]
          status: PublishStatus
          published_at: string | null
          seo_title: string | null
          seo_description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          slug: string
          title: string
          id?: string
          excerpt?: string | null
          body_md?: string
          cover_path?: string | null
          cover_alt?: string | null
          video_url?: string | null
          video_path?: string | null
          video_caption?: string | null
          gallery?: Json
          reference_links?: Json
          blocks?: Json
          author_id?: string | null
          tags?: string[]
          status?: PublishStatus
          published_at?: string | null
          seo_title?: string | null
          seo_description?: string | null
        }
        Update: {
          slug?: string
          title?: string
          excerpt?: string | null
          body_md?: string
          cover_path?: string | null
          cover_alt?: string | null
          video_url?: string | null
          video_path?: string | null
          video_caption?: string | null
          gallery?: Json
          reference_links?: Json
          blocks?: Json
          author_id?: string | null
          tags?: string[]
          status?: PublishStatus
          published_at?: string | null
          seo_title?: string | null
          seo_description?: string | null
        }
        Relationships: EmptyRelationships
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: {
      user_role: 'student' | 'teacher' | 'admin'
      admin_title: 'super_admin' | 'content_manager' | 'program_coordinator' | 'support'
      publish_status: PublishStatus
      lesson_part: LessonPart
    }
    CompositeTypes: Record<string, never>
  }
}

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']
