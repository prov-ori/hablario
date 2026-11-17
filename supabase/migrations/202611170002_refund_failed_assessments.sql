create function public.reserve_assessment() returns jsonb
language sql volatile security invoker set search_path = '' as $$
  select case when public.claim_assessment() then
    jsonb_build_object('user_id', auth.uid(), 'day', (now() at time zone 'UTC')::date)
  else null end;
$$;
revoke all on function public.reserve_assessment() from public;
grant execute on function public.reserve_assessment() to authenticated;

create function public.refund_assessment(p_user_id uuid, p_day date) returns void
language sql volatile security invoker set search_path = '' as $$
  update public.assessment_usage
  set calls = calls - 1
  where user_id = p_user_id and day = p_day and calls > 0;
$$;
revoke all on function public.refund_assessment(uuid, date) from public, anon, authenticated;
grant select, update on public.assessment_usage to service_role;
grant execute on function public.refund_assessment(uuid, date) to service_role;
