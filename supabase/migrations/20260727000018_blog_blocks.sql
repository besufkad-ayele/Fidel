-- Ordered content blocks for blog posts (drag-and-drop editor).

alter table public.blog_posts
  add column if not exists blocks jsonb not null default '[]'::jsonb;

alter table public.blog_posts
  drop constraint if exists blog_posts_blocks_is_array;

alter table public.blog_posts
  add constraint blog_posts_blocks_is_array check (jsonb_typeof(blocks) = 'array');
