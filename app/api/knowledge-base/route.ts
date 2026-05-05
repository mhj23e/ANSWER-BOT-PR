import { NextResponse } from "next/server";
import {
  addFileDocument,
  addUrlDocument,
  clearKnowledgeBase,
  listKnowledgeDocuments
} from "@/lib/knowledge-base";

export async function GET() {
  return NextResponse.json({ documents: listKnowledgeDocuments() });
}

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      const body = (await request.json()) as { url?: string };
      const url = body.url?.trim();
      if (!url) {
        return NextResponse.json({ error: "URL is required." }, { status: 400 });
      }
      const document = await addUrlDocument(url);
      return NextResponse.json({ document }, { status: 201 });
    }

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("file");
      if (!(file instanceof File)) {
        return NextResponse.json({ error: "File is required." }, { status: 400 });
      }
      const document = await addFileDocument(file);
      return NextResponse.json({ document }, { status: 201 });
    }

    return NextResponse.json(
      { error: "Unsupported content type. Use JSON for URLs or multipart/form-data for files." },
      { status: 415 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to ingest knowledge source.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE() {
  clearKnowledgeBase();
  return NextResponse.json({ ok: true });
}
