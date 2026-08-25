"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { cn } from "@/lib/cn";

type Props = {
  value: string;
  onChange: (url: string) => void;
  folder?: string;
  label?: string;
  className?: string;
  /** Chemin de secours affiché si value vide */
  fallbackPreview?: string;
};

export function ImageUploadField({
  value,
  onChange,
  folder = "general",
  label = "Image",
  className,
  fallbackPreview = "/images/boutique-produits.jpg",
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const preview = value.trim() || fallbackPreview;

  async function onFileChange(file: File | null) {
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const body = new FormData();
      body.append("file", file);
      body.append("folder", folder);
      const res = await fetch("/api/admin/uploads", {
        method: "POST",
        body,
      });
      const json = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !json.url) {
        throw new Error(json.error ?? "Téléversement impossible");
      }
      onChange(json.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className={cn("space-y-2", className)}>
      <p className="text-sm font-semibold text-febis-ink">{label}</p>
      <div className="flex flex-wrap items-start gap-3">
        <span className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl border border-febis-ink/10 bg-white">
          <Image
            src={preview}
            alt=""
            fill
            className="object-cover"
            sizes="96px"
            unoptimized={preview.startsWith("/uploads/")}
          />
        </span>
        <div className="min-w-0 flex-1 space-y-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            disabled={uploading}
            className="block w-full text-sm text-febis-ink/70 file:mr-3 file:rounded-full file:border-0 file:bg-febis-red/10 file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-febis-red hover:file:bg-febis-red/15 disabled:opacity-60"
            onChange={(e) => void onFileChange(e.target.files?.[0] ?? null)}
          />
          <p className="text-[11px] text-febis-ink/45">
            Téléversement local (JPG, PNG, WebP, GIF — max 5 Mo).
          </p>
          {value ? (
            <p className="truncate text-[11px] font-medium text-febis-ink/40">
              {value}
            </p>
          ) : null}
          {value ? (
            <button
              type="button"
              onClick={() => onChange("")}
              className="text-xs font-bold text-febis-red hover:underline"
            >
              Retirer l’image
            </button>
          ) : null}
          {uploading ? (
            <p className="text-xs font-semibold text-febis-ink/55">
              Téléversement…
            </p>
          ) : null}
          {error ? (
            <p className="text-xs font-semibold text-febis-red">{error}</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
