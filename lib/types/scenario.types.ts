// Skenario percakapan & daftar kesalahan umum.

export interface Scenario {
  id: string;
  level: string;
  title: string;
  where: string;
  lines: [string, string, string][];
}

export interface ErrorGroup {
  cat: string;
  lv: string;
  items: [string, string, string][];
}
