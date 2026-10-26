import { default as AdminShell } from "./AdminShell";
import { default as TokenManager } from "./TokenManager";
import { default as WordManager } from "./WordManager";

export const Admin = { AdminShell, TokenManager, WordManager } as const;
