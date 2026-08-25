import "server-only";
import { randomBytes } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

const ALLOWED_MIME: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/jpg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
};

const MAX_BYTES = 5 * 1024 * 1024;

export function allowedImageMime(mime: string): string | null {
  return ALLOWED_MIME[mime.toLowerCase()] ?? null;
}

function sanitizeFolder(folder: string): string {
  const cleaned = folder
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  return cleaned || "general";
}

function sanitizeBaseName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\.[a-z0-9]+$/i, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "image";
}

/** Enregistre un fichier image dans public/uploads et retourne le chemin public. */
export async function saveUploadedImage(input: {
  file: File;
  folder?: string;
}): Promise<{ url: string; bytes: number }> {
  const mime = input.file.type || "";
  const ext = allowedImageMime(mime);
  if (!ext) {
    throw new Error("Format non supporté. Utilisez JPG, PNG, WebP ou GIF.");
  }
  if (input.file.size <= 0) {
    throw new Error("Fichier vide.");
  }
  if (input.file.size > MAX_BYTES) {
    throw new Error("Image trop lourde (max 5 Mo).");
  }

  const folder = sanitizeFolder(input.folder ?? "general");
  const stamp = Date.now().toString(36);
  const rand = randomBytes(4).toString("hex");
  const base = sanitizeBaseName(input.file.name);
  const filename = `${stamp}-${rand}-${base}${ext}`;

  const uploadsRoot = path.join(process.cwd(), "public", "uploads");
  const destDir = path.join(uploadsRoot, folder);
  await mkdir(destDir, { recursive: true });

  const buffer = Buffer.from(await input.file.arrayBuffer());
  const destPath = path.join(destDir, filename);
  await writeFile(destPath, buffer);

  return {
    url: `/uploads/${folder}/${filename}`,
    bytes: buffer.length,
  };
}
