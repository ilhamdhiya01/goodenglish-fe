"use client";

import classNames from "classnames";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import React, { useEffect } from "react";

import TextButton from "@/components/ui/text-button";
import { useLogout } from "@/lib/hooks/auth/useLogout";
import { useSession } from "@/lib/hooks/auth/useSession";
import { ROUTES } from "@/routes";

// [path, tab label, page heading]
const SECTIONS = [
  [ROUTES.ADMIN_TOKENS, "Token akses", "Kelola token akses"],
  [ROUTES.ADMIN_WORDS, "Kosakata", "Kosakata bersama"],
  [ROUTES.ADMIN_AI, "Tanya AI", "Pengaturan Tanya AI"],
] as const;

interface AdminShellProps {
  children: React.ReactNode;
}

// Frame for /admin/*: only ADMIN tokens get past it (the backend enforces the
// same on every /admin endpoint).
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
    <div className="mx-auto flex max-w-[1280px] flex-col gap-6 px-[clamp(14px,3vw,28px)] pt-[clamp(18px,4vw,36px)] pb-20">
      <header className="flex flex-wrap items-start justify-between gap-4 border-b-2 border-line pb-5">
        <div className="flex flex-col gap-2">
          <span className="text-[13px] leading-[18px] font-black tracking-[0.08em] text-ink">
            GOOD<span className="text-accent-edge">ENGLISH</span> · ADMIN
          </span>
          <h1 className="m-0 text-2xl leading-[30px] font-black tracking-[-0.02em] text-ink md:text-[30px] md:leading-9">
            {current[2]}
          </h1>
          {/* Pill look on real links (Pill itself is a <button>). */}
          <nav className="mt-2 flex flex-wrap gap-2">
            {SECTIONS.map(([path, label]) => (
              <Link
                key={path}
                href={path}
                aria-current={path === current[0] ? "page" : undefined}
                className={classNames(
                  "hit-44 inline-flex min-h-[38px] items-center rounded-full border-2 px-4 text-sm font-extrabold no-underline focus-ring transition-colors",
                  path === current[0]
                    ? "border-accent-line bg-accent-tint text-accent-edge hover:text-accent-edge"
                    : "border-control bg-surface text-ink hover:bg-sunken hover:text-ink",
                )}
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-5">
          <Link
            href={ROUTES.ROOT}
            className="hit-44 rounded-sm text-sm font-extrabold text-accent-edge focus-ring"
          >
            ← Kembali ke app
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
      <main className="flex flex-col gap-6">{children}</main>
    </div>
  );
});

AdminShell.displayName = "AdminShell";

export default AdminShell;
