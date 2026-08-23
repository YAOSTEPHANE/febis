import { cn } from "@/lib/cn";
import type { ReactNode } from "react";

type SectionShellProps = {
  id?: string;
  children: ReactNode;
  className?: string;
  tone?: "default" | "mist" | "ink";
};

export function SectionShell({
  id,
  children,
  className,
  tone = "default",
}: SectionShellProps) {
  return (
    <section
      id={id}
      className={cn(
        "relative pt-8 pb-12 md:pt-10 md:pb-16",
        tone === "mist" && "section-band-mist",
        tone === "ink" && "section-band-ink",
        className,
      )}
    >
      {children}
    </section>
  );
}
