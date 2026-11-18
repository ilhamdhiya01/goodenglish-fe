import type { BrowserContext, Page, Route } from "@playwright/test";

import type { MenuId, SessionData } from "@/lib/types/session.types";

// Browser-side stand-in for the backend: every request under /api/v1 is
// answered here, and progress writes are recorded so tests can assert what
// would have been saved.

export const API = "/api/v1";

const ALL_MENUS: MenuId[] = [
  "plan",
  "vocab",
  "review",
  "scenario",
  "errors",
  "grammar",
  "pronunciation",
  "cheatsheet",
  "ai",
];

export const fullSession: SessionData = {
  label: "E2E",
  role: "learner",
  menus: ALL_MENUS,
  levels: ["beginner", "pre", "inter", "upper"],
  expiresAt: null,
};

// The restricted token from the redesign checklist: 3 menus, 1 level, no AI.
export const limitedSession: SessionData = {
  label: "E2E terbatas",
  role: "learner",
  menus: ["plan", "vocab", "review"],
  levels: ["beginner"],
  expiresAt: null,
};

/** Same epoch-day number the app uses (lib/helpers/storage.helper.ts). */
export const today = () => Math.floor(Date.now() / 86400000);

// Pre-intermediate week 1 words (lib/content/raw/w1.js); the 'pre' level has
// no key prefix.
export const DUE_KEYS = ["1:w:be", "1:w:have", "1:w:do"];

/** Progress with three known words due for review today. */
export const progressWithDue = () => ({
  level: "pre",
  known: Object.fromEntries(DUE_KEYS.map((k) => [k, 1])),
  srs: Object.fromEntries(DUE_KEYS.map((k) => [k, { st: 1, due: today() }])),
});

export const adminSession: SessionData = { ...fullSession, role: "admin" };

/** A learner who may also open "Menyimak". */
export const listeningSession: SessionData = {
  ...fullSession,
  menus: [...ALL_MENUS, "listening"],
};

/** A learner who may also open "Bacaan". */
export const readingSession: SessionData = {
  ...fullSession,
  menus: [...ALL_MENUS, "reading"],
};

/** A published "Bacaan" text (level pre, week 1 words: be, have, do). */
export const readingText = (id: string, week = 1, o: object = {}) => ({
  id,
  level: "pre",
  week,
  slot: "A",
  status: "published",
  title: "A rainy morning",
  paragraphs: [
    {
      en: "I have a small quokka toy. We do our homework every day.",
      id: "Aku punya mainan quokka kecil. Kami mengerjakan PR setiap hari.",
    },
    {
      en: "It can be fun to jump in a puddle!",
      id: "Melompat ke genangan air bisa menyenangkan!",
    },
  ],
  targetWordsUsed: ["be", "have", "do"],
  glossary: [{ word: "puddle", meaningId: "genangan air" }],
  questions: [
    ...[1, 2, 3].map((n) => ({
      type: "mcq",
      question: `Question ${n}?`,
      options: ["Right", "Wrong 1", "Wrong 2", "Wrong 3"],
      answerIndex: 0,
      explanationId: `Penjelasan ${n}.`,
    })),
    {
      type: "true_false",
      statement: "They do homework every day.",
      answer: true,
      explanationId: "Disebut di paragraf 1.",
    },
    {
      type: "find_word",
      promptId: 'Temukan kata di teks yang artinya "genangan air"',
      answer: "puddle",
    },
  ],
  wordCount: 19,
  warnings: [],
  createdBy: "Admin",
  publishedAt: new Date().toISOString(),
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...o,
});

const words = (n: number, w: string) =>
  Array.from({ length: n }, (_, i) => `${w}${i % 7}`).join(" ");

/** A published "Dengar & jawab" item (level pre). */
export const listenItem = (id: string, week = 1, o: object = {}) => ({
  id,
  level: "pre",
  week,
  status: "published",
  type: "dialog",
  title: `Item ${id}`,
  lines: [
    { speaker: "A", text: `Hello, the train leaves at ten. ${words(26, "a")}` },
    {
      speaker: "B",
      text: `Thanks, I will take platform two. ${words(26, "b")}`,
    },
  ],
  questions: [
    {
      question: "When does the train leave?",
      options: ["At nine", "At ten", "At eleven", "At noon"],
      answerIndex: 1,
      explanationId: 'Disebut "at ten".',
    },
    {
      question: "Which platform?",
      options: ["One", "Two", "Three", "Four"],
      answerIndex: 1,
      explanationId: 'Disebut "platform two".',
    },
    {
      question: "Who says thanks?",
      options: ["A", "B", "Both", "Nobody"],
      answerIndex: 1,
      explanationId: "B yang berterima kasih.",
    },
  ],
  wordCount: 70,
  createdBy: "Admin",
  publishedAt: new Date().toISOString(),
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...o,
});

