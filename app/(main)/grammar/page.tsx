import { redirect } from "next/navigation";

import { ROUTES } from "@/routes";

const GrammarIndex = () => redirect(ROUTES.grammarSub("istilah"));

export default GrammarIndex;
