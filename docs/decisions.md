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
