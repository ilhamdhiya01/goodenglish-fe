"use client";

import { useEffect } from "react";

import { useVoiceStore } from "@/stores/useVoiceStore";

// Subscribes to `voiceschanged` once: Chrome loads TTS voices asynchronously,
// so the store has to refresh when the browser finishes loading them.
const VoiceBootstrap = () => {
  const init = useVoiceStore((s) => s.init);
  useEffect(() => {
    init();
  }, [init]);
  return null;
};

export default VoiceBootstrap;
