import {
  type Bila,
  CHECKPOINT,
  type CheckpointId,
  type DefLangkah,
  type Durasi,
  type Hari,
  HARI_CHECKPOINT,
  LANGKAH,
  type LangkahId,
  RENCANA,
  type Saring,
  type Syarat,
  TOPIK_HALAMAN,
  type VarianLangkah,
} from "@/const/rencana.config";
import type { Laporan } from "@/lib/rencana/rencana.contract";
import type { MenuId } from "@/lib/types/session.types";

// Rencana's rules as pure functions over the activity log. Nothing here
// reads another menu's state: what a menu did reaches Rencana only as a
// report (rencana.contract.ts). A menu that reports nothing simply leaves
// its steps undone.

export const hariDari = (T: number): Hari =>
  new Date(T * 86_400_000).getUTCDay() as Hari;

export interface KonteksMinggu {
  level: string;
  minggu: number;
  /** Grammar topic of the week (admin map, else Bertanya). */
  topik: string;
  /** Scenario of the week (admin map, else the level's in turn). */
  skenario: string;
}

export interface KonteksHari extends KonteksMinggu {
  laporan: Laporan[];
  T: number;
  menus: MenuId[];
  durasi: Durasi;
  /** Main peran menu on and sessions left today. */
  mainPeranTersedia: boolean;
}

export interface StatusLangkah {
  id: LangkahId;
  judul: string;
  isi: string;
  tautan: string;
  aksi?: VarianLangkah["aksi"];
  selesai: boolean;
  /** Progress towards the main condition (e.g. 3/6 kata). */
  progres: { n: number; dari: number } | null;
  alternatif?: { judul: string; tautan: string };
  /** "Lewati" may be offered (e.g. no words left this week). */
  bolehLewati: boolean;
}

export interface HasilHari {
  hari: Hari;
  akhirPekan: boolean;
  langkah: StatusLangkah[];
  selesai: number;
  jumlah: number;
  berikutnya: StatusLangkah | null;
  /** Today counts for the streak. */
  streak: boolean;
  /** Stored in plan.days[T] (versioned: v2). */
  flags: Record<string, boolean>;
}

const dataOf = (l: Laporan) => (l.data ?? {}) as Record<string, unknown>;

const isi = (s: string, k: KonteksMinggu) =>
  s
    .replaceAll("{topik}", TOPIK_HALAMAN[k.topik] ?? "ask")
    .replaceAll("{skenario}", k.skenario);

const lolos = (
  l: Laporan,
  s: Saring,
  k: KonteksMinggu,
  langkah: LangkahId,
): boolean => {
  const d = dataOf(l);
  switch (s) {
    case "minggu_aktif":
      return l.level === k.level && l.week === k.minggu;
    case "bacaan_lulus":
      return (l.skor ?? 0) >= RENCANA.bacaanLulus && d.baru === true;
    case "dengar_lulus":
      return !!l.total && (l.skor ?? 0) / l.total >= RENCANA.dengarLulus;
    case "topik_minggu":
      return d.topik === k.topik;
    case "skenario_minggu":
      return d.scenarioId === k.skenario;
    case "mode_pendek":
      return d.mode === "pendek";
    case "mode_penuh":
      return d.mode === "penuh";
    case "langkah_ini":
      return d.langkah === langkah;
    case "dari_rencana":
      return d.sumber === "rencana";
  }
};

/** Latest known "words left" of the active week is 0. */
export const mingguHabis = (laporan: Laporan[], k: KonteksMinggu) => {
  for (let i = laporan.length - 1; i >= 0; i--) {
    const l = laporan[i];
    if (
      (l.jenis === "kata_ditandai" ||
        l.jenis === "kata_batal" ||
        l.jenis === "status_kata_minggu") &&
      l.level === k.level &&
      l.week === k.minggu
    ) {
      const sisa = dataOf(l).sisa;
      if (typeof sisa === "number") return sisa === 0;
    }
  }
  return false;
};

/** Words marked today and still marked (unmarking the same day counts back). */
const bersih = (hariIni: Laporan[], ok: (l: Laporan) => boolean): Laporan[] => {
  const last = new Map<string, Laporan>();
  for (const l of hariIni) {
    if (l.jenis !== "kata_ditandai" && l.jenis !== "kata_batal") continue;
    const kunci = dataOf(l).kunci;
    if (typeof kunci === "string") last.set(kunci, l);
  }
  return [...last.values()].filter((l) => l.jenis === "kata_ditandai" && ok(l));
};

