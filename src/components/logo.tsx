"use client";

import Link from "next/link";

import { cn } from "@/lib/utils";
import { useBrand } from "@/contexts/BrandContext";

type LogoProps = {
  className?: string;
  href?: string;
};

export function Logo({ className, href = "/" }: LogoProps) {
  const { brand } = useBrand();

  return (
    <Link
      href={href}
      aria-label={brand.name}
      className={cn("inline-flex min-w-0 items-center rounded-full transition hover:opacity-90", className)}
    >
      <img
        src={brand.logo}
        alt={brand.name}
        className="h-9 w-auto max-w-[30rem] shrink-0 object-contain"
      />
    </Link>
  );
}
