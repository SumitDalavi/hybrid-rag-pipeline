# ADR-001: Hybrid Fusion Strategy

## Status: Accepted

## Context
A hybrid RAG pipeline retrieves documents using both semantic (dense vector) search and keyword (sparse, e.g., BM25) search. The results from both systems must be merged into a single ranked list before being passed to the LLM.

## Decision
We chose **Reciprocal Rank Fusion (RRF)** to combine the dense and sparse search results.

## Alternatives Considered
| Option | Pros | Cons | Why rejected |
|---|---|---|---|
| Convex Combination (Score Normalization) | Theoretically optimal if scores are perfectly calibrated | Scores from BM25 and Cosine Similarity are on completely different scales and highly volatile | Too brittle, requires constant tuning |
| Fallback Strategy (Dense then Sparse) | Very easy to implement | Doesn't actually combine strengths, just masks failures | Fails on queries requiring both semantic meaning and exact keyword matches |
| Reciprocal Rank Fusion (RRF) | Requires zero score calibration, scale-invariant, extremely robust | Slightly penalizes items that score highly in only one algorithm | **Selected** as the most reliable, zero-tuning fusion algorithm |

## Consequences
- Positive: No arbitrary weight tuning (e.g., `alpha=0.3`) is required. RRF consistently outperforms single-modality searches across varied datasets.
- Negative: RRF discards the actual distance/score magnitude, relying entirely on the ranking position.
- Trade-offs accepted: We trade fine-grained score magnitude for absolute ranking robustness.
