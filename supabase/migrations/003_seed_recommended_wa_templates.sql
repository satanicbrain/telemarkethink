alter table if exists public.wa_templates
  add column if not exists provider text not null default 'meta_cloud_api';

alter table if exists public.wa_templates
  add column if not exists provider_template_key text;

alter table if exists public.wa_templates
  add column if not exists language_code text default 'id';

alter table if exists public.wa_templates
  add column if not exists category text;

alter table if exists public.wa_templates
  add column if not exists variables jsonb not null default '[]'::jsonb;

alter table if exists public.wa_templates
  add column if not exists is_active boolean not null default true;

alter table if exists public.wa_templates
  add column if not exists updated_at timestamptz not null default now();

insert into public.wa_templates (
  name,
  provider,
  provider_template_key,
  language_code,
  category,
  body_template,
  variables,
  is_active
)
values
  (
    'auto_reminder_bayar_premi',
    'meta_cloud_api',
    null,
    'id',
    'Nasabah',
    'Halo {{name}}, kami ingatkan dengan sopan bahwa pembayaran premi untuk polis {{policy_name}} dengan nomor {{policy_number}} akan jatuh tempo pada {{due_day}}, {{due_date}} sebesar {{premium_amount}}. Bila sudah dilakukan, abaikan pesan ini. Bila berkenan, saya siap bantu bila ada yang ingin ditanyakan. Salam hangat, {{agent_name}} - {{company_name}}.',
    '["name","policy_name","policy_number","due_day","due_date","premium_amount","agent_name","company_name"]'::jsonb,
    true
  ),
  (
    'ucapan_ulang_tahun_nasabah',
    'meta_cloud_api',
    null,
    'id',
    'Nasabah',
    'Halo {{name}}, selamat ulang tahun. Semoga selalu sehat, panjang umur, penuh kebahagiaan, dan semua rencana baik dilancarkan. Terima kasih sudah mempercayakan perlindungan Anda bersama kami. Salam hangat, {{agent_name}} - {{company_name}}.',
    '["name","agent_name","company_name"]'::jsonb,
    true
  ),
  (
    'ucapan_ulang_tahun_anak',
    'meta_cloud_api',
    null,
    'id',
    'Nasabah',
    'Halo {{parent}}, selamat ulang tahun untuk ananda {{child_name}}. Semoga tumbuh sehat, ceria, pintar, dan menjadi kebanggaan keluarga. Semoga hari ini penuh kebahagiaan untuk seluruh keluarga. Salam hangat dari {{agent_name}} - {{company_name}}.',
    '["parent","child_name","agent_name","company_name"]'::jsonb,
    true
  ),
  (
    'ucapan_wedding_anniversary',
    'meta_cloud_api',
    null,
    'id',
    'Nasabah',
    'Halo {{name}} dan {{spouse_name}}, selamat wedding anniversary yang ke-{{anniversary_year}}. Semoga rumah tangga selalu diberi kebahagiaan, kesehatan, ketenangan, dan keberkahan. Terima kasih atas kepercayaannya. Salam hangat, {{agent_name}} - {{company_name}}.',
    '["name","spouse_name","anniversary_year","agent_name","company_name"]'::jsonb,
    true
  ),
  (
    'say_hallo_weekly',
    'meta_cloud_api',
    null,
    'id',
    'Nasabah',
    'Halo {{name}}, saya hanya ingin menyapa di {{week_label}} ini. Semoga aktivitas hari-harinya lancar, sehat, dan penuh semangat. Bila ada hal yang ingin ditanyakan terkait perlindungan atau polis, saya siap bantu dengan senang hati. Salam hangat, {{agent_name}}.',
    '["name","week_label","agent_name"]'::jsonb,
    true
  ),
  (
    'be_tanya_kabar_basabasi',
    'meta_cloud_api',
    null,
    'id',
    'Business Partner',
    'Halo {{name}}, semoga kabarnya baik dan aktivitas hari ini lancar ya. Saya cuma mau say hello dan jaga silaturahmi. Kalau ada waktu senggang, senang sekali rasanya bisa ngobrol ringan. Salam hangat, {{agent_name}}.',
    '["name","agent_name"]'::jsonb,
    true
  ),
  (
    'be_tanya_aktivitas',
    'meta_cloud_api',
    null,
    'id',
    'Business Partner',
    'Halo {{name}}, minggu ini lagi fokus di aktivitas apa? Semoga semua agenda, meeting, dan targetnya berjalan mulus ya. Kalau ada yang bisa saya bantu support dari sisi komunikasi atau follow up, kabari saja. Salam hangat, {{agent_name}}.',
    '["name","agent_name"]'::jsonb,
    true
  ),
  (
    'be_tanya_kendala_prospek',
    'meta_cloud_api',
    null,
    'id',
    'Business Partner',
    'Halo {{name}}, saya mau cek sebentar, apakah ada kendala di prospek belakangan ini? Misalnya calon nasabah masih menunda, belum merespons, atau butuh materi bantu closing. Kalau ada, kabari ya, siapa tahu saya bisa bantu siapkan angle follow up yang lebih enak. Salam, {{agent_name}}.',
    '["name","agent_name"]'::jsonb,
    true
  ),
  (
    'be_follow_up_janji',
    'meta_cloud_api',
    null,
    'id',
    'Business Partner',
    'Halo {{name}}, izin follow up ya. Kalau berkenan, kita bisa sambung obrolan singkat {{schedule_time}} untuk bahas update prospek, kebutuhan closing support, atau ide follow up yang sedang kamu jalankan. Kalau waktunya kurang pas, boleh usulkan jam lain. Salam, {{agent_name}}.',
    '["name","schedule_time","agent_name"]'::jsonb,
    true
  ),
  (
    'be_semangat_target_mingguan',
    'meta_cloud_api',
    null,
    'id',
    'Business Partner',
    'Halo {{name}}, semangat untuk target {{week_label}} ini ya. Semoga langkah-langkah kecil hari ini mendekatkan ke hasil besar yang kamu incar, termasuk target {{target_value}}. Kalau butuh teman brainstorming follow up, saya siap. Salam hangat, {{agent_name}}.',
    '["name","week_label","target_value","agent_name"]'::jsonb,
    true
  )
on conflict (name) do update set
  provider = excluded.provider,
  provider_template_key = excluded.provider_template_key,
  language_code = excluded.language_code,
  category = excluded.category,
  body_template = excluded.body_template,
  variables = excluded.variables,
  is_active = excluded.is_active,
  updated_at = now();
