"use client";

import classNames from "classnames";
import React, { useEffect, useRef, useState } from "react";
import {
  LuChevronLeft,
  LuHistory,
  LuPlus,
  LuSendHorizontal,
  LuSquare,
  LuTrash2,
  LuX,
} from "react-icons/lu";

import Jalak from "@/components/brand/Jalak";
import AiText from "@/components/features/ai/AiText";
import Button from "@/components/ui/button";
import Card from "@/components/ui/card";
import IconButton from "@/components/ui/icon-button";
import { FIELD_CLASS } from "@/components/ui/input/Input";
import SectionLabel from "@/components/ui/section-label";
import SpeakButton from "@/components/ui/speak-button";
import { accessErrorText } from "@/const/access.constant";
import { formatDateTime } from "@/lib/helpers/date.helper";
import {
  MAX_QUESTION,
  stopAiAnswer,
  useAiChat,
  useAiConversationActions,
  useAiConversations,
  useAiUsage,
} from "@/lib/hooks/ai/useAiChat";
import { useAiSuggestions } from "@/lib/hooks/ai/useAiSuggestions";
import { useMediaQuery } from "@/lib/hooks/useMediaQuery";
import type { AiMessage } from "@/lib/types/ai.types";
import { useAiChatStore } from "@/stores/useAiChatStore";
import { confirmDialog, useConfirmStore } from "@/stores/useConfirmStore";

// Wide screens: the panel sits beside the page and pushes it aside (see
// AppShell); narrower ones get a drawer / full screen over the page.
export const AI_PUSH_QUERY = "(min-width: 68.75rem)";

interface BubbleProps {
  m: AiMessage;
  busy: boolean;
  /** The answer still streaming in: shows a block cursor at its end. */
  live?: boolean;
  /** For a reply: the learner's message it answers. */
  question?: string;
}

const Bubble = React.memo(({ m, busy, live, question }: BubbleProps) => {
  if (m.role === "user")
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-xl rounded-br-sm bg-accent px-3.5 py-2.5 text-[15px] leading-[22px] font-bold wrap-anywhere whitespace-pre-wrap text-on-accent">
          {m.text}
        </div>
      </div>
    );
  return (
    <div
      className={classNames(
        "max-w-[92%] rounded-xl rounded-bl-sm border-2 px-3.5 py-2.5 text-[15px] leading-[22px] wrap-anywhere",
        m.error
          ? "border-bad-line bg-bad-bg text-ink"
          : "border-line bg-surface text-ink",
      )}
    >
      {m.error ? (
        <div className="flex items-center gap-3">
          <Jalak mood="sedih" size={48} />
          <AiText text={m.text} question={question} />
        </div>
      ) : m.text ? (
        <>
          <AiText text={m.text} question={question} />
          {live && (
            <span
              aria-hidden
              className="ml-0.5 inline-block h-4 w-2 animate-pulse rounded-[2px] bg-accent align-[-2px]"
            />
          )}
        </>
      ) : (
        <span className="flex items-center gap-3 text-[13px] font-bold text-ink-2">
          {live && <Jalak mood="berpikir" size={48} />}
          {busy ? "Sedang berpikir…" : "—"}
        </span>
      )}
    </div>
  );
});
Bubble.displayName = "Bubble";

interface HistoryProps {
  currentId: string | null;
  onOpen: (id: string) => void;
  onDelete: (id: string) => void;
}

