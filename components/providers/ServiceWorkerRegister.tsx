"use client";

import { useEffect } from "react";

// Registers public/sw.js, which makes the app installable (PWA) and caches the
// hashed static files. Production only: in `next dev` a cached chunk would
// hide code changes.
const ServiceWorkerRegister = () => {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {
      // Not installable then, but the site itself works the same.
    });
  }, []);
  return null;
};

export default ServiceWorkerRegister;
