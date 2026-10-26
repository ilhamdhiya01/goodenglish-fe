"use client";

import classNames from "classnames";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import React, { useEffect } from "react";

import { useLogout } from "@/lib/hooks/auth/useLogout";
import { useSession } from "@/lib/hooks/auth/useSession";
import { ROUTES } from "@/routes";

// [path, tab label, page heading]
const SECTIONS = [
  [ROUTES.ADMIN_TOKENS, "Token akses", "Kelola token akses"],
  [ROUTES.ADMIN_WORDS, "Kosakata", "Kosakata bersama"],
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
      <div className="flex min-h-screen items-center justify-center font-mono text-xs tracking-[0.08em] text-muted">
        MEMUAT…
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-[1280px] flex-col gap-7 px-[clamp(14px,3vw,28px)] pt-[clamp(18px,4vw,36px)] pb-20">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b-2 border-ink pb-6">
        <div className="flex flex-col gap-2">
          <span className="font-mono text-xs font-medium tracking-[0.12em] text-ink">
            GOODENGLISH · ADMIN
          </span>
          <h1 className="m-0 text-[clamp(28px,4vw,40px)] leading-none font-bold tracking-[-0.025em]">
            {current[2]}
          </h1>
          <nav className="mt-2 flex gap-2">
            {SECTIONS.map(([path, label]) => (
              <Link
                key={path}
                href={path}
                className={classNames(
                  "rounded-full border-[1.5px] border-ink px-3.5 py-1 text-[13px] font-semibold",
                  path === current[0]
                    ? "bg-ink text-paper"
                    : "bg-card text-ink",
                )}
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <Link href={ROUTES.ROOT} className="text-sm font-semibold">
            ← Kembali ke app
          </Link>
          <button
            type="button"
            disabled={isLoggingOut}
            onClick={() => handleLogout()}
            className="cursor-pointer border-b border-dotted border-faint bg-transparent p-0 text-[12.5px] text-muted"
          >
            Keluar
          </button>
        </div>
      </header>
      {children}
    </div>
  );
});

AdminShell.displayName = "AdminShell";

export default AdminShell;
