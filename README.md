# goodenglish-fe

Frontend Good English: **Vocab Bekal Speaking**, dimigrasi dari Vite + React 18 ke Next.js 16 (App Router) dengan tampilan yang sama. Struktur, tooling, dan deploy mengikuti `critiq-fe`.

## Yang berubah dibanding versi Vite

- **Akses lewat token.** `/access` meminta token dari admin, lalu `proxy.ts` mengarahkan semua halaman ke sana kalau belum ada cookie `session`. Menu dan level yang tidak diizinkan token disembunyikan, dan route-nya diblok di `AppShell`.
- **Progres di server.** API `load`/`save` di `lib/helpers/storage.helper.ts` tetap sama, jadi logika store tidak berubah. Bedanya, kunci progres dibaca dari snapshot `GET /me/progress` dan ditulis balik lewat antrean debounce (`progress-sync.helper.ts`, `PUT /me/progress/:key`). Pilihan suara TTS tetap di localStorage karena itu per perangkat.
- **Impor progres lama.** Saat pertama masuk, kalau token belum punya progres dan browser masih menyimpan progres versi lama, muncul tawaran untuk mengimpornya.
- **Dashboard admin** di `/admin/tokens` untuk membuat, mengubah, mencabut, dan mereset perangkat token, serta melihat ringkasan progres.
- **Routing** memakai path (`/vocab`, `/grammar/tense`, …), tidak lagi hash. Link lama `/#/vocab` tetap dialihkan.

Konten belajar (`lib/content/`: kosakata, penjelasan, bank soal) disalin apa adanya dari versi Vite. Penjelasan kata dimuat sebagai chunk terpisah.

## Menjalankan lokal

```bash
pnpm install
cp .env.example .env     # NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
pnpm dev                 # http://localhost:3002 (BE harus jalan di :3001)
pnpm lint && pnpm test && pnpm build
```

## Struktur

```
app/                     route (App Router). (main)/ dibungkus AppShell; access/, admin/
components/ui/           primitive (forwardRef + tailwind-variants)
components/shared/       layout (AppShell, Header, GlobalSearch, …), rich
components/features/     plan, vocab, quiz, review, scenario, errors, grammar, ask, pronunciation, access, admin
const/                   *.constant.ts
lib/content/             data konten + loader (index.ts)
lib/helpers/             storage, progress-sync, progress-hydrate, level-data, quiz, speech, …
lib/hooks/               auth/, progress/, admin/ (TanStack Query) + hook utilitas
services/                *.service.ts (axios)
stores/                  use*Store.ts (zustand)
routes.ts, proxy.ts
```

## Deploy

Push ke `development` atau `main` menjalankan CI, lalu image `ghcr.io/<owner>/goodenglish-fe` (build-arg `NEXT_PUBLIC_API_URL=/api/v1`), lalu SSH ke VPS: `cd ~/goodenglish/goodenglish-fe && docker compose pull && up -d`. Container mendengarkan di `127.0.0.1:3200`. Nginx: `/` diarahkan ke 3200, `/api/v1` ke backend 3201.
