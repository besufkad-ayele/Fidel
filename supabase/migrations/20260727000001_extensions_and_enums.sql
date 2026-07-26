-- Fidel foundation: extensions, helper schema, enums, shared triggers.

create extension if not exists "pgcrypto";
create extension if not exists "btree_gist";
create extension if not exists "pg_trgm";

create schema if not exists fidel;
grant usage on schema fidel to authenticated, anon;

create type user_role as enum ('student', 'teacher', 'admin');
create type persona as enum ('diplomat', 'ngo', 'tourist', 'missionary', 'researcher', 'diaspora', 'other');
create type study_intent as enum ('casual', 'steady', 'intensive');
create type lesson_part as enum ('cultural_insight', 'language_lesson', 'practice');
create type publish_status as enum ('draft', 'in_review', 'published', 'archived');
create type part_status as enum ('not_started', 'in_progress', 'completed');
create type self_paced_status as enum ('not_started', 'in_progress', 'completed');
create type live_status as enum ('not_booked', 'booked', 'completed');
create type exercise_type as enum (
  'fill_blank',
  'translate_en_am',
  'translate_am_en',
  'matching',
  'multiple_choice',
  'word_order',
  'speaking',
  'roleplay'
);
create type question_type as enum (
  'multiple_choice',
  'true_false',
  'fill_blank',
  'matching',
  'short_answer'
);
create type homework_status as enum ('assigned', 'submitted', 'reviewed', 'needs_resubmission');
create type session_status as enum ('scheduled', 'completed', 'cancelled', 'no_show');
create type entitlement_scope as enum ('level', 'unit');
create type entitlement_source as enum ('admin_grant', 'trial', 'purchase', 'promo', 'staff');
create type entitlement_status as enum ('active', 'expired', 'revoked');
create type payment_provider as enum (
  'manual_bank',
  'manual_cash',
  'manual_cheque',
  'manual_invoice',
  'mobile_money',
  'other',
  'stripe',
  'chapa',
  'telebirr'
);
create type payment_status as enum ('paid', 'pending', 'partial', 'failed', 'refunded');
create type organization_type as enum (
  'embassy',
  'ngo',
  'government',
  'university',
  'company',
  'religious',
  'individual',
  'other'
);
create type prior_experience as enum (
  'none',
  'few_words',
  'speaks_some',
  'reads_fidel',
  'conversational'
);
create type credit_reason as enum ('grant', 'booking', 'cancellation_refund', 'expiry', 'adjustment');
create type admin_title as enum (
  'super_admin',
  'content_manager',
  'program_coordinator',
  'support'
);
create type certificate_status as enum ('issued', 'revoked');
create type media_kind as enum ('audio', 'video', 'image', 'document');
create type audio_speed as enum ('slow', 'normal', 'natural');
create type notification_kind as enum (
  'session_reminder',
  'session_booked',
  'session_cancelled',
  'homework_feedback',
  'unit_unlocked',
  'certificate_issued',
  'announcement'
);

create or replace function fidel.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
