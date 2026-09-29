-- Public listing photos only. Never upload identity or ownership documents here.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('listing-photos', 'listing-photos', true, 5242880,
        array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set
  public = true,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "Landowners upload their listing photos"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'listing-photos'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and exists (select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.role = 'landowner')
);

create policy "Public can read listing photos"
on storage.objects for select to anon, authenticated
using (bucket_id = 'listing-photos');

create policy "Owners can delete listing photos"
on storage.objects for delete to authenticated
using (
  bucket_id = 'listing-photos'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);