// "Riwayat": percakapan tersimpan milik token ini, yang terbaru di atas.
const History = ({ currentId, onOpen, onDelete }: HistoryProps) => {
  const { data, isLoading, isError } = useAiConversations(true);
  if (isLoading)
    return (
      <p className="m-0 text-[13px] font-bold text-ink-2">Memuat riwayat…</p>
    );
  if (isError)
    return (
      <Card tone="redBg" pad="sm">
        <span className="text-[13.5px] font-bold text-ink">
          {accessErrorText("ai_failed")}
        </span>
      </Card>
    );
  if (!data?.length)
    return (
      <p className="m-0 text-[15px] leading-[22px] text-ink-2">
        Belum ada percakapan tersimpan.
      </p>
    );
  return (
    <ul className="m-0 flex list-none flex-col p-0">
      {data.map((c) => (
        <li
          key={c.id}
          className={classNames(
            "flex items-center gap-2 border-b-2 py-1",
            c.id === currentId ? "border-accent-line" : "border-line",
          )}
        >
          <button
            type="button"
            aria-current={c.id === currentId ? "true" : undefined}
            onClick={() => onOpen(c.id)}
            // Plain block layout, not flex: some Safari versions don't lay a
            // <button> out as a flex box, and the long title then spills out
            // of the row instead of ending in "…".
            className="block min-h-12 min-w-0 flex-1 cursor-pointer overflow-hidden rounded-md bg-transparent px-2 py-2 text-left focus-ring hover:bg-sunken"
          >
            <span
              className={classNames(
                "block w-full truncate text-[15px] font-extrabold",
                c.id === currentId ? "text-accent-edge" : "text-ink",
              )}
            >
              {c.title}
            </span>
            <span className="mt-0.5 block w-full truncate text-[12.5px] font-bold text-ink-2">
              {formatDateTime(c.updatedAt)} · {c.messageCount} pesan
            </span>
          </button>
          <IconButton
            aria-label={`Hapus percakapan: ${c.title}`}
            onClick={() =>
              void confirmDialog({
                title: "Hapus percakapan ini?",
                message: c.title,
                confirmLabel: "Hapus",
                tone: "danger",
              }).then((ok) => ok && onDelete(c.id))
            }
          >
            <LuTrash2 aria-hidden size={17} />
          </IconButton>
        </li>
      ))}
    </ul>
  );
};

