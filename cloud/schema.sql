-- Gather cloud sync. Clients reach this table through the Neon Data API with the
-- signed-in user's JWT: row-level security is the only thing separating accounts.
create extension if not exists pg_session_jwt;

do $$ begin
  if not exists (select from pg_roles where rolname = 'authenticated') then create role authenticated nologin; end if;
end $$;

create or replace function public.gather_uid() returns text language plpgsql stable as $$
declare uid text;
begin
  uid := nullif(current_setting('request.jwt.claims', true), '')::json ->> 'sub';
  if uid is not null then return uid; end if;
  begin
    return auth.user_id();
  exception when others then
    return null;
  end;
end $$;

create table if not exists public.gather_items (
  user_id    text not null default public.gather_uid(),
  space_id   text not null,
  collection text not null,
  item_id    text not null,
  payload    jsonb,
  deleted    boolean not null default false,
  updated_at timestamptz not null default clock_timestamp(),
  primary key (user_id, space_id, collection, item_id),
  -- Keeps one account from exhausting the shared free-tier storage.
  constraint gather_items_payload_size check (pg_column_size(payload) <= 512 * 1024)
);
create index if not exists gather_items_user_updated on public.gather_items (user_id, updated_at);

-- The server clock orders changes, so a wrong clock on a device cannot lose data.
create or replace function public.gather_touch() returns trigger language plpgsql as $$
begin
  new.updated_at := clock_timestamp();
  return new;
end $$;
drop trigger if exists gather_items_touch on public.gather_items;
create trigger gather_items_touch before insert or update on public.gather_items
  for each row execute function public.gather_touch();

alter table public.gather_items enable row level security;
alter table public.gather_items force row level security;
drop policy if exists gather_items_owner on public.gather_items;
create policy gather_items_owner on public.gather_items for all
  using (user_id = public.gather_uid())
  with check (user_id = public.gather_uid());

revoke all on public.gather_items from public;
grant usage on schema public to authenticated;
grant select, insert, update, delete on public.gather_items to authenticated;
grant execute on function public.gather_uid() to authenticated;
do $$ begin
  if exists (select from pg_roles where rolname = 'token_roles') then
    grant select, insert, update, delete on public.gather_items to token_roles;
    grant execute on function public.gather_uid() to token_roles;
  end if;
end $$;