/** A learner who may also use "Main peran" (needs Skenario too). */
export const roleplaySession: SessionData = {
  ...fullSession,
  menus: [...ALL_MENUS, "roleplay"],
};

const ADMIN_TOKENS = (["active", "revoked", "expired"] as const).map(
  (status, i) => ({
    id: "t" + i,
    label: ["Budi", "Sari", "Kelas Sabtu"][i],
    tokenPrefix: "ge_ab" + i,
    role: "learner",
    menus: ALL_MENUS,
    levels: ["beginner", "pre"],
    maxDevices: 2,
    aiDailyLimit: 20,
    roleplayDailyLimit: 3,
    activeDevices: i === 0 ? 1 : 0,
    status,
    expiresAt: null,
    revokedAt: status === "revoked" ? new Date().toISOString() : null,
    lastUsedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  }),
);

export interface MockOptions {
  session?: SessionData | null;
  progress?: Record<string, unknown>;
  aiUsage?: { used: number; limit: number | null };
  aiReply?: string;
  /** Sent after the reply as `event: check` (a checked sentence). */
  aiCheck?: Record<string, unknown>;
  roleplayUsage?: { used: number; limit: number | null };
  /** What the STT "hears" from a recording ("" = 422 stt_no_speech). */
  roleplayTranscript?: string;
  /** How many "Main peran" turns fail (502) before they work. */
  roleplayFailTurns?: number;
  /** Published Dengar & jawab items the learner gets (default: 2). */
  listeningItems?: unknown[];
  /** Published Bacaan texts the learner gets (default: 2 in week 1). */
  readingTexts?: unknown[];
}

export interface MockApi {
  /** Every PUT /me/progress/:key body, in order. */
  puts: { key: string; data: unknown }[];
  /** Every POST /ai/chat body. */
  chats: unknown[];
  /** Every token action, "METHOD /admin/tokens/…". */
  admin: string[];
  /** Every "Main peran" call, "METHOD /roleplay/…" with its body. */
  roleplay: { path: string; body: unknown }[];
  /** Every admin Menyimak call, "METHOD /admin/listening/…" with its body. */
  listening: { call: string; body: unknown }[];
  /** Every Bacaan call (learner lookups and admin), with its body. */
  reading: { call: string; body: unknown }[];
  lastPut: (key: string) => unknown;
}

const json = (route: Route, data: unknown, status = 200) =>
  route.fulfill({
    status,
    contentType: "application/json",
    body: JSON.stringify(status < 400 ? { data } : data),
  });

const sse = (reply: string, check?: Record<string, unknown>) =>
  [
    `event: meta\ndata: ${JSON.stringify({ conversationId: "c-new" })}\n\n`,
    ...reply
      .split(/(?<= )/)
      .map((t) => `data: ${JSON.stringify({ text: t })}\n\n`),
    ...(check ? [`event: check\ndata: ${JSON.stringify(check)}\n\n`] : []),
    "event: done\ndata: {}\n\n",
  ].join("");

const CONVERSATIONS = [
  {
    id: "c1",
    title: "run out of vs run out",
    updatedAt: new Date().toISOString(),
    messageCount: 4,
  },
];

