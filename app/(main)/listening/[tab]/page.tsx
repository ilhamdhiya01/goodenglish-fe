import { redirect } from "next/navigation";

import { Listening } from "@/components/features/listening";
import { LISTENING_TABS, type ListeningTab } from "@/lib/types/listening.types";
import { ROUTES } from "@/routes";

// Tabs live in the URL (/listening/dikte, …); unknown ones go to Dikte.
const ListeningTabPage = async ({
  params,
}: {
  params: Promise<{ tab: string }>;
}) => {
  const { tab } = await params;
  if (!LISTENING_TABS.some((t) => t.id === tab)) {
    redirect(ROUTES.listeningTab("dikte"));
  }
  return <Listening.ListeningPage tab={tab as ListeningTab} />;
};

export default ListeningTabPage;
