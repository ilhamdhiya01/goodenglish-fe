import { useMutation, useQueryClient } from "@tanstack/react-query";

import { redeemToken } from "@/services/auth.service";

import { authKeys } from "./queryKeys";

export const useRedeemToken = () => {
  const queryClient = useQueryClient();
  const { mutateAsync, isPending, error } = useMutation({
    mutationFn: redeemToken,
    onSuccess: (res) => {
      queryClient.setQueryData(authKeys.session(), res);
    },
  });
  return { handleRedeem: mutateAsync, isRedeeming: isPending, error };
};
