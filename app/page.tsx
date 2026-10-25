import { redirect } from "next/navigation";

import { ROUTES } from "@/routes";

const RootPage = () => redirect(ROUTES.PLAN);

export default RootPage;
