import type { ScenarioRoleplay } from "@/lib/types/roleplay.types";

// "Main peran" data for every scenario in raw/extras.js (VOCAB_SCEN), keyed by
// scenario id. Written once and kept static: the session never generates
// these again. The raw/*.js files stay untouched ("isi data tidak diubah"),
// so this lives beside them and is joined in lib/content/index.ts.
// English goes to the AI; the Indonesian is what the learner reads.
export const SCENARIO_ROLEPLAY: Record<string, ScenarioRoleplay> = {
  intro: {
    roleAi: "Tom, a friendly designer from Manchester you meet at an event",
    roleUser: "a developer from Jakarta at the same event",
    mission:
      "Introduce yourself, find out where Tom is from and what he does, and offer to keep in touch.",
    missionId:
      "Perkenalkan dirimu, cari tahu Tom dari mana dan apa pekerjaannya, lalu ajak tetap berhubungan.",
    steps: [
      { en: "Say your name and greet Tom", id: "Sebut namamu dan sapa Tom" },
      {
        en: "Ask where Tom is from",
        id: "Tanya Tom berasal dari mana",
      },
      {
        en: "Ask what Tom does for work",
        id: "Tanya apa pekerjaan Tom",
      },
      {
        en: "Suggest keeping in touch",
        id: "Ajak tetap berhubungan",
      },
    ],
  },
  order: {
    roleAi: "a cashier at a busy coffee shop",
    roleUser: "a customer ordering at the counter",
    mission: "Order 2 drinks and ask for the total price.",
    missionId: "Pesan 2 minuman dan tanya total harganya.",
    steps: [
      { en: "Order a first drink", id: "Pesan minuman pertama" },
      { en: "Order a second drink", id: "Pesan minuman kedua" },
      { en: "Ask for the total price", id: "Tanya total harganya" },
    ],
  },
  direction: {
    roleAi: "a local person walking on the street",
    roleUser: "a tourist who is lost in the city",
    mission:
      "Politely ask the way to the train station, ask how far it is, and repeat the directions to check.",
    missionId:
      "Tanya jalan ke stasiun kereta dengan sopan, tanya seberapa jauh, lalu ulangi petunjuknya untuk memastikan.",
    steps: [
      {
        en: "Get the person's attention politely",
        id: "Sapa orangnya dengan sopan",
      },
      {
        en: "Ask how to get to the train station",
        id: "Tanya cara ke stasiun kereta",
      },
      { en: "Ask how far it is", id: "Tanya seberapa jauh" },
      {
        en: "Repeat the directions back to check",
        id: "Ulangi petunjuknya untuk memastikan",
      },
    ],
  },
  standup: {
    roleAi: "the team lead running the daily standup",
    roleUser: "a developer on the engineering team",
    mission:
      "Give your standup update: what you did yesterday, what you'll do today, and any blocker.",
    missionId:
      "Sampaikan update standup: yang kamu kerjakan kemarin, rencana hari ini, dan kendala kalau ada.",
    steps: [
      {
        en: "Say what you did yesterday",
        id: "Ceritakan yang dikerjakan kemarin",
      },
      { en: "Say what you will do today", id: "Sebutkan rencana hari ini" },
      {
        en: "Mention a blocker (or say there is none)",
        id: "Sebutkan kendala (atau bilang tidak ada)",
      },
    ],
  },
  smalltalk: {
    roleAi: "a colleague waiting with you for a video call to start",
    roleUser: "a colleague on the same call",
    mission:
      "Make small talk until the meeting starts: ask how they are, ask about their weekend, and share something about yours.",
    missionId:
      "Basa-basi sampai meeting mulai: tanya kabar, tanya akhir pekannya, dan ceritakan sedikit akhir pekanmu.",
    steps: [
      { en: "Ask how the colleague is", id: "Tanya kabarnya" },
      { en: "Ask about their weekend", id: "Tanya akhir pekannya" },
      {
        en: "Share something about your own weekend",
        id: "Ceritakan sedikit akhir pekanmu",
      },
    ],
  },
  hotel: {
    roleAi: "a hotel receptionist",
    roleUser: "a guest whose room air conditioner is broken",
    mission:
      "Complain about the broken AC, ask to change rooms if it can't be fixed, and ask whether breakfast is included.",
    missionId:
      "Komplain AC kamar rusak, minta pindah kamar kalau tidak bisa diperbaiki, dan tanya apakah sarapan termasuk.",
    steps: [
      {
        en: "Give your room number and explain the AC problem",
        id: "Sebut nomor kamar dan jelaskan masalah AC",
      },
      {
        en: "Ask to change rooms if it can't be fixed",
        id: "Minta pindah kamar kalau tidak bisa diperbaiki",
      },
      {
        en: "Ask whether breakfast is included",
        id: "Tanya apakah sarapan termasuk",
      },
    ],
  },
  interview: {
    roleAi: "an HR interviewer at a tech company",
    roleUser: "a job candidate",
    mission:
      "Introduce yourself in the interview: your experience, an achievement you're proud of, and why you want this role.",
    missionId:
      "Perkenalkan diri di wawancara: pengalamanmu, satu pencapaian yang kamu banggakan, dan alasan melamar posisi ini.",
    steps: [
      {
        en: "Describe your current role and experience",
        id: "Ceritakan peran dan pengalamanmu",
      },
      {
        en: "Mention an achievement you are proud of",
        id: "Sebutkan pencapaian yang kamu banggakan",
      },
      {
        en: "Explain why you want this position",
        id: "Jelaskan kenapa kamu ingin posisi ini",
      },
      {
        en: "Answer why you are leaving your current job",
        id: "Jawab kenapa kamu meninggalkan pekerjaan sekarang",
      },
    ],
  },
  disagree: {
    roleAi:
      "a senior engineer who wants to rewrite a whole module from scratch",
    roleUser: "a developer on the same team",
    mission:
      "Disagree politely: acknowledge their point, explain your concern, and propose a smaller alternative you both agree on.",
    missionId:
      "Tidak setuju dengan sopan: akui pendapatnya, jelaskan kekhawatiranmu, lalu usulkan alternatif lebih kecil sampai sepakat.",
    steps: [
      {
        en: "Acknowledge the senior's point",
        id: "Akui pendapat senior",
      },
      {
        en: "Explain your concern politely",
        id: "Jelaskan kekhawatiranmu dengan sopan",
      },
      {
        en: "Propose a smaller alternative",
        id: "Usulkan alternatif yang lebih kecil",
      },
      { en: "Agree on a next step", id: "Sepakati langkah berikutnya" },
    ],
  },
  present: {
    roleAi:
      "a stakeholder joining the sprint demo, who listens and asks a short question",
    roleUser: "the developer presenting the sprint results",
    mission:
      "Open the presentation: welcome everyone, give the agenda, share one key result, and invite questions.",
    missionId:
      "Buka presentasi: sambut peserta, sampaikan agenda, bagikan satu hasil utama, lalu persilakan bertanya.",
    steps: [
      { en: "Welcome the audience", id: "Sambut para peserta" },
      { en: "Give the agenda", id: "Sampaikan agendanya" },
      { en: "Share one key result", id: "Bagikan satu hasil utama" },
      { en: "Invite questions", id: "Persilakan bertanya" },
    ],
  },
  feedback: {
    roleAi:
      "a team member who has missed several deadlines recently and feels overloaded",
    roleUser: "their team lead in a one-on-one",
    mission:
      "Give difficult feedback kindly: describe the pattern and its impact, ask what's in the way, and agree on what changes.",
    missionId:
      "Beri feedback sulit dengan baik: jelaskan polanya dan dampaknya, tanya apa kendalanya, lalu sepakati perubahan.",
    steps: [
      {
        en: "Describe the pattern of missed deadlines",
        id: "Jelaskan pola deadline yang terlewat",
      },
      { en: "Explain the impact on the team", id: "Jelaskan dampaknya ke tim" },
      {
        en: "Ask what is getting in their way",
        id: "Tanya apa kendalanya",
      },
      {
        en: "Agree on what will change",
        id: "Sepakati apa yang akan berubah",
      },
    ],
  },
  negotiate: {
    roleAi:
      "an HR manager offering 18 million rupiah per month, with some room to move",
    roleUser: "a candidate who just received the job offer",
    mission:
      "Negotiate the salary: thank them, ask for more with a reason, discuss an alternative, and ask for the offer in writing.",
    missionId:
      "Negosiasi gaji: berterima kasih, minta lebih dengan alasan, bahas alternatif, lalu minta tawarannya tertulis.",
    steps: [
      {
        en: "Thank them and show interest in the role",
        id: "Berterima kasih dan tunjukkan minat",
      },
      {
        en: "Ask for a higher salary with a reason",
        id: "Minta gaji lebih tinggi dengan alasan",
      },
      {
        en: "Discuss an alternative (bonus, review date, etc.)",
        id: "Bahas alternatif (bonus, jadwal review, dll.)",
      },
      {
        en: "Ask for the final offer in writing",
        id: "Minta tawaran akhir secara tertulis",
      },
    ],
  },
  story: {
    roleAi: "a friendly foreign colleague having dinner with you",
    roleUser: "a colleague telling a funny story",
    mission:
      "Tell a funny thing that happened to you: set the scene, describe what went wrong, react to their questions, and end with the lesson.",
    missionId:
      "Ceritakan pengalaman lucu: gambarkan situasinya, apa yang salah, tanggapi pertanyaannya, lalu tutup dengan pelajarannya.",
    steps: [
      { en: "Set the scene of the story", id: "Gambarkan situasinya" },
      {
        en: "Describe what went wrong",
        id: "Ceritakan apa yang salah",
      },
      {
        en: "Answer a question from your colleague",
        id: "Jawab pertanyaan kolegamu",
      },
      {
        en: "End with the moral or lesson",
        id: "Tutup dengan pelajarannya",
      },
    ],
  },
};
