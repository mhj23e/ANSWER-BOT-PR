# ANSWER-BOT-PR test plan

Verify that retrieval ranks the right source, prompt trimming respects its
character limits, and Groq routing selects the expected model.

| Case | Exercise | Pass criteria |
| --- | --- | --- |
| RAG-01 | Query a corpus with one matching and one unrelated source | The matching source ranks first, its hybrid score matches the configured weights, and the result limit holds |
| RAG-02 | Query an empty corpus or use only stopwords | Retrieval returns an empty array |
| RAG-03 | Trim text below, at, and above the character cap | Text that fits is preserved. Truncation, including its ellipsis, stays within the cap |
| RAG-04 | Use a simple query, a complexity keyword, and lengths of 140 and 141 | Each query selects the expected Groq model |
| RAG-05 | With Ollama active, upload a synthetic TXT policy and ask a question it answers | The configured local model answers with a source reference and no Groq key is needed |

Run `npm ci`, `npm test`, and `npm run typecheck`. GitHub Actions runs
the automated cases on pushes and pull requests. The automated gate passes
when every check exits successfully. RAG-05 is a manual release check and
requires a running Ollama instance. The trim tests measure characters.
The provider enforces the separate completion token cap.

Report failures in GitHub Issues with the commit, environment, test case,
steps, expected behavior, and actual behavior. Use synthetic input data.
