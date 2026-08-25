import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { saveUploadedImage } from "@/lib/uploads";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Formulaire invalide" }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: "Fichier image requis (champ « file »)." },
      { status: 400 },
    );
  }

  const folderRaw = form.get("folder");
  const folder =
    typeof folderRaw === "string" && folderRaw.trim()
      ? folderRaw.trim()
      : "general";

  try {
    const saved = await saveUploadedImage({ file, folder });
    return NextResponse.json({
      url: saved.url,
      bytes: saved.bytes,
      name: file.name,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Échec du téléversement",
      },
      { status: 400 },
    );
  }
}
