# ADR-002: Embedding Model Selection

## Status: Accepted

## Context
Dense retrieval requires mapping text into a high-dimensional vector space. The choice of embedding model dictates the retrieval quality, storage costs, and API latency.

## Decision
We chose **OpenAI `text-embedding-3-small`**.

## Alternatives Considered
| Option | Pros | Cons | Why rejected |
|---|---|---|---|
| Open-Source (e.g., BAAI/bge-large-en) | Free to run locally, total privacy | Requires managing GPU infrastructure for acceptable latency | Operational overhead is too high for the current team size |
| OpenAI `text-embedding-ada-002` | Legacy standard | Eclipsed in performance and cost by V3 models | Obsolete |
| OpenAI `text-embedding-3-large` | Highest absolute MTEB performance | 3072 dimensions means double the vector database storage costs | Diminishing returns on quality vs cost |
| OpenAI `text-embedding-3-small` | Extremely cheap, fast, 1536 dimensions, highly competitive MTEB | Vendor lock-in to OpenAI | **Selected** as the optimal cost/performance ratio for cloud-native RAG |

## Consequences
- Positive: We achieve near state-of-the-art embedding quality at a fraction of the cost of running our own GPUs.
- Negative: We are locked into the OpenAI API and subject to their rate limits and uptime.
- Trade-offs accepted: We accept vendor lock-in for operational simplicity and cost efficiency.
