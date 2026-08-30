# ADR-003: Secondary Reranking

## Status: Accepted

## Context
After retrieving top K candidates via Reciprocal Rank Fusion, the results could theoretically be passed to a Cross-Encoder (e.g., Cohere Rerank) for a final, highly accurate sorting before passing to the LLM.

## Decision
We chose to **exclude a secondary Cross-Encoder reranking step** in the baseline architecture.

## Alternatives Considered
| Option | Pros | Cons | Why rejected |
|---|---|---|---|
| Cohere Rerank API | State-of-the-art accuracy | Adds another external API dependency, adds latency (200-500ms) | Unnecessary for general-purpose internal documentation RAG |
| Local Cross-Encoder (e.g., MS MARCO MiniLM) | Free, no external API | High CPU overhead, requires Python/PyTorch in the deployment image | Violates our lightweight deployment constraint |
| No Reranker (RRF Only) | Fastest query time, simplest architecture | Top 1-3 results might occasionally be sub-optimal | **Selected** as the trade-off favors speed and simplicity |

## Consequences
- Positive: The retrieval pipeline consists of only two fast network calls (Dense + Sparse) and an in-memory RRF sort. Query times remain consistently under 100ms.
- Negative: Precision@3 may be slightly lower than a pipeline utilizing a dedicated cross-encoder.
- Trade-offs accepted: We prioritize strict latency budgets and architectural simplicity over marginal precision gains.
