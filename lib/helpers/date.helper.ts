const FMT = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const FMT_DATE = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

export const formatDateTime = (iso: string) => FMT.format(new Date(iso));
export const formatDate = (iso: string) => FMT_DATE.format(new Date(iso));
