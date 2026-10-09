create index if not exists predictions_user_created_id_idx
  on public.predictions (user_id, created_at desc, id desc);
