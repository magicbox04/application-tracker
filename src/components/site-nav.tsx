"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense } from "react";

const LINKS = [
  { href: "/", label: "Applications" },
  { href: "/stats", label: "Stats" },
] as const;

function isActive(pathname: string | null, href: string): boolean {
  if (pathname === null) return false;
  return href === "/"
    ? pathname === "/" || pathname.startsWith("/applications")
    : pathname.startsWith(href);
}

function NavLinks({ pathname }: { pathname: string | null }) {
  return (
    <>
      {LINKS.map(({ href, label }) => (
        <Link
          key={href}
          href={href}
          aria-current={isActive(pathname, href) ? "page" : undefined}
          className="rounded-md px-3 py-1.5 font-medium text-zinc-600 hover:bg-zinc-100 aria-[current=page]:bg-zinc-100 aria-[current=page]:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:aria-[current=page]:bg-zinc-800 dark:aria-[current=page]:text-zinc-50"
        >
          {label}
        </Link>
      ))}
    </>
  );
}

function ActiveNavLinks() {
  return <NavLinks pathname={usePathname()} />;
}

export function SiteNav() {
  return (
    <nav aria-label="Main" className="border-b border-zinc-200 dark:border-zinc-800">
      <div className="mx-auto flex w-full max-w-4xl items-center gap-1 px-4 py-2 text-sm">
        {/* The current path is request data on dynamic routes, so with Cache
            Components it must sit under Suspense. The fallback is the same
            links without the active highlight, so nothing shifts. */}
        <Suspense fallback={<NavLinks pathname={null} />}>
          <ActiveNavLinks />
        </Suspense>
      </div>
    </nav>
  );
}
