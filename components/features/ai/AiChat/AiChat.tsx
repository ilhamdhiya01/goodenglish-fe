"use client";

import classNames from "classnames";
import React, { useEffect, useRef, useState } from "react";

import AiText from "@/components/features/ai/AiText";
import SpeakButton from "@/components/ui/speak-button";
import { MAX_QUESTION, useAiChat, useAiUsage } from "@/lib/hooks/ai/useAiChat";
import { useAiSuggestions } from "@/lib/hooks/ai/useAiSuggestions";
import type { AiMessage } from "@/lib/types/ai.types";
import { useAiChatStore } from "@/stores/useAiChatStore";

const ChatIcon = ({ size = 24 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 12a8 8 0 0 1-11.8 7L4 20l1.1-4.4A8 8 0 1 1 21 12z" />
    <path d="M9 10h6M9 14h4" />
  </svg>
);

interface BubbleProps {
  m: AiMessage;
  busy: boolean;
  /** For a reply: the learner's message it answers. */
  question?: string;
}

const Bubble = React.memo(({ m, busy, question }: BubbleProps) => {
  if (m.role === "user")
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-2xl rounded-br-md bg-ink px-3.5 py-2.5 text-[14px] leading-[1.5] whitespace-pre-wrap text-paper">
          {m.text}
        </div>
      </div>
    );
  return (
    <div
      className={classNames(
        "max-w-[92%] rounded-2xl rounded-bl-md border px-3.5 py-2.5 text-[14px] leading-[1.55]",
        m.error
          ? "border-red-line bg-red-bg text-red-deep"
          : "border-line bg-card text-ink",
      )}
    >
      {m.text ? (
        <AiText text={m.text} question={question} />
      ) : (
        <span className="font-mono text-xs text-muted">
          {busy ? "Sedang berpikir…" : "—"}
        </span>
      )}
    </div>
  );
});
Bubble.displayName = "Bubble";

