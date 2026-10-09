alter table public.predictions enable row level security;
alter table public.xray_uploads enable row level security;

drop policy if exists predictions_owner_access
  on public.predictions;
create policy predictions_owner_access
  on public.predictions
  as permissive
  for all
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists predictions_owner_guard
  on public.predictions;
create policy predictions_owner_guard
  on public.predictions
  as restrictive
  for all
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists xray_uploads_owner_access
  on public.xray_uploads;
create policy xray_uploads_owner_access
  on public.xray_uploads
  as permissive
  for all
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists xray_uploads_owner_guard
  on public.xray_uploads;
create policy xray_uploads_owner_guard
  on public.xray_uploads
  as restrictive
  for all
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
