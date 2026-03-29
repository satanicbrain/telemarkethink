create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text not null default 'operator' check (role in ('admin', 'operator')),
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', new.email))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

create table if not exists public.contacts (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  phone_e164 text,
  email text,
  birth_date date,
  city text,
  product_interest text,
  source text,
  tags text[] not null default '{}',
  notes text,
  consent_whatsapp boolean not null default false,
  consent_email boolean not null default false,
  opt_out_whatsapp boolean not null default false,
  opt_out_email boolean not null default false,
  last_contacted_at timestamptz,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_contacts_phone on public.contacts (phone_e164);
create index if not exists idx_contacts_email on public.contacts (email);
create index if not exists idx_contacts_birth_date on public.contacts (birth_date);

create table if not exists public.wa_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  provider text not null default 'meta_cloud_api',
  provider_template_key text,
  language_code text default 'id',
  category text,
  body_template text not null,
  variables jsonb not null default '[]'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.email_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  subject_template text not null,
  html_template text not null,
  variables jsonb not null default '[]'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.automations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  channel text not null check (channel in ('whatsapp', 'email')),
  trigger_type text not null check (trigger_type in ('birthday', 'follow_up', 'cron')),
  wa_template_id uuid references public.wa_templates(id) on delete set null,
  email_template_id uuid references public.email_templates(id) on delete set null,
  delay_days integer,
  cron_expr text,
  filters jsonb not null default '{}'::jsonb,
  quiet_hours jsonb not null default '{"start":"20:00","end":"08:00"}'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.provider_settings (
  channel text primary key check (channel in ('whatsapp', 'email')),
  provider text not null,
  public_config jsonb not null default '{}'::jsonb,
  secret_payload_encrypted text,
  updated_by uuid references public.profiles(id),
  updated_at timestamptz not null default now()
);

create table if not exists public.message_queue (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid references public.contacts(id) on delete cascade,
  automation_id uuid references public.automations(id) on delete set null,
  channel text not null check (channel in ('whatsapp', 'email')),
  provider text not null,
  payload jsonb not null default '{}'::jsonb,
  run_at timestamptz not null,
  status text not null default 'queued'
    check (status in ('queued', 'processing', 'sent', 'delivered', 'read', 'failed', 'skipped')),
  attempts integer not null default 0,
  error_message text,
  requested_by uuid references public.profiles(id),
  provider_message_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.message_logs (
  id uuid primary key default gen_random_uuid(),
  queue_id uuid references public.message_queue(id) on delete set null,
  contact_id uuid references public.contacts(id) on delete set null,
  channel text not null check (channel in ('whatsapp', 'email')),
  provider text not null,
  provider_message_id text,
  direction text not null default 'outbound' check (direction in ('outbound', 'inbound')),
  status text not null,
  subject text,
  body_preview text,
  provider_response jsonb,
  error_message text,
  sent_at timestamptz,
  delivered_at timestamptz,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.webhook_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  event_type text not null,
  payload jsonb not null,
  signature_valid boolean,
  received_at timestamptz not null default now()
);

drop trigger if exists trg_contacts_updated_at on public.contacts;
create trigger trg_contacts_updated_at before update on public.contacts for each row execute procedure public.set_updated_at();
drop trigger if exists trg_wa_templates_updated_at on public.wa_templates;
create trigger trg_wa_templates_updated_at before update on public.wa_templates for each row execute procedure public.set_updated_at();
drop trigger if exists trg_email_templates_updated_at on public.email_templates;
create trigger trg_email_templates_updated_at before update on public.email_templates for each row execute procedure public.set_updated_at();
drop trigger if exists trg_automations_updated_at on public.automations;
create trigger trg_automations_updated_at before update on public.automations for each row execute procedure public.set_updated_at();
drop trigger if exists trg_provider_settings_updated_at on public.provider_settings;
create trigger trg_provider_settings_updated_at before update on public.provider_settings for each row execute procedure public.set_updated_at();
drop trigger if exists trg_message_queue_updated_at on public.message_queue;
create trigger trg_message_queue_updated_at before update on public.message_queue for each row execute procedure public.set_updated_at();

create or replace function public.current_user_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid()
$$;

alter table public.profiles enable row level security;
alter table public.contacts enable row level security;
alter table public.wa_templates enable row level security;
alter table public.email_templates enable row level security;
alter table public.automations enable row level security;
alter table public.provider_settings enable row level security;
alter table public.message_queue enable row level security;
alter table public.message_logs enable row level security;
alter table public.webhook_events enable row level security;

create policy "profiles select self" on public.profiles
for select to authenticated
using (id = auth.uid() or public.current_user_role() = 'admin');

create policy "contacts select by staff" on public.contacts
for select to authenticated
using (public.current_user_role() in ('admin', 'operator'));

create policy "contacts modify by staff" on public.contacts
for all to authenticated
using (public.current_user_role() in ('admin', 'operator'))
with check (public.current_user_role() in ('admin', 'operator'));

create policy "wa templates read by staff" on public.wa_templates
for select to authenticated
using (public.current_user_role() in ('admin', 'operator'));

create policy "wa templates modify by admin" on public.wa_templates
for all to authenticated
using (public.current_user_role() = 'admin')
with check (public.current_user_role() = 'admin');

create policy "email templates read by staff" on public.email_templates
for select to authenticated
using (public.current_user_role() in ('admin', 'operator'));

create policy "email templates modify by admin" on public.email_templates
for all to authenticated
using (public.current_user_role() = 'admin')
with check (public.current_user_role() = 'admin');

create policy "automations read by staff" on public.automations
for select to authenticated
using (public.current_user_role() in ('admin', 'operator'));

create policy "automations modify by admin" on public.automations
for all to authenticated
using (public.current_user_role() = 'admin')
with check (public.current_user_role() = 'admin');

create policy "provider settings read by staff" on public.provider_settings
for select to authenticated
using (public.current_user_role() in ('admin', 'operator'));

create policy "provider settings modify by admin" on public.provider_settings
for all to authenticated
using (public.current_user_role() = 'admin')
with check (public.current_user_role() = 'admin');

create policy "message queue read by staff" on public.message_queue
for select to authenticated
using (public.current_user_role() in ('admin', 'operator'));

create policy "message queue modify by staff" on public.message_queue
for all to authenticated
using (public.current_user_role() in ('admin', 'operator'))
with check (public.current_user_role() in ('admin', 'operator'));

create policy "message logs read by staff" on public.message_logs
for select to authenticated
using (public.current_user_role() in ('admin', 'operator'));

create policy "message logs insert by staff" on public.message_logs
for insert to authenticated
with check (public.current_user_role() in ('admin', 'operator'));

create policy "webhook events read by admin" on public.webhook_events
for select to authenticated
using (public.current_user_role() = 'admin');

insert into public.provider_settings (channel, provider, public_config)
values
  ('whatsapp', 'meta_cloud_api', '{"graphApiVersion":"v23.0"}'::jsonb),
  ('email', 'resend', '{}'::jsonb)
on conflict (channel) do nothing;
