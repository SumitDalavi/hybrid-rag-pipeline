# Decisions

## ADR-001: Hybrid Retrieval via Reciprocal Rank Fusion (RRF)
**Date:** 2026-08-29  
**Status:** Accepted

**Context:**  
Dense vectors are excellent for semantic meaning but fail at exact keyword lookups (e.g., error codes or UUIDs). BM25 (sparse search) excels at keyword frequency but lacks semantic understanding.

**Decision:**  
We implemented both search methods and merge their results using Reciprocal Rank Fusion (RRF). RRF does not require calibrating scores between the two completely different systems; it just relies on the rank order.

**Consequences:**  
- ✅ Significant improvement in recall for domain-specific queries (error codes, product IDs).
- ✅ System is robust against varying scale of scores between dense and sparse backends.
- ⚠️ Doubles the search latency since we execute two queries. However, both can be executed in parallel.

## ADR-002: Progressive Credential Loading (PCL) Architecture
- **Context:** Production hardening required live backends (PostgreSQL, Redis, OpenAI, Anthropic), but removing mocks would break CI pipelines and create high developer onboarding friction.
- **Decision:** Implement Progressive Credential Loading. Keep in-memory and local mock heuristics as the default safe baseline, while wrapping external integrations in auto-promoting factory adapters triggered by environment variables.
- **Consequences:** 
  - *Pros:* 100% CI pass rate without requiring external secrets; zero setup friction for new contributors; progressive upgrade to production clusters.
  - *Cons:* Adds lightweight factory abstraction layers and runtime credential detection logic.
