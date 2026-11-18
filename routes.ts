// Application paths (client-side navigation).
export const ROUTES = {
  ROOT: "/",
  ACCESS: "/access",
  PLAN: "/plan",
  VOCAB: "/vocab",
  REVIEW: "/review",
  SCENARIO: "/scenario",
  ERRORS: "/errors",
  GRAMMAR: "/grammar",
  PRONUNCIATION: "/pronunciation",
  CHEATSHEET: "/cheatsheet",
  ROLEPLAY_HISTORY: "/scenario/history",
  LISTENING: "/listening",
  ADMIN_LISTENING: "/admin/listening",
  READING: "/reading",
  ADMIN_READING: "/admin/reading",
  ADMIN_TOKENS: "/admin/tokens",
  ADMIN_WORDS: "/admin/words",
  ADMIN_AI: "/admin/ai",
  grammarSub: (sub: string) => `/grammar/${sub}`,
  roleplay: (scenarioId: string) => `/scenario/roleplay/${scenarioId}`,
  listeningTab: (tab: string) => `/listening/${tab}`,
  readingText: (id: string) => `/reading/${id}`,
} as const;

// API endpoints (consumed by services/*.service.ts)
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

// Auth (access token → device session)
export const API_AUTH = `${API_BASE_URL}/auth`;
export const API_AUTH_REDEEM = `${API_AUTH}/redeem`;
export const API_AUTH_LOGOUT = `${API_AUTH}/logout`;
export const API_AUTH_ME = `${API_AUTH}/me`;

// Learning progress (one document per former localStorage key)
export const API_PROGRESS = `${API_BASE_URL}/me/progress`;
export const API_PROGRESS_KEY = (key: string) => `${API_PROGRESS}/${key}`;

// Shared vocabulary added by admins (read by everyone, written by admins)
export const API_WORDS = `${API_BASE_URL}/words`;
export const API_ADMIN_WORDS = `${API_BASE_URL}/admin/words`;
export const API_ADMIN_WORD = (id: string) => `${API_ADMIN_WORDS}/${id}`;

// "Tanya AI" (Gemini, proxied by the backend)
export const API_AI_CHAT = `${API_BASE_URL}/ai/chat`;
export const API_AI_USAGE = `${API_BASE_URL}/ai/usage`;
export const API_AI_CONVERSATIONS = `${API_BASE_URL}/ai/conversations`;
export const API_AI_CONVERSATION = (id: string) =>
  `${API_AI_CONVERSATIONS}/${id}`;

// "Main peran" (voice roleplay with the AI inside Skenario)
export const API_ROLEPLAY_USAGE = `${API_BASE_URL}/roleplay/usage`;
export const API_ROLEPLAY_SESSIONS = `${API_BASE_URL}/roleplay/sessions`;
export const API_ROLEPLAY_TURN = (id: string) =>
  `${API_ROLEPLAY_SESSIONS}/${id}/turn`;
export const API_ROLEPLAY_HELP = (id: string) =>
  `${API_ROLEPLAY_SESSIONS}/${id}/help`;
export const API_ROLEPLAY_TRANSCRIBE = (id: string) =>
  `${API_ROLEPLAY_SESSIONS}/${id}/transcribe`;
export const API_ROLEPLAY_FINISH = (id: string) =>
  `${API_ROLEPLAY_SESSIONS}/${id}/finish`;

// "Menyimak": published Dengar & jawab items (learners) and the admin bank
export const API_LISTENING_ITEMS = `${API_BASE_URL}/listening/items`;
export const API_ADMIN_LISTENING = `${API_BASE_URL}/admin/listening`;
export const API_ADMIN_LISTENING_GENERATE = `${API_ADMIN_LISTENING}/generate`;
export const API_ADMIN_LISTENING_ITEM = (id: string) =>
  `${API_ADMIN_LISTENING}/${id}`;
export const API_ADMIN_LISTENING_PUBLISH = (id: string) =>
  `${API_ADMIN_LISTENING_ITEM(id)}/publish`;
export const API_ADMIN_LISTENING_UNPUBLISH = (id: string) =>
  `${API_ADMIN_LISTENING_ITEM(id)}/unpublish`;

// "Bacaan": published texts + tap-a-word meanings (learners), admin texts
export const API_READING_TEXTS = `${API_BASE_URL}/reading/texts`;
export const API_READING_LOOKUP = `${API_BASE_URL}/reading/lookup`;
export const API_ADMIN_READING = `${API_BASE_URL}/admin/reading`;
export const API_ADMIN_READING_GENERATE = `${API_ADMIN_READING}/generate`;
export const API_ADMIN_READING_TEXT = (id: string) =>
  `${API_ADMIN_READING}/${id}`;
export const API_ADMIN_READING_PUBLISH = (id: string) =>
  `${API_ADMIN_READING_TEXT(id)}/publish`;
export const API_ADMIN_READING_UNPUBLISH = (id: string) =>
  `${API_ADMIN_READING_TEXT(id)}/unpublish`;

// Speech-to-text for "Betulkan kalimat" cards in Ulang
export const API_STT_TRANSCRIBE = `${API_BASE_URL}/stt/transcribe`;

// Admin: Gemini key + model behind Tanya AI
export const API_ADMIN_AI_SETTINGS = `${API_BASE_URL}/admin/ai-settings`;
export const API_ADMIN_AI_KEY = `${API_ADMIN_AI_SETTINGS}/key`;
export const API_ADMIN_AI_MODELS = `${API_ADMIN_AI_SETTINGS}/models`;
export const API_ADMIN_AI_MODELS_PREVIEW = `${API_ADMIN_AI_MODELS}/preview`;

// Admin: access tokens
export const API_ADMIN_TOKENS = `${API_BASE_URL}/admin/tokens`;
export const API_ADMIN_TOKEN = (id: string) => `${API_ADMIN_TOKENS}/${id}`;
export const API_ADMIN_TOKEN_REVOKE = (id: string) =>
  `${API_ADMIN_TOKEN(id)}/revoke`;
export const API_ADMIN_TOKEN_ACTIVATE = (id: string) =>
  `${API_ADMIN_TOKEN(id)}/activate`;
export const API_ADMIN_TOKEN_REGENERATE = (id: string) =>
  `${API_ADMIN_TOKEN(id)}/regenerate`;
export const API_ADMIN_TOKEN_SESSIONS = (id: string) =>
  `${API_ADMIN_TOKEN(id)}/sessions`;
export const API_ADMIN_TOKEN_SUMMARY = (id: string) =>
  `${API_ADMIN_TOKEN(id)}/summary`;

// Consumed by proxy.ts. Everything is private (needs a `session` cookie)
// unless listed here, so a forgotten page fails safe.
export const publicRoutes = [ROUTES.ACCESS] as const;
