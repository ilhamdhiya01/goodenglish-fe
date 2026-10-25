import { create } from "zustand";

import type { SessionData } from "@/lib/types/session.types";

interface AccessState {
  session: SessionData | null;
}

interface AccessActions {
  setSession: (session: SessionData | null) => void;
}

type AccessStore = AccessState & AccessActions;

const InitialState: AccessState = {
  session: null,
};

// The current device session (label, role, allowed menus/levels). Filled once
// by AppShell from GET /auth/me; read by the tabs, level picker and search to
// hide what this token may not open.
export const useAccessStore = create<AccessStore>((set) => ({
  ...InitialState,
  setSession: (session) => set({ session }),
}));
