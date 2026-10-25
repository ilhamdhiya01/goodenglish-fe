import { default as AdminShell } from "./AdminShell";
import { default as TokenManager } from "./TokenManager";

export const Admin = { AdminShell, TokenManager } as const;
