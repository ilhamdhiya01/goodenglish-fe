import { useQuery } from "@tanstack/react-query";

import { getWords } from "@/services/words.service";

import { wordKeys } from "./queryKeys";

// Fetched once per page load (AppShell copies it into useSharedWordsStore);
// admin edits invalidate it so the list refreshes in place.
export const useWords = (enabled: boolean) => {
  const { data, isError } = useQuery({
    queryKey: wordKeys.all,
    queryFn: getWords,
    select: (r) => r.data ?? [],
    enabled,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });
  return { words: data, isError };
};
