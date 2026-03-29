create table if not exists public.provider_settings (
  channel text primary key check (channel in ('whatsapp', 'email')),
  provider text not null,
  public_config jsonb not null default '{}'::jsonb,
  secret_payload_encrypted text,
  updated_by uuid references public.profiles(id),
  updated_at timestamptz not null default now()
);

alter table if exists public.provider_settings
  add column if not exists provider text;

alter table if exists public.provider_settings
  add column if not exists public_config jsonb not null default '{}'::jsonb;

alter table if exists public.provider_settings
  add column if not exists secret_payload_encrypted text;

alter table if exists public.provider_settings
  add column if not exists updated_by uuid references public.profiles(id);

alter table if exists public.provider_settings
  add column if not exists updated_at timestamptz not null default now();

drop trigger if exists trg_provider_settings_updated_at on public.provider_settings;
create trigger trg_provider_settings_updated_at
before update on public.provider_settings
for each row execute procedure public.set_updated_at();
