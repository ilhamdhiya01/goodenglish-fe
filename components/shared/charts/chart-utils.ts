const DAY_MS = 86_400_000;
const SHORT = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});
const LONG = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

/** "16 Nov" for an epoch day. */
export const dayShort = (d: number) => SHORT.format(new Date(d * DAY_MS));
/** "16 November 2026" for an epoch day. */
export const dayLong = (d: number) => LONG.format(new Date(d * DAY_MS));
