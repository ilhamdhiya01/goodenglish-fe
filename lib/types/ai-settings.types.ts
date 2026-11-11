// GET /admin/ai-settings — never carries the key itself.
export interface AiSettings {
  hasKey: boolean;
  /** Last 4 characters of the stored key. */
  last4: string | null;
  model: string;
  /** False when a key is stored but the server can no longer decrypt it. */
  keyReadable: boolean;
  /** ENCRYPTION_KEY is set on the server, so a key can be saved. */
  encryptionReady: boolean;
  updatedBy: string | null;
  updatedAt: string | null;
}

export interface AiModelOption {
  id: string;
  label: string;
}

// GET /admin/ai-settings/models, POST …/models/preview
export interface AiModels {
  /** "live" = asked from Google; "catalog" = built-in fallback list. */
  source: "live" | "catalog";
  models: AiModelOption[];
  warning: string | null;
}

export interface SaveAiSettings {
  /** Omit to keep the stored key. */
  apiKey?: string;
  model: string;
}
