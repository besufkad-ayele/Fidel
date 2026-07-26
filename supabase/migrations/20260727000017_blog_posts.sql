-- Blog CMS: posts, public blog storage bucket, RLS.

create table if not exists public.blog_posts (
  id              uuid primary key default gen_random_uuid(),
  slug            text not null unique,
  title           text not null,
  excerpt         text,
  body_md         text not null default '',
  cover_path      text,
  cover_alt       text,
  video_url       text,
  video_path      text,
  video_caption   text,
  gallery         jsonb not null default '[]'::jsonb,
  reference_links jsonb not null default '[]'::jsonb,
  blocks          jsonb not null default '[]'::jsonb,
  author_id       uuid references public.profiles(id) on delete set null,
  tags            text[] not null default '{}',
  status          publish_status not null default 'draft',
  published_at    timestamptz,
  seo_title       text,
  seo_description text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint blog_posts_gallery_is_array check (jsonb_typeof(gallery) = 'array'),
  constraint blog_posts_reference_links_is_array check (jsonb_typeof(reference_links) = 'array'),
  constraint blog_posts_blocks_is_array check (jsonb_typeof(blocks) = 'array')
);

create index if not exists blog_posts_status_published_at_idx
  on public.blog_posts (status, published_at desc);

create index if not exists blog_posts_tags_idx
  on public.blog_posts using gin (tags);

drop trigger if exists blog_posts_touch_updated_at on public.blog_posts;
create trigger blog_posts_touch_updated_at
  before update on public.blog_posts
  for each row execute function fidel.touch_updated_at();

alter table public.blog_posts enable row level security;

drop policy if exists blog_select_published on public.blog_posts;
create policy blog_select_published on public.blog_posts for select
  using (status = 'published' or fidel.is_admin());

drop policy if exists blog_admin_write on public.blog_posts;
create policy blog_admin_write on public.blog_posts for all
  using (fidel.is_admin())
  with check (fidel.is_admin());

-- Public marketing media (covers, gallery images, short videos).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'blog',
  'blog',
  true,
  52428800,
  array[
    'image/jpeg',
    'image/png',
    'image/webp',
    'video/mp4',
    'video/webm'
  ]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists blog_public_read on storage.objects;
create policy blog_public_read on storage.objects for select
  using (bucket_id = 'blog');

drop policy if exists blog_admin_write on storage.objects;
create policy blog_admin_write on storage.objects for all
  using (bucket_id = 'blog' and fidel.is_admin())
  with check (bucket_id = 'blog' and fidel.is_admin());
