import { redirect } from "next/navigation";

import { ROUTES } from "@/routes";

// Unknown paths went to /plan in the SPA as well.
const NotFound = () => redirect(ROUTES.PLAN);

export default NotFound;
