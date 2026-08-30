# Service Level Objectives

## Latency SLO
- Target: P95 < 250ms for end-to-end context retrieval (excluding LLM generation)
- Context: A user waiting for a RAG response expects latency comparable to ChatGPT. The retrieval step must not add more than 250ms overhead.
- Measurement: OpenTelemetry spans tracing the `Retrieve()` method.

## Quality SLO
- Target: Recall@10 > 0.85 on the benchmark dataset.
- Context: If the relevant document isn't in the top 10 returned by the hybrid pipeline, the LLM physically cannot answer the question. High recall is more important than perfect precision, as the LLM can filter noise.
- Measurement: Evaluated automatically via the CI pipeline using the `hybrid-rag-pipeline/benchmarks/run.ts` harness.

## Availability SLO
- Target: 99.9% uptime
- Error budget: 43.8 minutes/month
- Measurement: Evaluated via synthetic health checks querying a known document.
