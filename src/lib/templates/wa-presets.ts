import { extractTemplateVariables } from "@/src/lib/templates/render";

export type WaTemplatePreset = {
  name: string;
  category: string;
  description: string;
  bodyTemplate: string;
  providerTemplateKey?: string | null;
  languageCode?: string;
  isActive?: boolean;
  sampleVariables?: Record<string, string>;
};

export const defaultWaTemplateSampleVariables: Record<string, string> = {
  name: "Bapak/Ibu Andi",
  full_name: "Bapak/Ibu Andi Wijaya",
  student_name: "Alya Putri",
  nick_name: "Alya",
  parent: "Bapak Andi",
  telephone: "+6281234567890",
  email: "andi@example.com",
  due_date: "05 April 2026",
  due_day: "Senin",
  premium_amount: "Rp 1.250.000",
  policy_number: "POL-2026-001",
  policy_name: "Proteksi Keluarga Prima",
  child_name: "Alya Putri",
  child_age: "9",
  spouse_name: "Ibu Rina",
  anniversary_year: "12",
  week_label: "minggu ini",
  activity: "prospecting dan follow up nasabah",
  obstacle: "prospek masih menunda keputusan",
  target_value: "3 closing baru",
  schedule_time: "besok pukul 10.00 WIB",
  agent_name: "Ahyar",
  company_name: "Tim Solusi Aman",
};

export const recommendedWaTemplatePresets: WaTemplatePreset[] = [
  {
    name: "auto_reminder_bayar_premi",
    category: "Nasabah",
    description: "Pengingat jatuh tempo pembayaran premi yang sopan dan jelas.",
    bodyTemplate:
      "Halo {{name}}, kami ingatkan dengan sopan bahwa pembayaran premi untuk polis {{policy_name}} dengan nomor {{policy_number}} akan jatuh tempo pada {{due_day}}, {{due_date}} sebesar {{premium_amount}}. Bila sudah dilakukan, abaikan pesan ini. Bila berkenan, saya siap bantu bila ada yang ingin ditanyakan. Salam hangat, {{agent_name}} - {{company_name}}.",
  },
  {
    name: "ucapan_ulang_tahun_nasabah",
    category: "Nasabah",
    description: "Ucapan ulang tahun untuk nasabah agar hubungan tetap hangat.",
    bodyTemplate:
      "Halo {{name}}, selamat ulang tahun. Semoga selalu sehat, panjang umur, penuh kebahagiaan, dan semua rencana baik dilancarkan. Terima kasih sudah mempercayakan perlindungan Anda bersama kami. Salam hangat, {{agent_name}} - {{company_name}}.",
  },
  {
    name: "ucapan_ulang_tahun_anak",
    category: "Nasabah",
    description: "Ucapan ulang tahun untuk anak nasabah dengan nada hangat.",
    bodyTemplate:
      "Halo {{parent}}, selamat ulang tahun untuk ananda {{child_name}}. Semoga tumbuh sehat, ceria, pintar, dan menjadi kebanggaan keluarga. Semoga hari ini penuh kebahagiaan untuk seluruh keluarga. Salam hangat dari {{agent_name}} - {{company_name}}.",
  },
  {
    name: "ucapan_wedding_anniversary",
    category: "Nasabah",
    description: "Ucapan anniversary pernikahan yang elegan dan personal.",
    bodyTemplate:
      "Halo {{name}} dan {{spouse_name}}, selamat wedding anniversary yang ke-{{anniversary_year}}. Semoga rumah tangga selalu diberi kebahagiaan, kesehatan, ketenangan, dan keberkahan. Terima kasih atas kepercayaannya. Salam hangat, {{agent_name}} - {{company_name}}.",
  },
  {
    name: "say_hallo_weekly",
    category: "Nasabah",
    description: "Sapaan mingguan ringan untuk menjaga hubungan tetap hidup.",
    bodyTemplate:
      "Halo {{name}}, saya hanya ingin menyapa di {{week_label}} ini. Semoga aktivitas hari-harinya lancar, sehat, dan penuh semangat. Bila ada hal yang ingin ditanyakan terkait perlindungan atau polis, saya siap bantu dengan senang hati. Salam hangat, {{agent_name}}.",
  },
  {
    name: "be_tanya_kabar_basabasi",
    category: "Business Partner",
    description: "Sapaan santai untuk business partner tanpa terasa jualan.",
    bodyTemplate:
      "Halo {{name}}, semoga kabarnya baik dan aktivitas hari ini lancar ya. Saya cuma mau say hello dan jaga silaturahmi. Kalau ada waktu senggang, senang sekali rasanya bisa ngobrol ringan. Salam hangat, {{agent_name}}.",
  },
  {
    name: "be_tanya_aktivitas",
    category: "Business Partner",
    description: "Template tanya aktivitas business partner minggu ini.",
    bodyTemplate:
      "Halo {{name}}, minggu ini lagi fokus di aktivitas apa? Semoga semua agenda, meeting, dan targetnya berjalan mulus ya. Kalau ada yang bisa saya bantu support dari sisi komunikasi atau follow up, kabari saja. Salam hangat, {{agent_name}}.",
  },
  {
    name: "be_tanya_kendala_prospek",
    category: "Business Partner",
    description: "Template untuk menggali kendala prospek dengan nada suportif.",
    bodyTemplate:
      "Halo {{name}}, saya mau cek sebentar, apakah ada kendala di prospek belakangan ini? Misalnya calon nasabah masih menunda, belum merespons, atau butuh materi bantu closing. Kalau ada, kabari ya, siapa tahu saya bisa bantu siapkan angle follow up yang lebih enak. Salam, {{agent_name}}.",
  },
  {
    name: "be_follow_up_janji",
    category: "Business Partner",
    description: "Template follow up janji ngobrol atau review pipeline.",
    bodyTemplate:
      "Halo {{name}}, izin follow up ya. Kalau berkenan, kita bisa sambung obrolan singkat {{schedule_time}} untuk bahas update prospek, kebutuhan closing support, atau ide follow up yang sedang kamu jalankan. Kalau waktunya kurang pas, boleh usulkan jam lain. Salam, {{agent_name}}.",
  },
  {
    name: "be_semangat_target_mingguan",
    category: "Business Partner",
    description: "Template penyemangat target mingguan untuk partner.",
    bodyTemplate:
      "Halo {{name}}, semangat untuk target {{week_label}} ini ya. Semoga langkah-langkah kecil hari ini mendekatkan ke hasil besar yang kamu incar, termasuk target {{target_value}}. Kalau butuh teman brainstorming follow up, saya siap. Salam hangat, {{agent_name}}.",
  },
];

export function getWaPresetPreviewVariables(preset?: Partial<WaTemplatePreset> | null) {
  return {
    ...defaultWaTemplateSampleVariables,
    ...(preset?.sampleVariables ?? {}),
  };
}

export function toWaTemplateRecord(preset: WaTemplatePreset) {
  return {
    name: preset.name,
    category: preset.category,
    body_template: preset.bodyTemplate,
    provider: "meta_cloud_api",
    provider_template_key: preset.providerTemplateKey ?? null,
    language_code: preset.languageCode ?? "id",
    variables: extractTemplateVariables(preset.bodyTemplate),
    is_active: preset.isActive ?? true,
  };
}
