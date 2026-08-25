"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  useEffectEvent,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { cn } from "@/lib/cn";

type Hit = {
  id: string;
  type: string;
  title: string;
  subtitle: string;
  href: string;
  activity?: string;
};

const TYPE_LABELS: Record<string, string> = {
  client: "Client",
  contact: "Contact",
  reservation: "Réservation",
  invoice: "Facture",
  project: "Projet BTP",
  equipment: "Matériel",
  lodging: "Logement",
  payment: "Paiement",
  blog: "Article",
  employee: "Collaborateur",
};

function typeLabel(type: string) {
  return TYPE_LABELS[type] ?? type;
}

export function AdminHeaderSearch() {
  const router = useRouter();
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<Hit[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeIndex, setActiveIndex] = useState(-1);
  const [expandedMobile, setExpandedMobile] = useState(false);

  const runSearch = useEffectEvent(async (query: string) => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setHits([]);
      setError("");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");
    try {
      const res = await fetch(
        `/api/admin/search?q=${encodeURIComponent(trimmed)}&limit=8`,
      );
      const json = (await res.json()) as { hits?: Hit[]; error?: string };
      if (!res.ok) throw new Error(json.error ?? "Recherche impossible");
      setHits(json.hits ?? []);
      setActiveIndex(-1);
      setOpen(true);
    } catch (err) {
      setHits([]);
      setError(err instanceof Error ? err.message : "Erreur");
      setOpen(true);
    } finally {
      setLoading(false);
    }
  });

  useEffect(() => {
    const trimmed = q.trim();
    if (trimmed.length < 2) {
      setHits([]);
      setError("");
      setLoading(false);
      return;
    }

    setLoading(true);
    const timer = window.setTimeout(() => {
      void runSearch(trimmed);
    }, 280);

    return () => window.clearTimeout(timer);
  }, [q]);

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
        setExpandedMobile(false);
      }
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        setExpandedMobile(false);
        inputRef.current?.blur();
      }
      if (
        (event.key === "k" || event.key === "K") &&
        (event.metaKey || event.ctrlKey)
      ) {
        event.preventDefault();
        setExpandedMobile(true);
        inputRef.current?.focus();
        setOpen(q.trim().length >= 2);
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [q]);

  const goToFullSearch = useCallback(() => {
    const trimmed = q.trim();
    setOpen(false);
    setExpandedMobile(false);
    router.push(
      trimmed
        ? `/admin/dashboard/recherche?q=${encodeURIComponent(trimmed)}`
        : "/admin/dashboard/recherche",
    );
  }, [q, router]);

  function onSelect(hit: Hit) {
    setOpen(false);
    setExpandedMobile(false);
    setQ("");
    setHits([]);
    router.push(hit.href);
  }

  function onKeyDown(event: ReactKeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (!open && hits.length > 0) setOpen(true);
      setActiveIndex((i) => Math.min(i + 1, hits.length - 1));
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, -1));
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      if (activeIndex >= 0 && hits[activeIndex]) {
        onSelect(hits[activeIndex]);
        return;
      }
      goToFullSearch();
      return;
    }
  }

  const showPanel =
    open &&
    (loading || Boolean(error) || hits.length > 0 || q.trim().length >= 2);

  return (
    <div ref={rootRef} className="relative min-w-0 w-44 sm:w-52 md:w-56">
      <button
        type="button"
        aria-label="Ouvrir la recherche"
        className={cn(
          "flex h-8 w-8 items-center justify-center rounded-lg border border-febis-ink/10 bg-white/90 text-febis-ink/55 transition hover:border-febis-red/25 hover:text-febis-red sm:hidden",
          expandedMobile && "border-febis-red/30 text-febis-red",
        )}
        onClick={() => {
          setExpandedMobile((v) => !v);
          window.setTimeout(() => inputRef.current?.focus(), 0);
        }}
      >
        <SearchIcon />
      </button>

      <div
        className={cn(
          "absolute right-0 top-0 z-40 w-[min(100vw-2rem,16rem)] sm:static sm:z-auto sm:block sm:w-full",
          expandedMobile ? "block" : "hidden sm:block",
        )}
      >
        <label className="relative block">
          <span className="sr-only">Recherche globale</span>
          <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-febis-ink/35">
            <SearchIcon />
          </span>
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              if (e.target.value.trim().length >= 2) setOpen(true);
            }}
            onFocus={() => {
              if (q.trim().length >= 2 || hits.length > 0) setOpen(true);
            }}
            onKeyDown={onKeyDown}
            role="combobox"
            aria-expanded={showPanel}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={
              activeIndex >= 0 ? `${listId}-opt-${activeIndex}` : undefined
            }
            placeholder="Rechercher…"
            className="h-8 w-full rounded-lg border border-febis-ink/10 bg-white/95 pl-8 pr-12 text-xs font-medium text-febis-ink outline-none transition placeholder:text-febis-ink/35 focus:border-febis-red/35 focus:shadow-[0_0_0_3px_rgba(215,25,32,0.1)]"
          />
          <span className="pointer-events-none absolute right-2 top-1/2 hidden -translate-y-1/2 rounded border border-febis-ink/10 bg-febis-smoke/80 px-1 py-px text-[9px] font-bold tracking-wide text-febis-ink/40 sm:inline">
            ⌘K
          </span>
          {loading ? (
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold uppercase tracking-wider text-febis-red sm:right-10">
              …
            </span>
          ) : null}
        </label>

        {showPanel ? (
          <div
            id={listId}
            role="listbox"
            className="absolute left-0 right-0 z-50 mt-1.5 max-h-[min(70vh,20rem)] overflow-y-auto rounded-lg border border-febis-ink/10 bg-white shadow-[0_18px_40px_rgba(26,18,16,0.12)]"
          >
            {error ? (
              <p className="px-3 py-2.5 text-xs font-semibold text-febis-red">
                {error}
              </p>
            ) : null}

            {!loading && !error && q.trim().length >= 2 && hits.length === 0 ? (
              <p className="px-3 py-5 text-center text-xs text-febis-ink/50">
                Aucun résultat pour « {q.trim()} »
              </p>
            ) : null}

            {hits.map((hit, index) => (
              <button
                key={`${hit.type}-${hit.id}`}
                id={`${listId}-opt-${index}`}
                type="button"
                role="option"
                aria-selected={activeIndex === index}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => onSelect(hit)}
                className={cn(
                  "flex w-full flex-col gap-0.5 border-b border-febis-ink/6 px-3 py-2 text-left transition last:border-b-0",
                  activeIndex === index
                    ? "bg-febis-red/5"
                    : "hover:bg-febis-smoke/70",
                )}
              >
                <span className="text-[9px] font-bold uppercase tracking-[0.12em] text-febis-orange">
                  {typeLabel(hit.type)}
                  {hit.activity ? ` · ${hit.activity}` : ""}
                </span>
                <span className="text-sm font-semibold text-febis-ink">
                  {hit.title}
                </span>
                <span className="line-clamp-1 text-[11px] text-febis-ink/50">
                  {hit.subtitle}
                </span>
              </button>
            ))}

            <div className="sticky bottom-0 border-t border-febis-ink/8 bg-febis-smoke/95 px-2 py-1.5 backdrop-blur-sm">
              <button
                type="button"
                onClick={goToFullSearch}
                className="w-full rounded-md px-2.5 py-1.5 text-left text-xs font-bold text-febis-red transition hover:bg-white"
              >
                {q.trim().length >= 2
                  ? "Voir tous les résultats →"
                  : "Recherche avancée →"}
              </button>
              <Link
                href="/admin/dashboard/recherche"
                onClick={() => {
                  setOpen(false);
                  setExpandedMobile(false);
                }}
                className="mt-0.5 block px-2.5 pb-0.5 text-[11px] font-semibold text-febis-ink/45 hover:text-febis-ink"
              >
                Page recherche complète
              </Link>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function SearchIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="2" />
      <path
        d="M16.5 16.5L21 21"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
