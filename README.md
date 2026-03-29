# TelemarkeTHINK

Starter aplikasi web admin automation komunikasi WA & email untuk bisnis asuransi.

## Fitur inti

- Next.js 16 App Router + TypeScript + Tailwind
- Supabase Auth + Postgres + RLS starter
- Login admin/operator
- Dashboard
- Kontak / prospek
- Template WhatsApp
- Template email
- Automations starter
- Delivery logs
- Provider settings UI
- Email provider default: Resend
- WhatsApp provider selectable dari menu settings:
  - Meta Cloud API
  - Twilio WhatsApp
  - Custom HTTP gateway
- Scheduler starter dengan Vercel Cron
- Webhook endpoint untuk:
  - Meta WhatsApp
  - Twilio WhatsApp
  - Resend

## Cara pakai

1. Isi `.env`
2. Jalankan migration `supabase/migrations/001_init.sql`
3. Buat user di Supabase Auth lalu ubah role jadi admin
4. `npm install && npm run dev`

## Catatan penting

- Ganti provider WhatsApp cukup dari menu **Settings → Providers**
- Secret provider disimpan terenkripsi memakai `APP_ENCRYPTION_KEY`
- Untuk Vercel Hobby, cron hanya boleh harian. Kalau mau automation per menit/jam, pindahkan scheduler ke Supabase pg_cron atau upgrade plan.


## Patch tambahan

- Menu **Kelola User** untuk admin
- Ubah role admin/operator langsung dari dashboard
- Sidebar hanya menampilkan menu user management untuk admin
- Auto-create profile operator jika user auth belum punya row di `public.profiles`