// "Tanya AI": panel percakapan, dibuka dari tombol di bar atas. Hanya
// dirender AppShell untuk token yang punya menu "ai". ≥1100px panel 400px di
// kanan yang menggeser isi (klik di halaman tidak menutupnya); lebih sempit:
// drawer / layar penuh yang tertutup saat menekan di luarnya.
const AiChat = React.memo(() => {
  const open = useAiChatStore((s) => s.open);
  const messages = useAiChatStore((s) => s.messages);
  const word = useAiChatStore((s) => s.word);
  const busy = useAiChatStore((s) => s.busy);
  const pending = useAiChatStore((s) => s.pending);
  const view = useAiChatStore((s) => s.view);
  const conversationId = useAiChatStore((s) => s.conversationId);
  const { setOpen, setView, clearWord, reset, hydrate, takePending } =
    useAiChatStore.getState();
  const { ask } = useAiChat();
  const { open: openSaved, remove: removeSaved } = useAiConversationActions();
  const [historyError, setHistoryError] = useState("");
  const usage = useAiUsage(open);
  // From the page in view and the words this learner keeps forgetting.
  const pageIdeas = useAiSuggestions();

  const [draft, setDraft] = useState("");
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const panelRef = useRef<HTMLElement>(null);

  // Reopen the thread this device had open (its messages live on the
  // server). One deleted elsewhere is simply forgotten.
  useEffect(() => {
    const id = hydrate();
    if (id) openSaved(id).catch(() => undefined);
  }, [hydrate, openSaved]);

  const openConversation = (id: string) => {
    setHistoryError("");
    openSaved(id).catch((e: Error) =>
      setHistoryError(accessErrorText(e.message)),
    );
  };
  const deleteConversation = (id: string) => {
    setHistoryError("");
    removeSaved(id).catch((e: Error) =>
      setHistoryError(accessErrorText(e.message)),
    );
  };

  // Opened from a word card: send its sentence for checking right away
  // ("cek AI"), or get ready for a question about it ("tanya AI").
  useEffect(() => {
    if (!open || !pending) return;
    const p = takePending();
    if (p?.text) void ask(p.text, p.mistake);
    else inputRef.current?.focus();
  }, [open, pending, takePending, ask]);

  // Escape or any press outside the panel closes it. A document listener
  // rather than a backdrop, so that same press still reaches the page — e.g.
  // another word card's "tanya AI" closes the panel and reopens it on that
  // word in one click.
  const push = useMediaQuery(AI_PUSH_QUERY);
  useEffect(() => {
    if (!open) return;
    // A confirm dialog opened from the panel ("Hapus percakapan ini?") sits
    // outside it in the DOM: pressing its buttons or Escape answers the
    // dialog and must not close the panel too.
    const asking = () => !!useConfirmStore.getState().request;
    const onKey = (e: KeyboardEvent) =>
      e.key === "Escape" && !asking() && setOpen(false);
    const onPointer = (e: PointerEvent) => {
      const t = e.target as Element;
      // The top bar's "Tanya AI" button toggles the panel itself, and beside
      // the page (push mode) the page stays usable while it's open.
      if (push || asking() || t.closest?.("[data-ai-trigger]")) return;
      if (!panelRef.current?.contains(t)) setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [open, setOpen, push]);

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

  const lastId = messages[messages.length - 1]?.id;
  // Out of questions for today: say so, and the field stays closed until
  // tomorrow (history can still be opened).
  const quotaOut = !!usage && usage.limit !== null && usage.used >= usage.limit;

  if (!open) return null;
  return (
    <aside
      ref={panelRef}
      role="dialog"
      aria-label="Tanya AI"
      className={classNames(
        "fixed inset-y-0 right-0 z-50 flex w-full flex-col bg-surface md:w-[400px] md:border-l-2 md:border-line",
        // Over the page below 1100px; beside it (no shadow) above.
        !push && "md:shadow-overlay",
        push && "z-30",
      )}
    >
      {/* Same height as the page's top bar (--shell-top), so both bottom
          lines meet in one straight line. */}
      <header className="flex h-(--shell-top) shrink-0 items-center gap-2 border-b-2 border-line px-4 pt-[env(safe-area-inset-top)]">
        <span className="flex-1 text-xl leading-[26px] font-black whitespace-nowrap text-ink">
          {view === "history" ? "Riwayat" : "Tanya AI"}
        </span>
        <span
          title={quotaText}
          className="hidden min-h-[30px] min-w-0 shrink items-center rounded-full border-2 border-line px-2.5 text-[12px] font-extrabold text-ink-2 sm:inline-flex"
        >
          <span className="truncate">{quotaText}</span>
        </span>
        {view === "chat" && messages.length > 0 && (
          <IconButton
            aria-label="Percakapan baru"
            title="Percakapan baru"
            onClick={reset}
            disabled={busy}
          >
            <LuPlus aria-hidden size={18} />
          </IconButton>
        )}
        <IconButton
          aria-label={view === "history" ? "Kembali" : "Riwayat"}
          title={view === "history" ? "Kembali" : "Riwayat"}
          active={view === "history"}
          onClick={() => {
            setHistoryError("");
            setView(view === "history" ? "chat" : "history");
          }}
          disabled={busy}
        >
          {view === "history" ? (
            <LuChevronLeft aria-hidden size={18} />
          ) : (
            <LuHistory aria-hidden size={18} />
          )}
        </IconButton>
        <IconButton
          aria-label="Tutup"
          title="Tutup"
          onClick={() => setOpen(false)}
        >
          <LuX aria-hidden size={18} />
        </IconButton>
      </header>
      {/* The quota line moves under the header on narrow phones. */}
      <span className="border-b-2 border-line px-4 py-1.5 text-[12.5px] font-bold text-ink-2 sm:hidden">
        {quotaText}
      </span>

      <div
        ref={listRef}
        className="flex flex-1 flex-col gap-3 overflow-y-auto px-4 py-4"
      >
        {historyError && (
          <Card tone="redBg" pad="sm">
            <span className="text-[13.5px] font-bold text-ink">
              {historyError}
            </span>
          </Card>
        )}
        {view === "history" && (
          <History
            currentId={conversationId}
            onOpen={openConversation}
            onDelete={deleteConversation}
          />
        )}
        {view === "chat" && messages.length === 0 && (
          <div className="flex flex-col gap-3">
            {/* With the quota gone, the sad face on the quota card is enough. */}
            {!quotaOut && <Jalak mood="bicara" />}
            <p className="m-0 text-[15px] leading-[22px] text-ink-2">
              Tanya apa saja soal bahasa Inggris dan materi GoodEnglish, atau
              tulis kalimat bahasa Inggrismu untuk dicek apakah sudah benar.
            </p>
            <div className="flex flex-col gap-2">
              {ideas.map((q) => (
                <button
                  type="button"
                  key={q}
                  onClick={() => void ask(q)}
                  className="min-h-11 press cursor-pointer rounded-lg border-2 border-control bg-surface px-3.5 py-2.5 text-left text-sm font-extrabold text-ink edge focus-ring [--edge:var(--color-control)] hover:bg-sunken"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}
        {view === "chat" &&
          messages.map((m, i) => (
            <React.Fragment key={m.id}>
              {m.role === "user" && m.word && (
                <span className="self-end rounded-[7px] bg-chip px-2 py-0.5 text-[12px] font-extrabold text-ink-2">
                  Kata: {m.word.word}
                </span>
              )}
              <Bubble
                m={m}
                busy={busy}
                live={busy && m.id === lastId && m.role === "model"}
                question={
                  m.role === "model" && messages[i - 1]?.role === "user"
                    ? messages[i - 1].text
                    : undefined
                }
              />
            </React.Fragment>
          ))}
      </div>

      {view === "chat" && (
        <footer className="flex flex-col gap-2 border-t-2 border-line px-4 pt-3 pb-[max(12px,env(safe-area-inset-bottom))]">
          {word && (
            <div className="flex">
              <span className="inline-flex min-w-0 items-center gap-1.5 rounded-full border-2 border-accent-line bg-accent-tint py-0.5 pr-1 pl-2.5 text-[13px] font-extrabold text-accent-edge">
                <span className="truncate">Kata: {word.word}</span>
                <SpeakButton nested size={26} icon={12} text={word.word} />
                <button
                  type="button"
                  aria-label="Lepas kata"
                  onClick={clearWord}
                  className="hit-44 inline-flex h-6 w-6 cursor-pointer items-center justify-center rounded-full bg-transparent text-accent-edge focus-ring"
                >
                  <LuX aria-hidden size={14} />
                </button>
              </span>
            </div>
          )}
          {quotaOut && (
            <Card tone="redBg" pad="sm" className="flex-row items-center gap-3">
              <Jalak mood="sedih" size={48} />
              <span className="flex flex-col gap-1">
                <SectionLabel tone="red">KUOTA HARI INI HABIS</SectionLabel>
                <span className="text-[13.5px] leading-[19px] text-ink">
                  {accessErrorText("ai_quota_exceeded")}
                </span>
              </span>
            </Card>
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
              aria-label="Pertanyaan"
              disabled={quotaOut}
              placeholder="Tanya apa saja, atau tulis kalimatmu untuk dicek…"
              className={classNames(FIELD_CLASS, "max-h-40 flex-1 resize-none")}
            />
            {/* Icon only, like a chat app: a paper plane to send, a square
                to stop the answer that is still streaming. */}
            {busy ? (
              <Button
                variant="green"
                aria-label="Berhenti"
                title="Berhenti"
                onClick={stopAiAnswer}
                className="h-13 w-13 shrink-0 px-0"
              >
                <LuSquare aria-hidden size={20} fill="currentColor" />
              </Button>
            ) : (
              <Button
                variant="green"
                aria-label="Kirim"
                title="Kirim (Enter)"
                onClick={() => send()}
                disabled={quotaOut || !draft.trim()}
                className="h-13 w-13 shrink-0 px-0"
              >
                <LuSendHorizontal aria-hidden size={24} />
              </Button>
            )}
          </div>
        </footer>
      )}
    </aside>
  );
});

AiChat.displayName = "AiChat";

export default AiChat;
