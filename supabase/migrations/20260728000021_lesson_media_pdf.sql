-- Allow homework assignment worksheets (PDF) in lesson-media.

update storage.buckets
set allowed_mime_types = array[
  'audio/mpeg','audio/mp4','audio/wav','audio/webm','audio/ogg','audio/x-m4a','audio/aac',
  'video/mp4','video/webm',
  'image/jpeg','image/png','image/webp','image/gif',
  'application/pdf'
]
where id = 'lesson-media';
