# Runbook — hybrid-rag-pipeline
> Last updated: 2026-08-29

## Prerequisites
| Tool | Required Version | How to check |
|---|---|---|
| Node.js | >= 20 | `node -v` |
| Docker & Compose | Latest | `docker-compose version` |

## Quick Start
```bash
# Install dependencies
npm install

# Start ChromaDB
docker-compose up -d

# Start server
npm run dev
```

## Run Tests
```bash
# Unit tests
npm test

# E2E Test (Ingestion + Citation check)
bash tests/e2e/test_ingestion_and_query.sh
```

Expected output:
```
PASS  __tests__/bm25.test.ts
PASS  __tests__/rrf.test.ts
```

## Environment Variables
| Variable | Default | Purpose |
|---|---|---|
| PORT | `3000` | HTTP port for the API |
| CHROMA_URL | `http://localhost:8000` | Connection to ChromaDB |
| OPENAI_API_KEY | - | Key for embeddings and generation |

## Common Failure Modes
| Symptom | Cause | Fix |
|---|---|---|
| `ConnectionRefused` to Chroma | Container not running | Run `docker-compose up -d` |
| Zero results from BM25 | Document wasn't ingested | Ensure you ingest via `/v1/ingest` before querying |
