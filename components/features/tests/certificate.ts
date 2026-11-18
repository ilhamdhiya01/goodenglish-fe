import { levelName } from "@/const/levels.constant";
import { formatDate } from "@/lib/helpers/date.helper";
import { pctOf, totalOf } from "@/lib/helpers/test-engine.helper";
import {
  type ExamAttempt,
  SECTION_LABEL,
  type SectionId,
} from "@/lib/types/exam.types";

// "Sertifikat" of a passed end-of-level exam, drawn on a canvas (no extra
// library): downloaded as PNG, or printed / saved as PDF from the browser.

const W = 1600;
const H = 1130;

const font = (weight: number, px: number) => {
  const family =
    getComputedStyle(document.body).getPropertyValue("--font-sans") ||
    "system-ui, sans-serif";
  return `${weight} ${px}px ${family}`;
};

export const drawCertificate = (
  attempt: ExamAttempt,
  name: string,
): HTMLCanvasElement => {
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const g = c.getContext("2d");
  if (!g) return c;
  const blue = "#3d6be0";
  const ink = "#1f2a37";
  const soft = "#5b6676";

  g.fillStyle = "#fffdf7";
  g.fillRect(0, 0, W, H);
  g.strokeStyle = blue;
  g.lineWidth = 14;
  g.strokeRect(40, 40, W - 80, H - 80);
  g.lineWidth = 3;
  g.strokeRect(70, 70, W - 140, H - 140);

  g.textAlign = "center";
  g.fillStyle = blue;
  g.font = font(800, 34);
  g.fillText("GOODENGLISH", W / 2, 170);
  g.fillStyle = ink;
  g.font = font(900, 84);
  g.fillText("Sertifikat Kelulusan", W / 2, 280);
  g.fillStyle = soft;
  g.font = font(700, 34);
  g.fillText("diberikan kepada", W / 2, 370);
  g.fillStyle = ink;
  g.font = font(900, 76);
  g.fillText(name || "Pelajar", W / 2, 470);
  g.fillStyle = soft;
  g.font = font(700, 34);
  g.fillText(
    `telah lulus Ujian akhir level ${levelName(attempt.level)}`,
    W / 2,
    560,
  );

  const parts = (Object.keys(attempt.sections) as SectionId[]).map(
    (k) => `${SECTION_LABEL[k]} ${pctOf(attempt.sections[k]!)}%`,
  );
  const t = totalOf(attempt.sections);
  g.fillStyle = ink;
  g.font = font(800, 40);
  g.fillText(`Skor ${pctOf(t)}%`, W / 2, 680);
  g.fillStyle = soft;
  g.font = font(700, 32);
  g.fillText(parts.join("   ·   "), W / 2, 740);

  g.fillStyle = ink;
  g.font = font(700, 30);
  g.fillText(formatDate(attempt.date), W / 2, 900);
  g.strokeStyle = "#c9d2de";
  g.lineWidth = 2;
  g.beginPath();
  g.moveTo(W / 2 - 220, 915);
  g.lineTo(W / 2 + 220, 915);
  g.stroke();
  g.fillStyle = soft;
  g.font = font(700, 24);
  g.fillText("Tanggal lulus", W / 2, 955);
  return c;
};

const fileName = (a: ExamAttempt) =>
  `sertifikat-goodenglish-${a.level}-${a.date.slice(0, 10)}`;

export const downloadCertificate = (a: ExamAttempt, name: string) => {
  drawCertificate(a, name).toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName(a) + ".png";
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }, "image/png");
};

/** Print just the certificate (the browser offers "Save as PDF"). */
export const printCertificate = (a: ExamAttempt, name: string) => {
  const url = drawCertificate(a, name).toDataURL("image/png");
  const w = window.open("", "_blank");
  if (!w) return;
  w.document.write(
    `<!doctype html><title>${fileName(a)}</title><style>@page{size:A4 landscape;margin:0}html,body{margin:0;height:100%}img{width:100%;height:100%;object-fit:contain}</style><img src="${url}" alt="Sertifikat" onload="setTimeout(function(){print()},100)">`,
  );
  w.document.close();
};
