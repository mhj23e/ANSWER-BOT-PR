import { describe, expect, it } from "vitest";
import { chooseGenerationModel, retrieveRelevantChunks, trimText } from "./rag";

const sources = [
  { id: "shipping", source: "Shipping", section: "Policy", text: "Orders ship every Friday." },
  { id: "benefits", source: "Benefits", section: "Policy", text: "Enrollment opens in October." }
];

describe("retrieval scoring", () => {
  it("ranks a matching source first and combines lexical and semantic scores", () => {
    const [match, other] = retrieveRelevantChunks("ENROLLMENT!", 2, sources);
    expect(match.id).toBe("benefits-1");
    expect(match.bm25Score).toBeGreaterThan(0);
    expect(match.semanticScore).toBeGreaterThan(0);
    expect(match.hybridScore).toBeCloseTo(match.bm25Score * 0.7 + match.semanticScore * 0.3);
    expect(other.hybridScore).toBe(0);
    expect(retrieveRelevantChunks("enrollment", 1, sources)).toHaveLength(1);
  });

  it("returns no chunks for an empty corpus or a stopword-only query", () => {
    expect(retrieveRelevantChunks("enrollment")).toEqual([]);
    expect(retrieveRelevantChunks("the and", 2, sources)).toEqual([]);
  });
});

describe("prompt character budget", () => {
  it("preserves text that fits, including text exactly at the limit", () => {
    expect(trimText("abc", 5)).toBe("abc");
    expect(trimText("abcde", 5)).toBe("abcde");
  });

  it("includes the ellipsis in the budget", () => {
    expect(trimText("abcdef", 5)).toBe("ab...");
    expect(trimText("abcdef", 2)).toBe("ab");
    expect(trimText("abcdef", 0)).toBe("");
  });
});

describe("Groq model routing", () => {
  it.each([
    ["When do orders ship?", "llama-3.1-8b-instant"],
    ["COMPARE these options", "llama-3.3-70b-versatile"],
    ["a".repeat(140), "llama-3.1-8b-instant"],
    ["a".repeat(141), "llama-3.3-70b-versatile"]
  ])("routes %s to %s", (query, model) => {
    expect(chooseGenerationModel(query)).toBe(model);
  });
});
