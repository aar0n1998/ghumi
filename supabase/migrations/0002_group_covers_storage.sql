-- ============================================================================
-- Storage bucket for group cover images.
--
-- Public-read on purpose: the pre-join preview screen shows the cover to
-- someone who is not a member yet, so a signed URL would need a second
-- privileged round trip before they have any access at all.
--
-- Objects are keyed `<uploader-uid>/<random>.jpg`. Writing is scoped to your
-- own folder, which lets the create-group screen upload the image *before*
-- the group row exists — there is no group id to key on yet at that point.
-- ============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'group-covers',
  'group-covers',
  true,
  5242880, -- 5 MB
  array['image/jpeg', 'image/png', 'image/webp', 'image/heic']
)
on conflict (id) do update
  set public             = excluded.public,
      file_size_limit    = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "group covers are publicly readable" on storage.objects;
create policy "group covers are publicly readable"
  on storage.objects for select
  using (bucket_id = 'group-covers');

drop policy if exists "you can upload a cover into your own folder" on storage.objects;
create policy "you can upload a cover into your own folder"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'group-covers'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "you can replace your own cover" on storage.objects;
create policy "you can replace your own cover"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'group-covers'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "you can delete your own cover" on storage.objects;
create policy "you can delete your own cover"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'group-covers'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
