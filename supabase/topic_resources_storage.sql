insert into storage.buckets (id, name, public)
values ('topic-resources', 'topic-resources', true)
on conflict (id) do nothing;

create policy "Users can upload own topic resources"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'topic-resources'
  and auth.uid()::text = (storage.foldername(name))[1]
);

create policy "Users can read own topic resources"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'topic-resources'
  and auth.uid()::text = (storage.foldername(name))[1]
);

create policy "Users can delete own topic resources"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'topic-resources'
  and auth.uid()::text = (storage.foldername(name))[1]
);