// "Tanya AI": tombol melayang di kanan bawah + panel percakapan. Hanya
// dirender AppShell untuk token yang punya menu "ai".
const AiChat = React.memo(() => {
  const open = useAiChatStore((s) => s.open);
  const messages = useAiChatStore((s) => s.messages);
  const word = useAiChatStore((s) => s.word);
  const busy = useAiChatStore((s) => s.busy);
  const pending = useAiChatStore((s) => s.pending);
  const { setOpen, clearWord, reset, hydrate, takePending } =
    useAiChatStore.getState();
  const { ask } = useAiChat();
  const usage = useAiUsage(open);
  // From the page in view and the words this learner keeps forgetting.
  const pageIdeas = useAiSuggestions();

  const [draft, setDraft] = useState("");
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const panelRef = useRef<HTMLElement>(null);

  useEffect(() => hydrate(), [hydrate]);

  // Opened from a word card: send its sentence for checking right away
  // ("cek AI"), or get ready for a question about it ("tanya AI").
  useEffect(() => {
    if (!open || !pending) return;
    const p = takePending();
    if (p?.text) void ask(p.text);
    else inputRef.current?.focus();
  }, [open, pending, takePending, ask]);

  // Escape or any press outside the panel closes it. A document listener
  // rather than a backdrop, so that same press still reaches the page — e.g.
  // another word card's "tanya AI" closes the panel and reopens it on that
  // word in one click.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const onPointer = (e: PointerEvent) => {
      if (!panelRef.current?.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [open, setOpen]);

  // Keep the newest message (and the streaming answer) in view.
  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, open]);

  const send = (text = draft) => {
    if (!text.trim() || busy) return;
    void ask(text);
    setDraft("");
  };

  const quotaText = !usage
    ? "Gemini"
    : usage.limit === null
      ? `tanpa batas · ${usage.used} pertanyaan hari ini`
      : `sisa ${Math.max(0, usage.limit - usage.used)} dari ${usage.limit} pertanyaan hari ini`;
  const ideas = word
    ? [
        `Apa bedanya "${word.word}" dengan kata yang mirip?`,
        `Beri 3 contoh kalimat sehari-hari dengan "${word.word}".`,
        `Kesalahan apa yang sering terjadi saat memakai "${word.word}"?`,
      ]
    : pageIdeas;

  return (
    <>
      {!open && (
        <button
          type="button"
          aria-label="Tanya AI"
          title="Tanya AI"
          onClick={() => setOpen(true)}
          className="fixed right-[max(16px,env(safe-area-inset-right))] bottom-[max(20px,env(safe-area-inset-bottom))] z-30 inline-flex h-14 w-14 cursor-pointer items-center justify-center rounded-full border-[1.5px] border-green-deep bg-green text-card shadow-[0_8px_24px_rgba(29,27,22,.22)] transition-colors hover:bg-green-deep"
        >
          <ChatIcon />
        </button>
      )}

      {open && (
        <>
          <aside
            ref={panelRef}
            role="dialog"
            aria-label="Tanya AI"
            className="fixed inset-y-0 right-0 z-50 flex w-full flex-col border-l-2 border-ink bg-paper shadow-[-12px_0_32px_rgba(29,27,22,.14)] sm:w-[420px]"
          >
            <header className="flex items-center gap-3 border-b border-line px-4 py-3">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-green text-card">
                <ChatIcon size={18} />
              </span>
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="text-[15px] font-bold">Tanya AI</span>
                <span className="font-mono text-[11px] text-muted">
                  {quotaText}
                </span>
              </div>
              {messages.length > 0 && (
                <button
                  type="button"
                  onClick={reset}
                  disabled={busy}
                  className="cursor-pointer border-0 border-b border-dotted border-faint bg-transparent p-0 text-[12px] text-muted"
                >
                  Percakapan baru
                </button>
              )}
              <button
                type="button"
                aria-label="Tutup"
                onClick={() => setOpen(false)}
                className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border-[1.5px] border-line-2 bg-card text-ink hover:border-ink"
              >
                ✕
              </button>
            </header>

            <div
              ref={listRef}
              className="flex flex-1 flex-col gap-3 overflow-y-auto px-4 py-4"
            >
              {messages.length === 0 && (
                <div className="flex flex-col gap-3">
                  <p className="m-0 text-[14px] leading-[1.55] text-ink-2">
                    Tanya apa saja soal bahasa Inggris dan materi GoodEnglish,
                    atau tulis kalimat bahasa Inggrismu untuk dicek apakah sudah
                    benar.
                  </p>
                  <div className="flex flex-col gap-1.5">
                    {ideas.map((q) => (
                      <button
                        type="button"
                        key={q}
                        onClick={() => void ask(q)}
                        className="cursor-pointer rounded-lg border border-line-2 bg-card px-3 py-2 text-left font-sans text-[13.5px] text-ink hover:border-green"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {messages.map((m, i) => (
                <Bubble
                  key={m.id}
                  m={m}
                  busy={busy}
                  question={
                    m.role === "model" && messages[i - 1]?.role === "user"
                      ? messages[i - 1].text
                      : undefined
                  }
                />
              ))}
            </div>

            <footer className="flex flex-col gap-2 border-t border-line px-4 pt-3 pb-[max(12px,env(safe-area-inset-bottom))]">
              {word && (
                <div className="flex">
                  <span className="inline-flex min-w-0 items-center gap-1 rounded-full bg-green-bg px-2.5 py-1 text-[12px] text-green-deep">
                    <span className="truncate">Kata: {word.word}</span>
                    <SpeakButton nested size={18} icon={9} text={word.word} />
                    <button
                      type="button"
                      aria-label="Lepas kata"
                      onClick={clearWord}
                      className="cursor-pointer border-0 bg-transparent p-0 text-green-deep"
                    >
                      ✕
                    </button>
                  </span>
                </div>
              )}
              <div className="flex items-end gap-2">
                <textarea
                  ref={inputRef}
                  value={draft}
                  rows={2}
                  maxLength={MAX_QUESTION}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      send();
                    }
                  }}
                  placeholder="Tanya apa saja, atau tulis kalimatmu untuk dicek…"
                  className="max-h-40 min-h-[44px] flex-1 resize-none rounded-lg border-[1.5px] border-line-2 bg-card px-3 py-2.5 font-sans text-[14px] text-ink outline-none focus:border-green"
                />
                <button
                  type="button"
                  onClick={() => send()}
                  disabled={busy || !draft.trim()}
                  className="h-11 cursor-pointer rounded-lg border-[1.5px] border-green bg-green px-4 text-[13.5px] font-semibold text-card disabled:cursor-default disabled:opacity-50"
                >
                  Kirim
                </button>
              </div>
            </footer>
          </aside>
        </>
      )}
    </>
  );
});

AiChat.displayName = "AiChat";

export default AiChat;
