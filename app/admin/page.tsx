import { redirect } from "next/navigation";

import { ROUTES } from "@/routes";

const AdminIndex = () => redirect(ROUTES.ADMIN_TOKENS);

export default AdminIndex;
