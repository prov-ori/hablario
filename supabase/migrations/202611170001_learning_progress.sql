create table public.learning_progress (
  user_id uuid primary key references auth.users(id) on delete cascade,
  snapshot jsonb not null check (jsonb_typeof(snapshot) = 'object' and octet_length(snapshot::text) <= 2000000),
  revision bigint not null default 1
);

alter table public.learning_progress enable row level security;
revoke all on public.learning_progress from anon, authenticated;
grant select, insert, update on public.learning_progress to authenticated;
create policy "Read own progress" on public.learning_progress for select to authenticated using (auth.uid() = user_id);
create policy "Insert own progress" on public.learning_progress for insert to authenticated with check (auth.uid() = user_id);
create policy "Update own progress" on public.learning_progress for update to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table public.assessment_usage (
  user_id uuid references auth.users(id) on delete cascade,
  day date,
  calls integer not null,
  primary key (user_id, day)
);

alter table public.assessment_usage enable row level security;
revoke all on public.assessment_usage from anon, authenticated;

create function public.claim_assessment() returns boolean
language plpgsql security definer set search_path = '' as $$
declare permitted boolean;
begin
  if auth.uid() is null then return false; end if;
  insert into public.assessment_usage as usage (user_id, day, calls)
  values (auth.uid(), (now() at time zone 'UTC')::date, 1)
  on conflict (user_id, day) do update set calls = usage.calls + 1 where usage.calls < 12
  returning true into permitted;
  return coalesce(permitted, false);
end;
$$;
revoke all on function public.claim_assessment() from public;
grant execute on function public.claim_assessment() to authenticated;
