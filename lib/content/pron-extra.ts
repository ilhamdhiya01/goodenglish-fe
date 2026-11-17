// Real-word minimal pairs for the "Bunyi sulit" sounds whose own pairs are
// only mispronunciations ("tink ✗", "werk"). Joined into VOCAB_PRON.sounds as
// `wordPairs` (lib/content/index.ts) so Pelafalan can show them and Menyimak ›
// Bunyi mirip can quiz them. Keyed by the sound's `name` in raw/pron.js.
// Avoid words a TTS voice may read two ways (read, lead, live).
export const PRON_WORD_PAIRS: Record<string, [string, string][]> = {
  th: [
    ["think", "sink"],
    ["three", "tree"],
    ["thank", "tank"],
    ["thin", "tin"],
    ["mouth", "mouse"],
    ["they", "day"],
    ["then", "den"],
  ],
  "z bergetar": [
    ["zoo", "sue"],
    ["prize", "price"],
    ["eyes", "ice"],
    ["rise", "rice"],
    ["lose", "loose"],
    ["buzz", "bus"],
  ],
  "r di akhir kata": [
    ["right", "light"],
    ["rice", "lice"],
    ["red", "led"],
    ["road", "load"],
    ["pray", "play"],
    ["fry", "fly"],
  ],
};
