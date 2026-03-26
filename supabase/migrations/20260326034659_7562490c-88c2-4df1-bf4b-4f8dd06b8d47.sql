insert into storage.buckets (id, name, public)
select 'note-images', 'note-images', false
where not exists (
  select 1 from storage.buckets where id = 'note-images'
);

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Users can view their own note images'
  ) then
    create policy "Users can view their own note images"
    on storage.objects
    for select
    to authenticated
    using (
      bucket_id = 'note-images'
      and (storage.foldername(name))[1] = auth.uid()::text
    );
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Users can upload their own note images'
  ) then
    create policy "Users can upload their own note images"
    on storage.objects
    for insert
    to authenticated
    with check (
      bucket_id = 'note-images'
      and (storage.foldername(name))[1] = auth.uid()::text
    );
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Users can update their own note images'
  ) then
    create policy "Users can update their own note images"
    on storage.objects
    for update
    to authenticated
    using (
      bucket_id = 'note-images'
      and (storage.foldername(name))[1] = auth.uid()::text
    )
    with check (
      bucket_id = 'note-images'
      and (storage.foldername(name))[1] = auth.uid()::text
    );
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Users can delete their own note images'
  ) then
    create policy "Users can delete their own note images"
    on storage.objects
    for delete
    to authenticated
    using (
      bucket_id = 'note-images'
      and (storage.foldername(name))[1] = auth.uid()::text
    );
  end if;
end $$;