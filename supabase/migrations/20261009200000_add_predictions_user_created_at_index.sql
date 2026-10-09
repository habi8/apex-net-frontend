create index if not exists predictions_user_id_created_at_idx
  on public.predictions (user_id, created_at desc);
