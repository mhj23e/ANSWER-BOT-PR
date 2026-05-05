import { NextResponse } from "next/server";
import { removeKnowledgeDocument } from "@/lib/knowledge-base";

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const removed = removeKnowledgeDocument(id);
  if (!removed) {
    return NextResponse.json({ error: "Document not found." }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
