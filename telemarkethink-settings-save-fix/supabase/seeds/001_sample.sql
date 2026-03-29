insert into public.contacts (
  full_name,
  phone_e164,
  email,
  birth_date,
  city,
  product_interest,
  consent_whatsapp,
  consent_email
)
values
  ('Budi Santoso', '+628111111111', 'budi@example.com', '1990-04-03', 'Jakarta', 'Asuransi Jiwa', true, true),
  ('Siti Aminah', '+628122222222', 'siti@example.com', '1988-10-15', 'Bekasi', 'Asuransi Kesehatan', true, true)
on conflict do nothing;

insert into public.wa_templates (
  name,
  provider,
  body_template,
  provider_template_key,
  language_code,
  variables
)
values
  (
    'birthday_basic',
    'meta_cloud_api',
    'Halo {{name}}, selamat ulang tahun. Semoga sehat, bahagia, dan penuh berkah. Salam hangat dari tim kami.',
    null,
    'id',
    '["name"]'::jsonb
  ),
  (
    'follow_up_basic',
    'meta_cloud_api',
    'Halo {{name}}, saya follow up kembali terkait kebutuhan {{product_interest}}. Bila berkenan, saya siap bantu jelaskan dengan singkat dan jelas.',
    null,
    'id',
    '["name","product_interest"]'::jsonb
  )
on conflict (name) do nothing;

insert into public.email_templates (
  name,
  subject_template,
  html_template,
  variables
)
values
  (
    'follow_up_email_basic',
    'Halo {{name}}, follow up kebutuhan proteksi Anda',
    '<p>Halo {{name}},</p><p>Saya follow up kembali terkait kebutuhan <strong>{{product_interest}}</strong>. Bila berkenan, saya siap bantu dengan penjelasan yang ringkas dan jelas.</p>',
    '["name","product_interest"]'::jsonb
  )
on conflict (name) do nothing;

insert into public.automations (
  name,
  channel,
  trigger_type,
  delay_days,
  is_active
)
values
  ('Birthday WhatsApp', 'whatsapp', 'birthday', 0, true),
  ('Follow Up WhatsApp 7 Hari', 'whatsapp', 'follow_up', 7, false),
  ('Follow Up Email 7 Hari', 'email', 'follow_up', 7, false)
on conflict do nothing;
