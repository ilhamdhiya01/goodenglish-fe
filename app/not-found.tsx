"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { ROUTES } from "@/routes";

// Unknown paths went to /plan in the SPA as well.
// Redirect on the client: calling redirect() during render trips React's
// dev-only performance tracks ("negative time stamp").
const NotFound = () => {
  const router = useRouter();

  useEffect(() => {
    router.replace(ROUTES.PLAN);
  }, [router]);

  return null;
};

export default NotFound;