/** The step as it applies today: day variant, then fallback. */
export const langkahHariIni = (
  def: DefLangkah,
  hari: Hari,
  kondisi: (b: Bila) => boolean,
) => {
  const v = { ...def, ...(def.perHari?.[hari] ?? {}) };
  if (v.cadangan && kondisi(v.cadangan.bila)) {
    const { bila: _bila, ...c } = v.cadangan;
    void _bila;
    return { ...v, ...c };
  }
  return v;
};

export const evaluasiHari = (k: KonteksHari): HasilHari => {
  const hari = hariDari(k.T);
  const akhirPekan = hari === 0 || hari === 6;
  const hariIni = k.laporan.filter((l) => l.day === k.T);
  const dipakai = new Set<string>();
  const kondisi = (b: Bila) =>
    b === "minggu_habis"
      ? mingguHabis(k.laporan, k)
      : b === "tanpa_main_peran"
        ? !k.mainPeranTersedia
        : false;

  const langkah: StatusLangkah[] = [];
  const streakIds: LangkahId[] = [];

  for (const def of LANGKAH) {
    if (!def.hari.includes(hari)) continue;
    if (!akhirPekan && !def.durasi.includes(k.durasi)) continue;
    const v = langkahHariIni(def, hari, kondisi);
    if (!v.menu.some((m) => k.menus.includes(m))) continue;

    let selesai = false;
    let progres: StatusLangkah["progres"] = null;
    for (const s of v.selesaiBila as Syarat[]) {
      if (s.bila && !kondisi(s.bila)) continue;
      const cocok = (l: Laporan) =>
        (s.saring ?? []).every((x) => lolos(l, x, k, def.id)) &&
        !(s.eksklusif && dipakai.has(l.id));
      const hits =
        s.cara === "bersih"
          ? bersih(hariIni, cocok)
          : hariIni.filter((l) => l.jenis === s.jenis && cocok(l));
      if (!progres)
        progres = { n: Math.min(hits.length, s.ambang), dari: s.ambang };
      const butuhOk =
        !s.butuh ||
        hariIni.filter((l) => l.jenis === s.butuh!.jenis).length >=
          s.butuh.ambang;
      if (hits.length >= s.ambang && butuhOk) {
        selesai = true;
        if (s.eksklusif)
          hits.slice(0, s.ambang).forEach((l) => dipakai.add(l.id));
        break;
      }
    }

    langkah.push({
      id: def.id,
      judul: v.judul,
      isi: v.isi,
      tautan: isi(v.tautan, k),
      ...(v.aksi ? { aksi: v.aksi } : {}),
      selesai,
      progres: progres && progres.dari > 1 ? progres : null,
      ...(def.alternatif ? { alternatif: def.alternatif } : {}),
      bolehLewati: !selesai && !!def.lewati && kondisi(def.lewati),
    });
    if (def.streak.includes(hari)) streakIds.push(def.id);
  }

  const selesai = langkah.filter((l) => l.selesai).length;
  const streak =
    streakIds.length > 0 &&
    streakIds.every((id) => langkah.find((l) => l.id === id)?.selesai);
  const flags: Record<string, boolean> = { v2: true, s: streak };
  langkah.forEach((l) => (flags[l.id] = l.selesai));
  return {
    hari,
    akhirPekan,
    langkah,
    selesai,
    jumlah: langkah.length,
    berikutnya: langkah.find((l) => !l.selesai) ?? null,
    streak,
    flags,
  };
};

// ---- checkpoint -----------------------------------------------------------

export interface KonteksCheckpoint extends KonteksMinggu {
  laporan: Laporan[];
  T: number;
  menus: MenuId[];
  /** "Mulai ulang minggu ini": evidence from this day on. */
  mulai?: number | null;
}

export interface StatusSyarat {
  id: CheckpointId;
  judul: string;
  isi: string;
  tautan: string;
  ok: boolean;
  /** What was found, e.g. "terbaik 17/20". */
  ket: string;
  wajib: boolean;
}

export interface HasilCheckpoint {
  tampil: boolean;
  /** First and last day of the window. */
  jendela: [number, number];
  syarat: StatusSyarat[];
  lulus: boolean;
  /** Titles of what is missing. */
  kurang: string[];
  /** Typed summary needed now (the roleplay part is done). */
  perluRingkasan: boolean;
}

/** Saturday–Monday window around day T (or the next one). */
export const jendelaCheckpoint = (T: number): [number, number] => {
  const h = hariDari(T);
  const sabtu = h === 6 ? T : h === 0 ? T - 1 : h === 1 ? T - 2 : T + (6 - h);
  return [sabtu, sabtu + 2];
};

