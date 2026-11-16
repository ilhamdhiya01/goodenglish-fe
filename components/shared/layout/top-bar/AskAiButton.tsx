"use client";

import classNames from "classnames";
import React from "react";
import { LuSparkles } from "react-icons/lu";

import Button from "@/components/ui/button";
import { useAiChatStore } from "@/stores/useAiChatStore";

// Opens (or closes) the Tanya AI panel. Marked data-ai-trigger so the panel's
// "press outside closes" rule doesn't close and reopen it on the same press.
const AskAiButton = ({ className }: { className?: string }) => {
  const open = useAiChatStore((s) => s.open);
  const setOpen = useAiChatStore((s) => s.setOpen);
  return (
    <Button
      variant="outline"
      size="sm"
      data-ai-trigger
      aria-expanded={open}
      onClick={() => setOpen(!open)}
      className={classNames("text-accent-edge", className)}
    >
      <LuSparkles aria-hidden size={15} className="shrink-0" />
      Tanya AI
    </Button>
  );
};

export default AskAiButton;
