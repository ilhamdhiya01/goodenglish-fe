"use client";

import classNames from "classnames";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import React, { useEffect } from "react";
import { LuArrowLeft, LuLogOut } from "react-icons/lu";

import Logo from "@/components/brand/Logo";
import ListItem from "@/components/shared/patterns/list-item";
import SectionLabel from "@/components/ui/section-label";
import TextButton from "@/components/ui/text-button";
import { useLogout } from "@/lib/hooks/auth/useLogout";
import { useSession } from "@/lib/hooks/auth/useSession";
import { ROUTES } from "@/routes";

// [path, menu label, page heading]
type Section = readonly [path: string, label: string, heading: string];

// Menus grouped under a label, like the Skenario list.
const GROUPS: readonly (readonly [group: string, items: readonly Section[]])[] =
  [
    [
      "Kelola",
      [
        [ROUTES.ADMIN_TOKENS, "Token akses", "Kelola token akses"],
        [ROUTES.ADMIN_WORDS, "Kosakata", "Kosakata bersama"],
        [ROUTES.ADMIN_LISTENING, "Menyimak", "Bank soal Dengar & jawab"],
      ],
    ],
    ["Pengaturan", [[ROUTES.ADMIN_AI, "Tanya AI", "Pengaturan Tanya AI"]]],
  ];

const SECTIONS: readonly Section[] = GROUPS.flatMap(([, items]) => items);

const Brand = () => (
  <span className="flex items-center gap-2">
    <Logo size="sm" />
    <span className="text-[13px] leading-[18px] font-black tracking-[0.08em] text-ink-2">
      · ADMIN
    </span>
  </span>
);

interface AdminShellProps {
  children: React.ReactNode;
}

// Frame for /admin/*: only ADMIN tokens get past it (the backend enforces the
// same on every /admin endpoint).
// ≥700px: a menu card on the left that stays in view while the page scrolls
// (same rows as the Skenario list); <700px: the brand row, then the menus as
// a sticky row of tabs that scrolls sideways.
const AdminShell = React.memo(({ children }: AdminShellProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const { session, isError } = useSession();
  const current =
    SECTIONS.find(([path]) => pathname.startsWith(path)) ?? SECTIONS[0];
  const { handleLogout, isLoggingOut } = useLogout();
  const isAdmin = session?.role === "admin";

  useEffect(() => {
    if (isError) router.replace(ROUTES.ACCESS);
    else if (session && !isAdmin) router.replace(ROUTES.ROOT);
  }, [isError, session, isAdmin, router]);

  if (!isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center text-[12.5px] font-extrabold tracking-[0.07em] text-ink-2">
        MEMUAT…
      </div>
    );
  }

  return (
    <div className="mx-auto grid max-w-[1280px] grid-cols-1 gap-x-6 px-[clamp(14px,3vw,28px)] pt-[clamp(14px,3vw,28px)] pb-20 md:grid-cols-[232px_minmax(0,1fr)] md:items-start lg:grid-cols-[260px_minmax(0,1fr)]">
      {/* ≥700px: menu on the left. */}
      <aside
        aria-label="Menu admin"
        className="sticky top-[clamp(14px,3vw,28px)] hidden max-h-[calc(100dvh-2*clamp(14px,3vw,28px))] flex-col gap-3 overflow-y-auto rounded-xl border-2 border-line bg-surface p-2 md:flex"
      >
        <header className="px-3 pt-2 pb-1">
          <Brand />
        </header>
        <nav aria-label="Halaman admin" className="flex flex-col gap-3">
          {GROUPS.map(([group, items]) => (
            <div key={group} className="flex flex-col gap-1">
              <SectionLabel
                tone={items.some(([p]) => p === current[0]) ? "green" : "muted"}
                className="px-3 pt-1.5"
              >
                {group.toUpperCase()}
              </SectionLabel>
              {items.map(([path, label]) => (
                <ListItem key={path} href={path} active={path === current[0]}>
                  {label}
                </ListItem>
              ))}
            </div>
          ))}
        </nav>
        <div className="mt-1 flex flex-col gap-1 border-t-2 border-line pt-2">
          <ListItem href={ROUTES.ROOT}>
            <span className="flex items-center gap-2">
              <LuArrowLeft aria-hidden size={16} />
              Kembali ke app
            </span>
          </ListItem>
          <ListItem onClick={() => handleLogout()} muted>
            <span className="flex items-center gap-2">
              <LuLogOut aria-hidden size={16} />
              {isLoggingOut ? "Keluar…" : "Keluar"}
            </span>
          </ListItem>
        </div>
      </aside>

      <div className="flex min-w-0 flex-col gap-6">
        {/* <700px: brand + exits, then the menus as tabs. */}
        <header className="flex items-center justify-between gap-4 md:hidden">
          <Brand />
          <div className="flex items-center gap-4">
            <Link
              href={ROUTES.ROOT}
              className="hit-44 rounded-sm text-sm font-extrabold text-accent-edge focus-ring"
            >
              ← App
            </Link>
            <TextButton
              className="hit-44"
              disabled={isLoggingOut}
              onClick={() => handleLogout()}
            >
              Keluar
            </TextButton>
          </div>
        </header>
        <nav
          aria-label="Halaman admin"
          className="sticky top-0 z-20 -mx-[clamp(14px,3vw,28px)] -mt-2 flex [scrollbar-width:none] gap-2 overflow-x-auto border-b-2 border-line bg-paper px-[clamp(14px,3vw,28px)] py-2.5 md:hidden"
        >
          {SECTIONS.map(([path, label]) => (
            <Link
              key={path}
              href={path}
              aria-current={path === current[0] ? "page" : undefined}
              className={classNames(
                "inline-flex min-h-10 shrink-0 items-center rounded-md border-2 px-3.5 text-sm font-extrabold whitespace-nowrap no-underline focus-ring transition-colors",
                path === current[0]
                  ? "border-accent-line bg-accent-tint text-accent-edge"
                  : "border-transparent text-ink hover:bg-sunken",
              )}
            >
              {label}
            </Link>
          ))}
        </nav>

        <main className="flex flex-col gap-6">
          <h1 className="m-0 text-2xl leading-[30px] font-black tracking-[-0.02em] text-ink md:text-[30px] md:leading-9">
            {current[2]}
          </h1>
          {children}
        </main>
      </div>
    </div>
  );
});

AdminShell.displayName = "AdminShell";

export default AdminShell;
