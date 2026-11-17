import { redirect } from "next/navigation";

import { ROUTES } from "@/routes";

const ListeningIndex = () => redirect(ROUTES.listeningTab("dikte"));

export default ListeningIndex;
