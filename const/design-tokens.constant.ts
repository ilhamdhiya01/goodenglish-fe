// Token desain. Nilai warna/font didefinisikan sebagai CSS variable di src/index.css (@theme),
// lalu diekspos di sini untuk kode JS yang butuh nilai warna mentah (mis. stroke SVG, aksen
// kondisional yang tidak bisa pakai class Tailwind). Jangan hardcode hex di komponen —
// tambahkan token di index.css lalu rujuk lewat var() dari sini.

export const C = {
  paper: "var(--color-paper)",
  card: "var(--color-card)",
  ink: "var(--color-ink)",
  ink2: "var(--color-ink-2)",
  ink3: "var(--color-ink-3)",
  muted: "var(--color-muted)",
  faint: "var(--color-faint)",
  line: "var(--color-line)",
  line2: "var(--color-line-2)",
  sand: "var(--color-sand)",
  track: "var(--color-track)",
  green: "var(--color-green)",
  greenDeep: "var(--color-green-deep)",
  mint: "var(--color-mint)",
  greenBg: "var(--color-green-bg)",
  red: "var(--color-red)",
  blue: "var(--color-blue)",
  orange: "var(--color-orange)",
  purple: "var(--color-purple)",
  gold: "var(--color-gold)",
} as const;

export const FONT = {
  sans: "var(--font-sans)",
  mono: "var(--font-mono)",
  serif: "var(--font-serif)",
} as const;
