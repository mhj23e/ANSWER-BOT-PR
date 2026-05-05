import { NextResponse } from "next/server";
import {
  buildContextPrompt,
  chooseGenerationModel,
  formatReferences,
  retrieveRelevantChunks
} from "@/lib/rag";
import { listKnowledgeDocuments } from "@/lib/knowledge-base";

interface ChatRequest {
  query: string;
  history?: Array<{ role: "user" | "assistant"; content: string }>;
}

interface GroqChoice {
  message?: { content?: string };
}

interface GroqResponse {
  choices?: GroqChoice[];
}

const GROQ_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";
const RETRIEVAL_MODEL = "llama-3.1-8b-instant";
const MAX_HISTORY_MESSAGES = 4;
const MAX_HISTORY_CHARS_PER_MESSAGE = 600;
const MAX_CONTEXT_CHARS = 5000;
const MAX_COMPLETION_TOKENS = 550;

function getApiKey(): string | null {
  return process.env.GROQ_API_KEY || null;
}

function trimText(input: string, maxChars: number): string {
  if (input.length <= maxChars) return input;
  return `${input.slice(0, maxChars)}...`;
}

async function callGroq(
  apiKey: string,
  model: string,
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>,
  temperature: number
): Promise<string> {
  const response = await fetch(GROQ_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      messages,
      temperature,
      // Hard cap to reduce runaway responses and stay inside org limits.
      max_completion_tokens: MAX_COMPLETION_TOKENS
    }),
    cache: "no-store"
  });

  if (!response.ok) {
    const text = await response.text();
    if (response.status === 413 || text.includes("rate_limit_exceeded") || text.includes("Request too large")) {
      // Normalize provider-specific limit errors into actionable UI guidance.
      throw new Error(
        "Request exceeded model token/rate limits. Try a shorter question or reduce loaded document size."
      );
    }
    throw new Error(`Groq API error (${response.status}): ${text}`);
  }

  const json = (await response.json()) as GroqResponse;
  const content = json.choices?.[0]?.message?.content?.trim();
  if (!content) {
    throw new Error("Groq returned an empty response.");
  }
  return content;
}

async function filterChunksWithModel(
  apiKey: string,
  query: string,
  chunks: ReturnType<typeof retrieveRelevantChunks>
) {
  if (!chunks.length) return chunks;
  // Trim candidate snippets aggressively; grader only needs high-signal previews.
  const chunkPayload = chunks
    .map(
      (chunk, index) =>
        `${index + 1}. id=${chunk.id}; section=${chunk.section}; score=${chunk.hybridScore.toFixed(
          4
        )}; text=${chunk.text.slice(0, 180).replace(/\s+/g, " ")}`
    )
    .join("\n");

  const graderPrompt = [
    "You are a strict retrieval grader for an enterprise RAG system.",
    "Given a user query and candidate context chunks, return only a JSON object with:",
    '{ "relevant_ids": ["chunk-id-1", "chunk-id-2", ...] }',
    "Rules:",
    "- Include ids only if they are directly useful for answering the query.",
    "- Keep at most 4 ids.",
    "- Never include explanations or markdown."
  ].join("\n");

  const graderOutput = await callGroq(
    apiKey,
    RETRIEVAL_MODEL,
    [
      { role: "system", content: graderPrompt },
      {
        role: "user",
        content: `Query:\n${query}\n\nCandidates:\n${chunkPayload}`
      }
    ],
    0
  );

  const match = graderOutput.match(/\{[\s\S]*\}/);
  if (!match) return chunks.slice(0, 4);

  try {
    const parsed = JSON.parse(match[0]) as { relevant_ids?: string[] };
    const chosen = new Set(parsed.relevant_ids || []);
    const filtered = chunks.filter((chunk) => chosen.has(chunk.id));
    return filtered.length ? filtered : chunks.slice(0, 4);
  } catch {
    return chunks.slice(0, 4);
  }
}

export async function POST(request: Request) {
  try {
    const apiKey = getApiKey();
    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            "Missing GROQ_API_KEY. Add it to your environment so chat can call Groq."
        },
        { status: 500 }
      );
    }

    const body = (await request.json()) as ChatRequest;
    const query = body.query?.trim();
    if (!query) {
      return NextResponse.json({ error: "Query is required." }, { status: 400 });
    }

    const knowledgeDocuments = listKnowledgeDocuments();
    if (!knowledgeDocuments.length) {
      return NextResponse.json(
        {
          error: "Knowledge base is empty. Add files or URLs in Database before asking questions."
        },
        { status: 400 }
      );
    }

    const retrievalSources = knowledgeDocuments.map((document) => ({
      id: document.id,
      source: document.name,
      section: document.sourceType === "url" ? "URL Source" : "Uploaded File",
      text: document.text
    }));

    const initial = retrieveRelevantChunks(query, 8, retrievalSources);
    // Stage 1: lexical+semantic retrieval, Stage 2: LLM relevance grading.
    const filtered = await filterChunksWithModel(apiKey, query, initial);
    const finalChunks = filtered.slice(0, 4);
    if (!finalChunks.length) {
      return NextResponse.json(
        {
          error:
            "No relevant content found in current Database documents. Add more targeted sources and try again."
        },
        { status: 404 }
      );
    }
    const references = formatReferences(finalChunks, 3);
    // Enforce a strict context budget before the generation model call.
    const contextBlock = trimText(buildContextPrompt(finalChunks), MAX_CONTEXT_CHARS);
    const generationModel = chooseGenerationModel(query);

    const systemPrompt = [
      "You are an enterprise RAG assistant.",
      "Answer only from the provided context.",
      "If context is insufficient, say what is missing instead of guessing.",
      "Keep answers concise, practical, and grounded in the source material.",
      "End with a short citation list using [Doc N] markers when relevant."
    ].join("\n");

    const history = (body.history || []).slice(-MAX_HISTORY_MESSAGES);
    const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
      { role: "system", content: systemPrompt }
    ];

    for (const item of history) {
      if (!item?.content?.trim()) continue;
      if (item.role === "user" || item.role === "assistant") {
        // Bound historical context to avoid token spikes on long sessions.
        messages.push({
          role: item.role,
          content: trimText(item.content.trim(), MAX_HISTORY_CHARS_PER_MESSAGE)
        });
      }
    }

    messages.push({
      role: "user",
      content: `Question:\n${query}\n\nContext:\n${contextBlock}`
    });

    const answer = await callGroq(apiKey, generationModel, messages, 0.2);

    return NextResponse.json({
      answer,
      model: generationModel,
      references
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unexpected failure while processing chat.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
