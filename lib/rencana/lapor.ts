import { today } from "@/lib/helpers/storage.helper";
import { antreLaporan } from "@/lib/rencana/laporan-sync";
import {
  type DataJenis,
  JENIS_AKTIVITAS,
  type JenisAktivitas,
  type Laporan,
} from "@/lib/rencana/rencana.contract";
import { useLaporanStore } from "@/stores/useLaporanStore";
import { useLevelStore } from "@/stores/useLevelStore";

export interface IsiLaporan<J extends JenisAktivitas> {
  /** Default: level and week active now. */
  level?: string | null;
  week?: number | null;
  skor?: number;
  total?: number;
  jumlah?: number;
  data: DataJenis[J];
}

const newId = () => {
  try {
    return crypto.randomUUID();
  } catch {
    return (
      Date.now().toString(36) + Math.random().toString(36).slice(2, 12)
    ).slice(0, 40);
  }
};

/**
 * THE way a menu tells Rencana what happened (see rencana.contract.ts).
 * The report is counted right away on this device and sent to the server
 * in the background; it is never changed afterwards.
 */
export const laporAktivitas = <J extends JenisAktivitas>(
  jenis: J,
  isi: IsiLaporan<J>,
): Laporan<J> => {
  const lv = useLevelStore.getState();
  const l: Laporan<J> = {
    id: newId(),
    jenis,
    menu: JENIS_AKTIVITAS[jenis].menu,
    level: isi.level === undefined ? lv.level : isi.level,
    week: isi.week === undefined ? lv.week : isi.week,
    day: today(),
    ...(isi.skor !== undefined ? { skor: isi.skor } : {}),
    ...(isi.total !== undefined ? { total: isi.total } : {}),
    ...(isi.jumlah !== undefined ? { jumlah: isi.jumlah } : {}),
    data: isi.data,
  };
  useLaporanStore.getState().tambah(l as Laporan);
  antreLaporan(l as Laporan);
  return l;
};
