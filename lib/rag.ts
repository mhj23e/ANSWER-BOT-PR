export interface RagChunk {
  id: string;
  source: string;
  section: string;
  text: string;
  tokens: string[];
  tokenFreq: Map<string, number>;
  length: number;
}

export interface RetrievedChunk extends RagChunk {
  bm25Score: number;
  semanticScore: number;
  hybridScore: number;
}

export interface SourceReference {
  id: string;
  source: string;
  section: string;
  quote: string;
  score: number;
}

interface CorpusStats {
  chunks: RagChunk[];
  idf: Map<string, number>;
  avgLength: number;
}

export interface RetrievalSource {
  id: string;
  source: string;
  section: string;
  text: string;
}

const STOPWORDS = new Set([
  "a",
  "an",
  "and",
  "are",
  "as",
  "at",
  "be",
  "by",
  "for",
  "from",
  "in",
  "is",
  "it",
  "of",
  "on",
  "or",
  "that",
  "the",
  "to",
  "with",
  "you",
  "your"
]);

// Normalizes text so lexical and semantic scoring operate on consistent tokens.
function normalizeText(input: string): string {
  return input.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

function tokenize(input: string): string[] {
  const normalized = normalizeText(input);
  if (!normalized) return [];
  return normalized.split(" ").filter((token) => token.length > 1 && !STOPWORDS.has(token));
}

function frequency(tokens: string[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const token of tokens) {
    counts.set(token, (counts.get(token) || 0) + 1);
  }
  return counts;
}

// Creates overlapping chunks to reduce boundary-loss during retrieval.
function chunkSection(section: string, body: string): string[] {
  const paragraphs = body
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  const chunks: string[] = [];
  let buffer = "";

  for (const paragraph of paragraphs) {
    const next = buffer ? `${buffer}\n\n${paragraph}` : paragraph;
    if (next.length <= 850) {
      buffer = next;
      continue;
    }
    if (buffer) {
      chunks.push(buffer);
      const overlap = buffer.slice(Math.max(0, buffer.length - 180));
      buffer = `${overlap}\n\n${paragraph}`.trim();
    } else {
      chunks.push(paragraph.slice(0, 850));
      buffer = paragraph.slice(650);
    }
  }
  if (buffer.trim()) {
    chunks.push(buffer.trim());
  }
  return chunks;
}

function buildCorpusFromSources(sources: RetrievalSource[]): CorpusStats {
  const chunks: RagChunk[] = [];

  for (const source of sources) {
    const pieces = chunkSection(source.section, source.text);
    pieces.forEach((text, index) => {
      const tokens = tokenize(text);
      chunks.push({
        id: `${source.id}-${index + 1}`,
        source: source.source,
        section: source.section,
        text,
        tokens,
        tokenFreq: frequency(tokens),
        length: Math.max(tokens.length, 1)
      });
    });
  }

  const avgLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0) / Math.max(chunks.length, 1);
  const docFreq = new Map<string, number>();

  for (const chunk of chunks) {
    const unique = new Set(chunk.tokens);
    for (const token of unique) {
      docFreq.set(token, (docFreq.get(token) || 0) + 1);
    }
  }

  const idf = new Map<string, number>();
  const totalDocs = chunks.length;
  // Standard BM25-style IDF with smoothing to avoid divide-by-zero edge cases.
  for (const [token, df] of docFreq.entries()) {
    const score = Math.log(1 + (totalDocs - df + 0.5) / (df + 0.5));
    idf.set(token, score);
  }

  return { chunks, idf, avgLength };
}

function bm25Score(queryTokens: string[], chunk: RagChunk, idf: Map<string, number>, avgLength: number): number {
  const k1 = 1.2;
  const b = 0.75;
  let score = 0;
  for (const token of queryTokens) {
    const tf = chunk.tokenFreq.get(token) || 0;
    if (!tf) continue;
    const tokenIdf = idf.get(token) || 0;
    const numerator = tf * (k1 + 1);
    const denominator = tf + k1 * (1 - b + (b * chunk.length) / avgLength);
    score += tokenIdf * (numerator / denominator);
  }
  return score;
}

// Lightweight semantic signal (Jaccard + rare-term boost) for hybrid ranking.
function semanticScore(queryTokens: string[], chunkTokens: string[]): number {
  if (!queryTokens.length || !chunkTokens.length) return 0;
  const querySet = new Set(queryTokens);
  const chunkSet = new Set(chunkTokens);
  const overlap = queryTokens.filter((token) => chunkSet.has(token)).length;
  const union = new Set([...querySet, ...chunkSet]).size;
  const jaccard = union ? overlap / union : 0;

  // Extra signal for long-tail terms.
  let rareBoost = 0;
  for (const token of querySet) {
    if (token.length >= 8 && chunkSet.has(token)) rareBoost += 0.05;
  }
  return Math.min(1, jaccard + rareBoost);
}

export function retrieveRelevantChunks(
  query: string,
  limit = 6,
  sources?: RetrievalSource[]
): RetrievedChunk[] {
  const corpus = sources?.length ? buildCorpusFromSources(sources) : { chunks: [], idf: new Map(), avgLength: 1 };
  const queryTokens = tokenize(query);
  if (!queryTokens.length || !corpus.chunks.length) return [];

  const scored = corpus.chunks.map((chunk) => {
    const bm25 = bm25Score(queryTokens, chunk, corpus.idf, corpus.avgLength);
    const semantic = semanticScore(queryTokens, chunk.tokens);
    // Small prior boost for guideline-like sections; keeps scoring stable with sparse queries.
    const headingBoost = chunk.section.toLowerCase().includes("what good looks like") ? 0.15 : 0;
    const hybrid = bm25 * 0.7 + semantic * 0.3 + headingBoost;
    return {
      ...chunk,
      bm25Score: bm25,
      semanticScore: semantic,
      hybridScore: hybrid
    };
  });

  return scored
    .sort((a, b) => b.hybridScore - a.hybridScore)
    .slice(0, limit);
}

export function formatReferences(chunks: RetrievedChunk[], limit = 3): SourceReference[] {
  return chunks.slice(0, limit).map((chunk, index) => ({
    id: chunk.id || `chunk-${index + 1}`,
    source: chunk.source,
    section: chunk.section,
    quote: chunk.text.slice(0, 240).replace(/\s+/g, " ").trim(),
    score: Number(chunk.hybridScore.toFixed(4))
  }));
}

// Context block format is intentionally deterministic so citations map cleanly.
export function buildContextPrompt(chunks: RetrievedChunk[]): string {
  return chunks
    .map(
      (chunk, index) =>
        `[Doc ${index + 1}] Source: ${chunk.source} | Section: ${chunk.section}\n${chunk.text}`
    )
    .join("\n\n---\n\n");
}

// Multi-model routing: cheap fast model for short/simple prompts, larger model for harder asks.
export function chooseGenerationModel(query: string): string {
  const normalized = normalizeText(query);
  const complexSignals = [
    "architecture",
    "compare",
    "tradeoff",
    "security",
    "cost",
    "production",
    "reliability",
    "explain",
    "design"
  ];
  const isComplex =
    normalized.length > 140 || complexSignals.some((signal) => normalized.includes(signal));
  return isComplex ? "llama-3.3-70b-versatile" : "llama-3.1-8b-instant";
}
