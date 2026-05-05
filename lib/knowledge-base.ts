import { randomUUID } from "node:crypto";

export type KnowledgeSourceType = "file" | "url";

export interface KnowledgeDocument {
  id: string;
  name: string;
  sourceType: KnowledgeSourceType;
  uploadedAt: string;
  size: number;
  url?: string;
  text: string;
}

// In-memory store scoped to the running server process (ephemeral by design for now).
const globalStore = globalThis as typeof globalThis & {
  __RAG_KB__?: Map<string, KnowledgeDocument>;
};

function getStore(): Map<string, KnowledgeDocument> {
  if (!globalStore.__RAG_KB__) {
    globalStore.__RAG_KB__ = new Map<string, KnowledgeDocument>();
  }
  return globalStore.__RAG_KB__;
}

function normalizeWhitespace(input: string): string {
  return input.replace(/\r\n/g, "\n").replace(/\s+/g, " ").trim();
}

// Minimal HTML extraction to keep URL ingestion text-only and indexable.
function stripHtml(input: string): string {
  const withoutScripts = input
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, " ");
  const text = withoutScripts.replace(/<[^>]+>/g, " ");
  return normalizeWhitespace(text);
}

function decodeBytes(bytes: Uint8Array): string {
  return new TextDecoder("utf-8", { fatal: false }).decode(bytes);
}

function inferTextFromFileName(name: string): boolean {
  const extension = name.split(".").pop()?.toLowerCase() || "";
  return ["txt", "md", "csv", "json", "tsv", "log"].includes(extension);
}

export function listKnowledgeDocuments(): KnowledgeDocument[] {
  return Array.from(getStore().values()).sort((a, b) => (a.uploadedAt < b.uploadedAt ? 1 : -1));
}

export function removeKnowledgeDocument(id: string): boolean {
  return getStore().delete(id);
}

export function clearKnowledgeBase(): void {
  getStore().clear();
}

export async function addUrlDocument(url: string): Promise<KnowledgeDocument> {
  const response = await fetch(url, { method: "GET", cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Failed to fetch URL (${response.status}).`);
  }

  const contentType = response.headers.get("content-type") || "";
  const raw = await response.text();
  let text = raw;
  if (contentType.includes("text/html")) {
    text = stripHtml(raw);
  } else {
    // Non-HTML responses are treated as plain text payloads.
    text = normalizeWhitespace(raw);
  }

  if (!text) {
    throw new Error("Fetched URL did not return indexable text.");
  }

  const parsed = new URL(url);
  const name = parsed.pathname.split("/").filter(Boolean).pop() || parsed.hostname;
  const document: KnowledgeDocument = {
    id: randomUUID(),
    name,
    sourceType: "url",
    uploadedAt: new Date().toISOString(),
    size: text.length,
    url,
    text
  };

  getStore().set(document.id, document);
  return document;
}

export async function addFileDocument(file: File): Promise<KnowledgeDocument> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const extensionText = inferTextFromFileName(file.name);
  const contentType = file.type || "";

  if (
    !extensionText &&
    !contentType.startsWith("text/") &&
    contentType !== "application/json" &&
    contentType !== "text/csv"
  ) {
    // Keep ingestion to text-friendly formats to avoid false parsing confidence.
    throw new Error("Unsupported file type. Use text-like files such as .txt, .md, .csv, or .json.");
  }

  const decoded = decodeBytes(bytes);
  const text = normalizeWhitespace(decoded);
  if (!text) {
    throw new Error("The uploaded file is empty or not readable as text.");
  }

  const document: KnowledgeDocument = {
    id: randomUUID(),
    name: file.name,
    sourceType: "file",
    uploadedAt: new Date().toISOString(),
    size: file.size,
    text
  };

  getStore().set(document.id, document);
  return document;
}
