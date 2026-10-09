"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { messages } from "@/messages/en";
import { ROUTES, type SiteConfig } from "@/lib/site-config";
import { isCurrentNavigationPath } from "@/lib/navigation";

type HeaderNavigationProps = Pick<SiteConfig, "name" | "navigation">;

export function HeaderNavigation({ name, navigation }: HeaderNavigationProps) {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isMenuOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
        menuButtonRef.current?.focus();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isMenuOpen]);

  function renderLinks(onNavigate?: () => void) {
    return navigation.map((item) => {
      const isCurrent = isCurrentNavigationPath(pathname, item.href);

      return (
        <li className="list-none" key={item.key}>
          <Link
            aria-current={isCurrent ? "page" : undefined}
            className={`flex min-h-11 items-center border-b px-1 text-xs font-medium uppercase tracking-wide transition-colors motion-reduce:transition-none ${
              isCurrent
                ? "border-foreground text-foreground"
                : "border-transparent text-muted-foreground hover:border-border hover:text-foreground"
            }`}
            href={item.href}
            onClick={onNavigate}
          >
            {messages.navigation.labels[item.key]}
          </Link>
        </li>
      );
    });
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background">
      <div className="mx-auto max-w-content px-page-gutter">
        <div className="flex min-h-20 items-center justify-between gap-6">
          <Link
            aria-label={messages.navigation.homeLinkLabel}
            className="flex min-h-11 items-center text-base font-semibold uppercase tracking-wide text-foreground md:text-lg"
            href={ROUTES.home}
          >
            {name}
          </Link>

          <nav
            aria-label={messages.navigation.primaryLabel}
            className="hidden md:block"
          >
            <ul className="m-0 flex items-center gap-6 p-0">{renderLinks()}</ul>
          </nav>

          <button
            aria-controls="mobile-navigation"
            aria-expanded={isMenuOpen}
            aria-label={
              isMenuOpen
                ? messages.navigation.closeMenu
                : messages.navigation.openMenu
            }
            className="flex size-11 items-center justify-center border-0 bg-transparent p-0 text-foreground md:hidden"
            onClick={() => setIsMenuOpen((open) => !open)}
            ref={menuButtonRef}
            type="button"
          >
            <span aria-hidden="true" className="relative block size-5">
              <span
                className={`absolute left-0 top-1/2 h-px w-full bg-foreground transition-transform duration-300 ease-out motion-reduce:transition-none ${
                  isMenuOpen ? "rotate-45" : "-translate-y-[6px]"
                }`}
              />
              <span
                className={`absolute left-0 top-1/2 h-px w-full bg-foreground transition-opacity duration-200 motion-reduce:transition-none ${
                  isMenuOpen ? "opacity-0" : "opacity-100"
                }`}
              />
              <span
                className={`absolute left-0 top-1/2 h-px w-full bg-foreground transition-transform duration-300 ease-out motion-reduce:transition-none ${
                  isMenuOpen ? "-rotate-45" : "translate-y-[6px]"
                }`}
              />
            </span>
          </button>
        </div>

        <nav
          aria-label={messages.navigation.primaryLabel}
          aria-hidden={!isMenuOpen}
          className={`grid overflow-hidden transition-[grid-template-rows,opacity,transform] duration-300 ease-out motion-reduce:transition-none md:hidden ${
            isMenuOpen
              ? "grid-rows-[1fr] translate-y-0 opacity-100"
              : "pointer-events-none grid-rows-[0fr] -translate-y-2 opacity-0"
          }`}
          inert={!isMenuOpen}
          id="mobile-navigation"
        >
          <div className="min-h-0 overflow-hidden">
            <ul className="m-0 divide-y divide-border border-y border-border p-0">
              {renderLinks(() => setIsMenuOpen(false))}
            </ul>
          </div>
        </nav>
      </div>
    </header>
  );
}
