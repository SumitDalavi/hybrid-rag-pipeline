# Hybrid RAG Pipeline

[![CI Pipeline](https://github.com/SumitDalavi/hybrid-rag-pipeline/actions/workflows/ci.yml/badge.svg?branch=master)](https://github.com/SumitDalavi/hybrid-rag-pipeline/actions/workflows/ci.yml)
[![Release](https://img.shields.io/github/v/release/SumitDalavi/hybrid-rag-pipeline?color=0969da&label=release&logo=github)](https://github.com/SumitDalavi/hybrid-rag-pipeline/releases)
[![Release Workflow](https://github.com/SumitDalavi/hybrid-rag-pipeline/actions/workflows/release.yml/badge.svg)](https://github.com/SumitDalavi/hybrid-rag-pipeline/actions/workflows/release.yml)
[![GHCR Container](https://img.shields.io/badge/ghcr.io-v0.2.0-blue?logo=docker&logoColor=white)](https://github.com/SumitDalavi/hybrid-rag-pipeline/pkgs/container/hybrid-rag-pipeline)
[![Node.js](https://img.shields.io/badge/Node.js-20+-339933?logo=nodedotjs&logoColor=white)](https://nodejs.org)
[![SBOM](https://img.shields.io/badge/SBOM-SPDX%202.3-blueviolet?logo=spdx)](https://github.com/SumitDalavi/hybrid-rag-pipeline/releases/tag/v0.2.0)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)

> **Maturity:** Full Prototype
> _A robust Retrieval-Augmented Generation system using hybrid retrieval._

> **A robust Retrieval-Augmented Generation system using hybrid retrieval (dense vector + sparse keyword), Reciprocal Rank Fusion, and inline citation verification.**

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

## 🚀 Progressive Credential Loading & Execution Tiers

This project implements **Progressive Credential Loading (PCL)**, allowing it to run immediately out-of-the-box without external dependencies while seamlessly upgrading as credentials are provided.

### Tier 1: Zero-Config Mock Mode (Default)
Ideal for CI, testing, and rapid local evaluation.
- **Execution:** Run with default configuration (`cp .env.example .env`). Zero API keys, databases, or cloud credentials required.
- **Fallback Behavior:** In-memory caches, deterministic offline heuristics, mock vector embeddings, and local mock storage are automatically used.
- **Health Verification:** Endpoints report `{"mode": "mock"}` for unconfigured dependencies.

### Tier 2: Local Development with Live Services
Connect specific external services while keeping others mocked.
- **Execution:** Provide credentials in `.env` for the services you want active (e.g., `OPENAI_API_KEY, CHROMA_URL, EMBEDDING_MODEL`).
- **Progressive Upgrade:** The runtime inspects environment variables on boot and dynamically promotes only configured modules to live mode.
- **Safe Fallback:** Any missing credentials automatically remain on mock fallbacks with no crashes or missing service errors.

### Tier 3: Production Hardened
Enterprise deployment with production-grade backends, security scans, and container distributions.
- **OCI Container Image:** Pre-built, multi-arch image on GitHub Container Registry:
  ```bash
  docker pull ghcr.io/sumitdalavi/hybrid-rag-pipeline:v0.2.0
  ```
- **Production Orchestration:** Mount secrets via Kubernetes Secrets or cloud secret managers with atomic config reload support.
- **Release Verification:** Checksums and SPDX SBOM available on [GitHub Releases](https://github.com/SumitDalavi/hybrid-rag-pipeline/releases).

## 📚 Documentation

- [Architecture](docs/ARCHITECTURE.md) — System diagram and component details
- [Runbook](docs/runbook.md) — Setup, commands, and expected outputs
- [Decisions](docs/decisions.md) — ADRs for retrieval pattern choices
- [Changelog](docs/changelog.md) — Change history

## Benchmark Results (Last Run: 2026-08-29)
| Metric | Value | Environment |
|---|---|---|
| NDCG@10 (Dense/Sparse/Hybrid) | 0.8587 / 0.8515 / 0.8431 | Synthesized 1000-doc evaluation |
| Recall@10 (Dense/Sparse/Hybrid) | 0.8227 / 0.8157 / **0.8933** | Synthesized 1000-doc evaluation |

## Key Design Decisions
- **Why Reciprocal Rank Fusion over Score Normalization:** Dense scores (cosine distance) and sparse scores (TF-IDF/BM25) are on entirely different scales. Normalizing them requires fragile, constant tuning. RRF relies strictly on relative ranking position, making it scale-invariant and highly robust out of the box.
- See `docs/adr/` for full Architecture Decision Records.
- See `docs/slo.md` for availability and latency objectives.

## Test Coverage
Tests rank math logic and matrix sorting edge cases.

## Known Limitations & Honest Scope
- **No Secondary Reranker**: This pipeline stops after RRF. While this keeps latency under 100ms, incorporating a cross-encoder (like Cohere Rerank) could further improve absolute precision@3 for highly complex queries.

## 👨‍💻 Author

**Sumit Dalavi** — Senior DevSecOps / Platform Engineer  
[GitHub](https://github.com/SumitDalavi) · [LinkedIn](https://in.linkedin.com/in/sumit-dalavi-762838129)

## CI & Reliability Updates (August 2026)

- **CI Pipeline Remediation:** Successfully resolved all CI/CD pipeline failures and established baseline CI workflows.
- **Specific Fix:** Added and configured robust GitHub Actions workflows for automated testing, linting, and formatting.
- **Status:** 🟩 Passing

## Release & Security Verification

The project includes an automated DevSecOps release pipeline (`.github/workflows/release.yml`) triggered on semantic version tags (`v*.*.*`).

Each release automatically:
1. Executes test suite gates.
2. Builds the container image.
3. Performs vulnerability scanning via Trivy.
4. Generates an SPDX SBOM (`sbom.spdx.json`) using Anchore Syft.
5. Publishes a GitHub Release with attached SBOM.

### Verifying the Release
```bash
# Verify release via GitHub CLI
gh release view v0.1.0 --repo SumitDalavi/hybrid-rag-pipeline

# Download and inspect SBOM
gh release download v0.1.0 --repo SumitDalavi/hybrid-rag-pipeline --pattern "sbom.spdx.json"
cat sbom.spdx.json | jq .
```

## Documentation

- [Architecture](docs/ARCHITECTURE.md)
- [Runbook](docs/runbook.md)
- [Decisions](docs/decisions.md)
- [Changelog](docs/changelog.md)
