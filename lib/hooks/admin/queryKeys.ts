export const adminTokenKeys = {
  all: ["admin-tokens"] as const,
  list: () => [...adminTokenKeys.all, "list"] as const,
  summary: (id: string) => [...adminTokenKeys.all, "summary", id] as const,
};
