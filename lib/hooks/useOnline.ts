import { useSyncExternalStore } from "react";

/** Whether the browser thinks it is online (navigator.onLine), live. */
export const useOnline = () =>
  useSyncExternalStore(
    (onChange) => {
      window.addEventListener("online", onChange);
      window.addEventListener("offline", onChange);
      return () => {
        window.removeEventListener("online", onChange);
        window.removeEventListener("offline", onChange);
      };
    },
    () => navigator.onLine,
    () => true,
  );
