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
  ADMIN_TOKENS: "/admin/tokens",
  grammarSub: (sub: string) => `/grammar/${sub}`,
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

// Admin: access tokens
export const API_ADMIN_TOKENS = `${API_BASE_URL}/admin/tokens`;
export const API_ADMIN_TOKEN = (id: string) => `${API_ADMIN_TOKENS}/${id}`;
export const API_ADMIN_TOKEN_REVOKE = (id: string) =>
  `${API_ADMIN_TOKEN(id)}/revoke`;
export const API_ADMIN_TOKEN_ACTIVATE = (id: string) =>
  `${API_ADMIN_TOKEN(id)}/activate`;
export const API_ADMIN_TOKEN_SESSIONS = (id: string) =>
  `${API_ADMIN_TOKEN(id)}/sessions`;
export const API_ADMIN_TOKEN_SUMMARY = (id: string) =>
  `${API_ADMIN_TOKEN(id)}/summary`;

// Consumed by proxy.ts. Everything is private (needs a `session` cookie)
// unless listed here, so a forgotten page fails safe.
export const publicRoutes = [ROUTES.ACCESS] as const;