export const installMockApi = async (
  context: BrowserContext,
  baseURL: string,
  opts: MockOptions = {},
): Promise<MockApi> => {
  const session = opts.session === undefined ? fullSession : opts.session;
  const api: MockApi = {
    puts: [],
    chats: [],
    admin: [],
    roleplay: [],
    listening: [],
    reading: [],
    lastPut: (key) =>
      [...api.puts].reverse().find((p) => p.key === key)?.data ?? undefined,
  };

  // Admin Menyimak bank for this test (starts with one draft).
  const bank: (ReturnType<typeof listenItem> & Record<string, unknown>)[] = [
    listenItem("bank1", 1, { status: "draft", title: "Station draft" }),
  ];

  // Admin Bacaan texts (start with one draft that misses the rules).
  const texts: (ReturnType<typeof readingText> & Record<string, unknown>)[] = [
    readingText("rd1", 1, {
      status: "draft",
      title: "Warned draft",
      publishedAt: null,
      warnings: [{ code: "word_count", count: 19, min: 150, max: 200 }],
    }),
  ];

  if (session) {
    await context.addCookies([{ name: "session", value: "e2e", url: baseURL }]);
  }

  // The AI voice model (±90 MB from Hugging Face) is never downloaded in
  // tests: speaking is checked through window.__spoken (spyOnSpeech).
  await context.route("https://huggingface.co/**", (route) => route.abort());

  await context.route(`**${API}/**`, async (route) => {
    const req = route.request();
    const path = new URL(req.url()).pathname.slice(API.length);
    const method = req.method();

    if (path === "/auth/me") {
      return session
        ? json(route, session)
        : json(route, { errors: [{ message: "session_invalid" }] }, 401);
    }
    if (path === "/auth/redeem" && method === "POST") {
      const { token } = req.postDataJSON() as { token: string };
      // One token per backend refusal, to check every error message.
      const refusal: Record<string, [number, string]> = {
        ge_revoked: [403, "token_revoked"],
        ge_expired: [410, "token_expired"],
        ge_devices: [429, "device_limit"],
      };
      if (refusal[token]) {
        const [status, code] = refusal[token];
        return json(route, { errors: [{ message: code }] }, status);
      }
      if (token !== "ge_e2e") {
        return json(route, { errors: [{ message: "invalid_token" }] }, 401);
      }
      await context.addCookies([
        { name: "session", value: "e2e", url: baseURL },
      ]);
      return json(route, fullSession);
    }
    if (path === "/auth/logout") return json(route, null);

    if (path === "/me/progress" && method === "GET") {
      return json(route, opts.progress ?? { level: "pre" });
    }
    if (path.startsWith("/me/progress/") && method === "PUT") {
      const key = path.split("/").pop()!;
      const { data } = req.postDataJSON() as { data: unknown };
      api.puts.push({ key, data });
      return json(route, null);
    }

    if (path === "/words") return json(route, []);

    if (path === "/ai/usage") {
      return json(route, opts.aiUsage ?? { used: 2, limit: 20 });
    }
    if (path === "/ai/conversations") return json(route, CONVERSATIONS);
    if (path.startsWith("/ai/conversations/")) {
      if (method === "DELETE") return json(route, null);
      return json(route, {
        ...CONVERSATIONS[0],
        messages: [
          {
            id: "m1",
            role: "user",
            text: "bedanya run out of sama run out apa?",
            createdAt: CONVERSATIONS[0].updatedAt,
          },
          {
            id: "m2",
            role: "model",
            text: "**run out of** + benda: kamu yang kehabisan sesuatu.",
            createdAt: CONVERSATIONS[0].updatedAt,
          },
        ],
      });
    }
    if (path === "/ai/chat" && method === "POST") {
      api.chats.push(req.postDataJSON());
      if (opts.aiUsage && opts.aiUsage.limit !== null) {
        if (opts.aiUsage.used >= opts.aiUsage.limit) {
          return json(
            route,
            { errors: [{ message: "ai_quota_exceeded" }] },
            429,
          );
        }
      }
      return route.fulfill({
        status: 200,
        contentType: "text/event-stream",
        body: sse(
          opts.aiReply ?? "Run out of dipakai dengan benda.",
          opts.aiCheck,
        ),
      });
    }

    // "Main peran": 2 learner turns finish the mission (order: 3 steps).
    if (path === "/roleplay/usage") {
      return json(route, opts.roleplayUsage ?? { used: 0, limit: 3 });
    }
    if (path.startsWith("/roleplay/sessions")) {
      // The mic upload is multipart; everything else is JSON.
      if (path.endsWith("/transcribe")) {
        const raw = req.postDataBuffer() ?? Buffer.alloc(0);
        const text = raw.toString("latin1");
        const language = /name="language"\r\n\r\n(\w+)/.exec(text)?.[1];
        const file =
          /name="audio"; filename="([^"]+)"\r\nContent-Type: ([^\r]+)/.exec(
            text,
          );
        api.roleplay.push({
          path,
          body: {
            contentType: req.headers()["content-type"] ?? "",
            language,
            fileName: file?.[1],
            fileType: file?.[2],
            bytes: raw.length,
          },
        });
        const said =
          opts.roleplayTranscript ??
          (language === "id" ? "Saya mau dua kopi" : "I go to event yesterday");
        if (!said) {
          return json(route, { errors: [{ message: "stt_no_speech" }] }, 422);
        }
        return json(route, {
          text: said,
          language,
          durationSec: 1.2,
          transcribeLeft: 29,
        });
      }
      const body = method === "POST" ? req.postDataJSON() : null;
      api.roleplay.push({ path, body });
      if (path === "/roleplay/sessions") {
        return json(route, {
          id: "rp1",
          reply: "Hi! What can I get for you?",
          remaining: 2,
        });
      }
      const transcript = (body as { transcript: { role: string }[] })
        .transcript;
      const userTurns = transcript.filter((l) => l.role === "user").length;
      if (path.endsWith("/turn")) {
        if ((opts.roleplayFailTurns ?? 0) > 0) {
          opts.roleplayFailTurns!--;
          return json(route, { errors: [{ message: "ai_failed" }] }, 502);
        }
        const done = userTurns >= 2;
        return json(route, {
          reply: done
            ? "That's 65,000. Have a nice day!"
            : "Sure. Anything else?",
          stepsDone: done ? [0, 1, 2] : [0],
          missionComplete: done,
          userTurns,
          turnsLeft: 12 - userTurns,
        });
      }
      if (path.endsWith("/help")) {
        return json(route, {
          suggestions: [
            { en: "Can I have a latte, please?", id: "Boleh minta latte?" },
            { en: "How much is it?", id: "Berapa harganya?" },
          ],
          helpLeft: 5,
        });
      }
      if (path.endsWith("/finish")) {
        return json(route, {
          missionComplete: userTurns >= 2,
          summary: "Bagus! Kamu berhasil memesan dengan jelas.",
          corrections: [
            {
              original: "I want two latte",
              corrected: "I want two lattes",
              explanation: "Benda jamak pakai -s: two lattes.",
              category: "kesalahan",
            },
          ],
          moreNatural: [
            {
              original: "I want two lattes",
              natural: "Can I have two lattes, please?",
            },
          ],
          keyPhrasesUsed: ["Anything else?"],
          durationSec: 125,
          userTurns,
          stepsDone: userTurns >= 2 ? [0, 1, 2] : [0],
        });
      }
    }

    // "Menyimak": learner items and the admin bank (kept in memory).
    if (path === "/listening/items") {
      return json(
        route,
        opts.listeningItems ?? [listenItem("li1", 1), listenItem("li2", 1)],
      );
    }
    if (path.startsWith("/admin/listening")) {
      const body =
        method === "POST" || method === "PATCH"
          ? (req.postDataJSON() as Record<string, unknown> | null)
          : null;
      api.listening.push({ call: `${method} ${path}`, body });
      const id = path.split("/")[3];
      const found = bank.find((i) => i.id === id);
      if (path === "/admin/listening" && method === "GET") {
        return json(route, bank);
      }
      if (path === "/admin/listening/generate") {
        const created = listenItem(
          `gen${bank.length + 1}`,
          Number(body?.week ?? 1),
          {
            status: "draft",
            title: "Generated draft",
            publishedAt: null,
          },
        );
        bank.push(created);
        return json(route, { items: [created], failed: 0 });
      }
      if (!found)
        return json(
          route,
          { errors: [{ message: "listening_not_found" }] },
          404,
        );
      if (method === "PATCH") {
        Object.assign(found, body);
        return json(route, found);
      }
      if (path.endsWith("/publish")) {
        found.status = "published";
        return json(route, found);
      }
      if (path.endsWith("/unpublish")) {
        found.status = "draft";
        return json(route, found);
      }
      if (method === "DELETE") {
        bank.splice(bank.indexOf(found), 1);
        return json(route, null);
      }
    }

    // "Bacaan": learner texts + lookups, and the admin texts (in memory).
    if (path === "/reading/texts") {
      return json(
        route,
        opts.readingTexts ?? [
          readingText("rt1", 1),
          readingText("rt2", 1, { slot: "B", title: "Second text" }),
        ],
      );
    }
    if (path === "/reading/lookup") {
      const body = req.postDataJSON() as { word: string };
      api.reading.push({ call: `${method} ${path}`, body });
      const w = body.word.toLowerCase();
      return json(route, {
        word: w,
        lemma: w,
        meaningId: `arti-${w}`,
        pron: "KWOK-a",
        cached: false,
      });
    }
    if (path.startsWith("/admin/reading")) {
      const body =
        method === "POST" || method === "PATCH"
          ? (req.postDataJSON() as Record<string, unknown> | null)
          : null;
      api.reading.push({ call: `${method} ${path}`, body });
      const id = path.split("/")[3];
      const found = texts.find((t) => t.id === id);
      if (path === "/admin/reading" && method === "GET") {
        return json(route, texts);
      }
      if (path === "/admin/reading/generate") {
        const created = readingText(`gen${texts.length + 1}`, 1, {
          status: "draft",
          slot: body?.slot ?? "A",
          title: "Generated text",
          publishedAt: null,
        });
        texts.push(created);
        return json(route, created);
      }
      if (!found)
        return json(route, { errors: [{ message: "reading_not_found" }] }, 404);
      if (method === "PATCH") {
        Object.assign(found, body, { warnings: [] });
        return json(route, found);
      }
      if (path.endsWith("/publish")) {
        found.status = "published";
        return json(route, found);
      }
      if (path.endsWith("/unpublish")) {
        found.status = "draft";
        return json(route, found);
      }
      if (method === "DELETE") {
        texts.splice(texts.indexOf(found), 1);
        return json(route, null);
      }
    }

    if (path === "/stt/transcribe" && method === "POST") {
      return json(route, {
        text: "She goes to school.",
        language: "en",
        durationSec: 2,
      });
    }

    if (path === "/admin/tokens" && method === "GET") {
      return json(route, ADMIN_TOKENS);
    }
    // Token actions: record them and answer with a plausible item.
    if (path.startsWith("/admin/tokens") && method !== "GET") {
      api.admin.push(`${method} ${path}`);
      const id = path.split("/")[3] ?? "t9";
      const item = { ...ADMIN_TOKENS[0], id, label: "Baru" };
      if (method === "DELETE" && path.split("/").length === 4)
        return json(route, null);
      if (path === "/admin/tokens" || path.endsWith("/regenerate"))
        return json(route, { token: "ge_e2e_baru_123456", item });
      return json(route, item);
    }
    if (path.startsWith("/admin/tokens/") && path.endsWith("/summary")) {
      return json(route, {
        knownCount: 86,
        srsCount: 80,
        ownSentenceCount: 4,
        customWordCount: 1,
        lastProgressAt: new Date().toISOString(),
        sessions: [],
        roleplayWeeks: [
          { weekStart: "2026-11-16", sessions: 2, minutes: 13 },
          { weekStart: "2026-11-09", sessions: 0, minutes: 0 },
        ],
        placement: {
          status: "done",
          date: "2026-11-15T03:00:00.000Z",
          level: "inter",
          week: 5,
        },
        examAttempts: [
          {
            level: "pre",
            date: "2026-11-17T03:00:00.000Z",
            pct: 82,
            passed: true,
            sections: [
              { section: "vocab", right: 13, total: 15 },
              { section: "grammar", right: 12, total: 15 },
              { section: "listening", right: 8, total: 10 },
            ],
          },
        ],
      });
    }

    return json(route, { errors: [{ message: "not_mocked" }] }, 404);
  });

  return api;
};

/** Same "random" quiz questions and option order on every run, so axe
 * counts and screenshots of shuffled screens are comparable. */
export const seedRandom = (page: Page) =>
  page.addInitScript(() => {
    let a = 0x9e3779b9;
    Math.random = () => {
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  });

/** Records every text the app asks to read aloud (speech.helper pushes to
 * window.__spoken when it exists; headless runs make no sound). */
export const spyOnSpeech = (page: Page) =>
  page.addInitScript(() => {
    (window as unknown as { __spoken: string[] }).__spoken = [];
  });

export const spoken = (page: Page) =>
  page.evaluate(
    () => (window as unknown as { __spoken: string[] }).__spoken ?? [],
  );
