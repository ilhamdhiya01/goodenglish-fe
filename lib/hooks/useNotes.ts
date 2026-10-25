import { useEffect, useSyncExternalStore } from "react";

import { loadNotes, notesLoaded, onNotesLoaded } from "@/lib/content";

// Isi penjelasan kata ada di chunk terpisah. Hook ini memberi tahu apakah sudah siap,
// dan memuatnya begitu dibutuhkan (want = true). Komponen ikut dirender ulang saat selesai.
export const useNotes = (want = false): boolean => {
  const ready = useSyncExternalStore(onNotesLoaded, notesLoaded);
  useEffect(() => {
    if (want && !ready) loadNotes().catch(() => {});
  }, [want, ready]);
  return ready;
};
