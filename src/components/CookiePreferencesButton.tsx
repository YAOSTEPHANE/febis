"use client";

import type { ReactNode } from "react";
import { openCookiePreferences } from "@/lib/cookie-consent";

type Props = {
  className?: string;
  children?: ReactNode;
};

export function CookiePreferencesButton({
  className = "cta-premium !px-5 !py-2.5 text-sm",
  children = "Gérer mes cookies",
}: Props) {
  return (
    <button type="button" className={className} onClick={openCookiePreferences}>
      {children}
    </button>
  );
}
