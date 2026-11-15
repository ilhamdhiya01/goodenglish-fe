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
}

export interface MockApi {
  /** Every PUT /me/progress/:key body, in order. */
  puts: { key: string; data: unknown }[];
  /** Every POST /ai/chat body. */
  chats: unknown[];
  lastPut: (key: string) => unknown;
}

const json = (route: Route, data: unknown, status = 200) =>
  route.fulfill({
    status,
    contentType: "application/json",
    body: JSON.stringify(status < 400 ? { data } : data),
  });

const sse = (reply: string) =>
  [
    `event: meta\ndata: ${JSON.stringify({ conversationId: "c-new" })}\n\n`,
    ...reply
      .split(/(?<= )/)
      .map((t) => `data: ${JSON.stringify({ text: t })}\n\n`),
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
    lastPut: (key) =>
      [...api.puts].reverse().find((p) => p.key === key)?.data ?? undefined,
  };

  if (session) {
    await context.addCookies([{ name: "session", value: "e2e", url: baseURL }]);
  }

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
        body: sse(opts.aiReply ?? "Run out of dipakai dengan benda."),
      });
    }

    if (path === "/admin/tokens" && method === "GET") {
      return json(route, ADMIN_TOKENS);
    }
    if (path.startsWith("/admin/tokens/") && path.endsWith("/summary")) {
      return json(route, {
        knownCount: 86,
        srsCount: 80,
        ownSentenceCount: 4,
        customWordCount: 1,
        lastProgressAt: new Date().toISOString(),
        sessions: [],
      });
    }

    return json(route, { errors: [{ message: "not_mocked" }] }, 404);
  });

  return api;
};

/** Records every text the app asks the browser to speak. */
export const spyOnSpeech = (page: Page) =>
  page.addInitScript(() => {
    const w = window as unknown as { __spoken: string[] };
    w.__spoken = [];
    const synth = window.speechSynthesis;
    if (!synth) return;
    const orig = synth.speak.bind(synth);
    synth.speak = (u: SpeechSynthesisUtterance) => {
      w.__spoken.push(u.text);
      try {
        orig(u);
      } catch {
        /* headless voices may be missing */
      }
    };
  });

export const spoken = (page: Page) =>
  page.evaluate(
    () => (window as unknown as { __spoken: string[] }).__spoken ?? [],
  );
