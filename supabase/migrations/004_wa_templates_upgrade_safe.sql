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

alter table if exists public.wa_templates add column if not exists provider text;
alter table if exists public.wa_templates add column if not exists provider_template_key text;
alter table if exists public.wa_templates add column if not exists language_code text;
alter table if exists public.wa_templates add column if not exists category text;
alter table if exists public.wa_templates add column if not exists body_template text;
alter table if exists public.wa_templates add column if not exists variables jsonb not null default '[]'::jsonb;
alter table if exists public.wa_templates add column if not exists is_active boolean not null default true;
alter table if exists public.wa_templates add column if not exists created_at timestamptz not null default now();
alter table if exists public.wa_templates add column if not exists updated_at timestamptz not null default now();

update public.wa_templates set provider = coalesce(provider, 'meta_cloud_api') where provider is null;
update public.wa_templates set language_code = coalesce(language_code, 'id') where language_code is null;
update public.wa_templates set variables = '[]'::jsonb where variables is null;
update public.wa_templates set is_active = true where is_active is null;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'wa_templates'
      AND column_name = 'meta_template_name'
  ) THEN
    EXECUTE '
      UPDATE public.wa_templates
      SET provider_template_key = meta_template_name
      WHERE provider_template_key IS NULL
        AND meta_template_name IS NOT NULL
    ';
  END IF;
END $$;

drop trigger if exists trg_wa_templates_updated_at on public.wa_templates;
create trigger trg_wa_templates_updated_at
before update on public.wa_templates
for each row execute procedure public.set_updated_at();
