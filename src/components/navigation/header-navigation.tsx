"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { isNavigationItemActive, type NavigationItem } from "@/lib/navigation";
import { cn } from "@/lib/utils";

import { NavigationLabel } from "./navigation-label";

export function HeaderNavigation({ className, items }: { className?: string; items: NavigationItem[] }) {
  const pathname = usePathname() ?? "";
  return (
    <nav className={cn("flex items-center gap-2 text-sm font-medium text-[color:color-mix(in_srgb,var(--color-header-foreground)_75%,transparent)]", className)}>
      {items.map((item) => {
        const active = isNavigationItemActive(pathname, item);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={item.onSelect}
            aria-current={active ? "page" : undefined}
            className={cn(
              "rounded-full px-3 py-2 transition",
              active ? "bg-primary/15 text-primary" : "hover:bg-[color:color-mix(in_srgb,var(--color-header-foreground)_12%,transparent)]",
            )}
          >
            <NavigationLabel item={item} />
          </Link>
        );
      })}
    </nav>
  );
}