const rasio = (l: Laporan) => (l.total ? (l.skor ?? 0) / l.total : 0);

export const evaluasiCheckpoint = (k: KonteksCheckpoint): HasilCheckpoint => {
  const jendela = jendelaCheckpoint(k.T);
  const minggu = k.laporan.filter(
    (l) =>
      l.level === k.level &&
      l.week === k.minggu &&
      (k.mulai == null || l.day >= k.mulai),
  );
  const jenis = (j: Laporan["jenis"]) => minggu.filter((l) => l.jenis === j);

  const cek: Record<CheckpointId, { ok: boolean; ket: string }> = (() => {
    const tes = jenis("tes_cepat_selesai").filter(
      (l) =>
        dataOf(l).lingkup === "week" &&
        l.day >= jendela[0] &&
        l.day <= jendela[1],
    );
    const tesBest = tes.reduce<Laporan | null>(
      (b, l) => (!b || rasio(l) > rasio(b) ? l : b),
      null,
    );
    const ketik = jenis("jawaban_grammar").filter(
      (l) => dataOf(l).topik === k.topik && dataOf(l).tahap === "type",
    );
    const benar = ketik.filter((l) => dataOf(l).benar === true).length;
    const dikte = jenis("dikte_selesai");
    const dikteBest = dikte.reduce((m, l) => Math.max(m, rasio(l)), 0);
    const mp = jenis("main_peran_selesai").filter((l) => {
      const d = dataOf(l);
      return (
        d.mode === "penuh" && d.misi === true && d.scenarioId === k.skenario
      );
    });
    const mpDay = mp.length ? Math.min(...mp.map((l) => l.day)) : null;
    const ringkas = jenis("ringkasan_tugas").filter(
      (l) =>
        mpDay !== null &&
        l.day >= mpDay &&
        (l.jumlah ?? 0) >= RENCANA.ringkasanMin &&
        (l.jumlah ?? 0) <= RENCANA.ringkasanMax,
    );
    return {
      kosakata: {
        ok: !!tesBest && rasio(tesBest) >= RENCANA.tesCepatLulus,
        ket: tesBest
          ? `terbaik ${tesBest.skor ?? 0}/${tesBest.total ?? 0}`
          : "belum dikerjakan Sabtu–Senin",
      },
      grammar: {
        ok:
          ketik.length >= RENCANA.grammarKetikMinimal &&
          benar / ketik.length >= RENCANA.grammarKetikAkurasi,
        ket: ketik.length
          ? `${benar}/${ketik.length} benar (${Math.round((benar / ketik.length) * 100)}%)`
          : "belum ada soal ketik",
      },
      menyimak: {
        ok: dikteBest >= RENCANA.dikteLulus,
        ket: dikte.length
          ? `terbaik ${Math.round(dikteBest * 100)}%`
          : "belum ada set Dikte",
      },
      tugas: {
        ok: mp.length > 0 && ringkas.length > 0,
        ket: !mp.length
          ? "belum ada Main peran penuh dengan misi tercapai"
          : ringkas.length
            ? "selesai"
            : "tinggal ringkasan 60–100 kata",
      },
    };
  })();

  const syarat: StatusSyarat[] = CHECKPOINT.filter((c) =>
    k.menus.includes(c.menu),
  ).map((c) => ({
    id: c.id,
    judul: c.judul,
    isi: c.isi,
    tautan: isi(c.tautan, k),
    ok: cek[c.id].ok,
    ket: cek[c.id].ket,
    wajib: !!c.wajib,
  }));
  const n = syarat.length;
  // 3 of 4; with a menu off, all but one of what is left.
  const perlu =
    n >= CHECKPOINT.length
      ? RENCANA.checkpointLulus
      : Math.max(1, n - (CHECKPOINT.length - RENCANA.checkpointLulus));
  const okN = syarat.filter((s) => s.ok).length;
  const lulus = n > 0 && okN >= perlu && syarat.every((s) => !s.wajib || s.ok);
  return {
    tampil: HARI_CHECKPOINT.includes(hariDari(k.T)),
    jendela,
    syarat,
    lulus,
    kurang: syarat.filter((s) => !s.ok).map((s) => s.judul),
    perluRingkasan:
      cek.tugas.ket === "tinggal ringkasan 60–100 kata" &&
      syarat.some((s) => s.id === "tugas"),
  };
};
