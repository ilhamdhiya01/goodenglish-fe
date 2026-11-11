import { useCallback, useEffect, useState } from "react";

// Chrome/Edge/Android only; not in lib.dom yet.
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

// "Install GoodEnglish" (PWA). The browser fires `beforeinstallprompt` only
// when the app is installable and not installed yet, so `canInstall` stays
// false on Safari/Firefox and inside the installed app.
export const useInstallPrompt = () => {
  const [event, setEvent] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const onPrompt = (e: Event) => {
      // Keep it for our own button instead of the browser's mini-infobar.
      e.preventDefault();
      setEvent(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => setEvent(null);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const install = useCallback(async () => {
    if (!event) return;
    await event.prompt();
    await event.userChoice;
    // A prompt can be shown once; the browser offers a new one if dismissed.
    setEvent(null);
  }, [event]);

  return { canInstall: !!event, install };
};
