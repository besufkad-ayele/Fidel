-- Public lesson/vocab audio buckets for reliable browser playback.
-- Applied remotely as vocab_and_lesson_media_buckets.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  (
    'vocab-audio',
    'vocab-audio',
    true,
    10485760,
    array['audio/mpeg','audio/mp4','audio/wav','audio/webm','audio/ogg','audio/x-m4a','audio/aac']
  ),
  (
    'lesson-media',
    'lesson-media',
    true,
    104857600,
    array[
      'audio/mpeg','audio/mp4','audio/wav','audio/webm','audio/ogg','audio/x-m4a','audio/aac',
      'video/mp4','video/webm',
      'image/jpeg','image/png','image/webp'
    ]
  )
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists vocab_audio_public_read on storage.objects;
create policy vocab_audio_public_read on storage.objects for select
  using (bucket_id = 'vocab-audio');

drop policy if exists lesson_media_public_read on storage.objects;
create policy lesson_media_public_read on storage.objects for select
  using (bucket_id = 'lesson-media');

drop policy if exists vocab_audio_staff_write on storage.objects;
create policy vocab_audio_staff_write on storage.objects for insert
  with check (
    bucket_id = 'vocab-audio'
    and coalesce((auth.jwt() -> 'app_metadata' ->> 'role'), '') in ('admin', 'teacher')
  );

drop policy if exists lesson_media_staff_write on storage.objects;
create policy lesson_media_staff_write on storage.objects for insert
  with check (
    bucket_id = 'lesson-media'
    and coalesce((auth.jwt() -> 'app_metadata' ->> 'role'), '') in ('admin', 'teacher')
  );

drop policy if exists vocab_audio_staff_update on storage.objects;
create policy vocab_audio_staff_update on storage.objects for update
  using (
    bucket_id = 'vocab-audio'
    and coalesce((auth.jwt() -> 'app_metadata' ->> 'role'), '') in ('admin', 'teacher')
  );

drop policy if exists lesson_media_staff_update on storage.objects;
create policy lesson_media_staff_update on storage.objects for update
  using (
    bucket_id = 'lesson-media'
    and coalesce((auth.jwt() -> 'app_metadata' ->> 'role'), '') in ('admin', 'teacher')
  );

drop policy if exists vocab_audio_staff_delete on storage.objects;
create policy vocab_audio_staff_delete on storage.objects for delete
  using (
    bucket_id = 'vocab-audio'
    and coalesce((auth.jwt() -> 'app_metadata' ->> 'role'), '') in ('admin', 'teacher')
  );

drop policy if exists lesson_media_staff_delete on storage.objects;
create policy lesson_media_staff_delete on storage.objects for delete
  using (
    bucket_id = 'lesson-media'
    and coalesce((auth.jwt() -> 'app_metadata' ->> 'role'), '') in ('admin', 'teacher')
  );
