# Hybrid RAG Pipeline

> **Maturity:** Full Prototype
> _A robust Retrieval-Augmented Generation system using hybrid retrieval._

> **A robust Retrieval-Augmented Generation system using hybrid retrieval (dense vector + sparse keyword), Reciprocal Rank Fusion, and inline citation verification.**

[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20-green?logo=nodedotjs)](https://nodejs.org/)
[![ChromaDB](https://img.shields.io/badge/ChromaDB-Vector_Store-orange?logo=database)](https://www.trychroma.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

---

## 🎯 The Problem This Solves

Standard RAG pipelines rely solely on semantic embeddings (dense vectors). While great for conceptual matching, they often fail catastrophically at exact keyword matching (e.g., specific error codes, unique IDs, exact function names). 

This pipeline implements a **Hybrid Retrieval Strategy**:
1. **Dense Search (ChromaDB + OpenAI Embeddings)** for semantic understanding.
2. **Sparse Search (BM25)** for exact keyword frequency matching.
3. **Reciprocal Rank Fusion (RRF)** to combine both result sets into a single, highly accurate context window.

## 🏗️ Architecture

```
                      ┌────────────────────┐
                      │   Document Upload  │
                      └─────────┬──────────┘
                                │
                      ┌─────────▼──────────┐
                      │ Parsing & Chunking │
                      │ (PDF, HTML, MD)    │
                      └────┬──────────┬────┘
                           │          │
                 Embeddings│          │Tokenization
                           ▼          ▼
                  ┌─────────┴┐      ┌─┴────────┐
                  │ ChromaDB │      │   BM25   │
                  │ (Dense)  │      │ (Sparse) │
                  └────┬─────┘      └───┬──────┘
                       │                │
            Vector KNN │                │ TF-IDF Score
                       ▼                ▼
                 ┌─────┴────────────────┴─────┐
                 │ Reciprocal Rank Fusion (RRF)│
                 └──────────────┬─────────────┘
                                │ Top-K Context Chunks
                                ▼
                      ┌────────────────────┐
                      │    LLM Generator   │
                      │ (with citations!)  │
                      └────────────────────┘
```

## 🛠️ Tech Stack

| Component | Technology |
|---|---|
| Language | TypeScript 5.3 + Node.js 20 |
| API | Express |
| Embeddings | OpenAI `text-embedding-3-small` |
| Vector Store | ChromaDB (running via Docker) |
| Sparse Search | Custom BM25 implementation (TypeScript) |
| File Parsing | `pdf-parse`, `cheerio` (HTML) |

## 🚀 Quick Start

### 1. Clone and configure
```bash
git clone https://github.com/SumitDalavi/hybrid-rag-pipeline.git
cd hybrid-rag-pipeline
cp .env.example .env
# Add your OPENAI_API_KEY to .env
```

### 2. Start the full stack
```bash
docker-compose up -d
```
This spins up the RAG API on port 3000 and ChromaDB on port 8000.

### 3. Ingest a Document
```bash
curl -X POST -F "file=@/path/to/your/document.pdf" \
     -F "strategy=recursive" \
     http://localhost:3000/v1/ingest
```

### 4. Query the System
```bash
curl -X POST http://localhost:3000/v1/query \
     -H "Content-Type: application/json" \
     -d '{"query": "What is the specific error code for database timeout?", "topK": 5}'
```

```json
{
  "answer": "The specific error code for a database timeout is ERR_DB_504 [ID: 9b1deb4d-3b7d].",
  "citations": [
    {
      "id": "9b1deb4d-3b7d",
      "text": "...error handling. The specific error code for a database timeout is ERR_DB_504...",
      "metadata": { "source": "docs.pdf" },
      "chunkingStrategy": "recursive",
      "charCount": 350
    }
  ],
  "retrievalLatencyMs": 45,
  "generationLatencyMs": 1200
}
```

## Mock Boundaries (Honest Scope)

| What | Status | Details |
|---|---|---|
| OpenAI API | **Optional** | Uses real `text-embedding-3-small` and GPT models when API key is provided; tests use mocks. |
| ChromaDB | **Real** | Runs locally via Docker Compose for dense vector storage. |
| BM25 Search | **Real** | Implemented in TypeScript for sparse keyword search. |

## 📚 Documentation

- [Architecture](docs/ARCHITECTURE.md) — System diagram and component details
- [Runbook](docs/runbook.md) — Setup, commands, and expected outputs
- [Decisions](docs/decisions.md) — ADRs for retrieval pattern choices
- [Changelog](docs/changelog.md) — Change history

## 🧪 Tests

```bash
npm test
```
Tests cover the BM25 scoring logic and the Reciprocal Rank Fusion (RRF) combination logic.
E2E Ingestion test available at `tests/e2e/test_ingestion_and_query.sh`.

## 👨‍💻 Author

**Sumit Dalavi** — Senior DevSecOps / Platform Engineer  
[GitHub](https://github.com/SumitDalavi) · [LinkedIn](https://in.linkedin.com/in/sumit-dalavi-762838129)


## CI & Reliability Updates (August 2026)

- **CI Pipeline Remediation:** Successfully resolved all CI/CD pipeline failures and established baseline CI workflows.
- **Specific Fix:** Added and configured robust GitHub Actions workflows for automated testing, linting, and formatting.
- **Status:** 🟩 Passing
