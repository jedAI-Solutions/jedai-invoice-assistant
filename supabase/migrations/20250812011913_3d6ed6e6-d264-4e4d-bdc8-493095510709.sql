-- Policy: allow authenticated users to read (create signed URLs) for exports files of their assigned mandants
-- This grants SELECT on storage.objects limited to keys that match the user's mandant_nr
create policy if not exists "Allow read of exports for assigned mandants"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'exports'
  and exists (
    select 1
    from public.mandants m
    join public.user_mandant_assignments uma on uma.mandant_id = m.id
    where uma.user_id = auth.uid()
      and uma.is_active = true
      and (
        name like m.mandant_nr || '/%'
        or name like 'exports/' || m.mandant_nr || '/%'
      )
  )
);
