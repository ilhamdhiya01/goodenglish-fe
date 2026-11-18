export const adminTokenKeys = {
  all: ["admin-tokens"] as const,
  list: () => [...adminTokenKeys.all, "list"] as const,
  summary: (id: string) => [...adminTokenKeys.all, "summary", id] as const,
  progress: (id: string) => [...adminTokenKeys.all, "progress", id] as const,
  learners: () => [...adminTokenKeys.all, "learners"] as const,
};
