
-- 1) Storage-Bucket "exports" anlegen (privat)
insert into storage.buckets (id, name, public)
values ('exports', 'exports', false)
on conflict (id) do nothing;

-- 2) RLS-Policies für storage.objects im Bucket "exports"
-- Vollzugriff für Service Role (z. B. n8n mit SERVICE_ROLE_KEY)
create policy "exports_service_role_full_access"
on storage.objects
as permissive
for all
to public
using (auth.role() = 'service_role' and bucket_id = 'exports')
with check (auth.role() = 'service_role' and bucket_id = 'exports');

-- Download-Recht für zugewiesene Benutzer:
-- Die erste Pfadkomponente (split_part(name,'/',1)) ist die mandant_nr
create policy "exports_read_for_assigned_users"
on storage.objects
as permissive
for select
to authenticated
using (
  bucket_id = 'exports'
  and split_part(name, '/', 1) in (
    select m.mandant_nr
    from user_mandant_assignments uma
    join mandants m on m.id = uma.mandant_id
    where uma.user_id = auth.uid()
      and uma.is_active = true
  )
);

-- 3) dtvf_export_batches um Storage-Metadaten erweitern
alter table public.dtvf_export_batches
  add column if not exists storage_path text,             -- z. B. '12345/DTvF_2025-08_Batch-0001.zip'
  add column if not exists mime_type text,                -- z. B. 'application/zip' oder 'text/plain'
  add column if not exists storage_uploaded_at timestamptz;  -- Zeitpunkt des Uploads

