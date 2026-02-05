# QA Service Architecture: Trade-offs & Design Decisions

This document provides a comprehensive analysis of the trade-offs made in the QA (Question-Answering) service implementation for the Due Diligence platform.

## Table of Contents

1. [Overview](#overview)
2. [Current Architecture](#current-architecture)
3. [Advantages](#advantages)
4. [Limitations & Trade-offs](#limitations--trade-offs)
5. [Code-Level Analysis](#code-level-analysis)
6. [Comparison with Alternatives](#comparison-with-alternatives)
7. [Recommendations for Improvement](#recommendations-for-improvement)
8. [When to Use This Approach](#when-to-use-this-approach)

---

## Overview

The QA service implements a **Keyword-Based RAG (Retrieval-Augmented Generation)** pattern for answering questions based on uploaded due diligence documents. This approach prioritizes simplicity and cost-effectiveness over semantic accuracy.

### Architecture Diagram

```
┌──────────────┐     ┌─────────────────┐     ┌──────────────┐
│   Question   │────▶│  Keyword-Based  │────▶│   Top 3      │
│              │     │  Chunk Ranking  │     │   Chunks     │
└──────────────┘     └─────────────────┘     └──────────────┘
                                                    │
┌──────────────┐     ┌─────────────────┐            ▼
│   Answer +   │◀────│   LLM (Groq)    │◀────┌──────────────┐
│  Citations   │     │   Generation    │     │   Context    │
└──────────────┘     └─────────────────┘     │   Window     │
                                             └──────────────┘
```

---

## Current Architecture

### File Location

`src/services/qaService.ts`

### Key Components

| Component              | Description                                                         |
| ---------------------- | ------------------------------------------------------------------- |
| **Document Loading**   | Iterates through all documents, using cached content or re-indexing |
| **Text Chunking**      | Splits combined document content into 2000-character chunks         |
| **Keyword Extraction** | Extracts keywords from question (words > 3 characters)              |
| **Chunk Ranking**      | Scores chunks by keyword occurrence count                           |
| **Context Assembly**   | Combines top 3 chunks into context window                           |
| **LLM Generation**     | Sends context + question to Groq's Llama model                      |
| **Citation Creation**  | Generates basic citation from first document                        |

### Process Flow

```typescript
1. Gather all document content → allContext
2. Split into chunks → chunks = chunkText(allContext, 2000)
3. Extract keywords → keywords = question.split(' ').filter(w => w.length > 3)
4. Score chunks → score = count of keyword occurrences
5. Select top 3 → bestChunks = sorted.slice(0, 3)
6. Generate answer → llmService.generateAnswerFromContext(question, bestChunks)
7. Return with citation
```

---

## Advantages

### 1. Simplicity & Maintainability

| Benefit                      | Details                                                                        |
| ---------------------------- | ------------------------------------------------------------------------------ |
| **No External Dependencies** | No vector database, embedding service, or complex infrastructure               |
| **Easy to Debug**            | Straightforward logic makes it easy to trace why specific chunks were selected |
| **Low Learning Curve**       | Any developer can understand and modify the code quickly                       |
| **Fast Iteration**           | Changes can be made and tested rapidly                                         |

### 2. Cost Effectiveness

| Cost Factor                | Keyword-Based | Embedding-Based    |
| -------------------------- | ------------- | ------------------ |
| Embedding API calls        | $0            | ~$0.0001/1K tokens |
| Vector DB hosting          | $0            | $20-100+/month     |
| LLM calls only             | ✓             | ✓                  |
| Total monthly (1K queries) | ~$1-5         | ~$25-100+          |

### 3. Performance

- **Fast Retrieval**: Simple string matching is O(n) where n is text length
- **No Network Latency**: No calls to embedding APIs during retrieval
- **Predictable Timing**: Consistent performance regardless of query complexity

### 4. Privacy & Data Locality

- All processing happens locally (except LLM generation)
- No document content sent to embedding services
- Documents remain in your infrastructure

---

## Limitations & Trade-offs

### 1. Semantic Understanding Gap

**Problem**: Keyword matching cannot understand meaning, synonyms, or context.

| Query                            | Expected Match                           | Actual Match                          |
| -------------------------------- | ---------------------------------------- | ------------------------------------- |
| "What is the company's revenue?" | "Total income was $5M..."                | ❌ Not matched (no "revenue" keyword) |
| "Who founded the startup?"       | "The company was established by John..." | ❌ Not matched                        |
| "Annual profits"                 | "Yearly earnings report..."              | ❌ Not matched                        |

**Impact**: Questions using different terminology than documents will fail to retrieve relevant context.

### 2. Keyword Filtering Logic

```typescript
const keywords = questionText
  .toLowerCase()
  .split(" ")
  .filter((w) => w.length > 3);
```

**Issues**:

- Filters out important short words: "CEO", "CFO", "ROI", "Q4", "AI", "ML"
- No stop-word removal: "what", "this", "that", "have" are included
- No stemming: "running" won't match "run" or "runs"

### 3. Fixed Chunk Size

```typescript
const chunks = ingestionService.chunkText(allContext, 2000);
```

**Trade-offs**:

| Chunk Size           | Pros                          | Cons                                       |
| -------------------- | ----------------------------- | ------------------------------------------ |
| 2000 chars (current) | Fits most LLM context windows | May split sentences mid-thought            |
| Smaller (500)        | More precise retrieval        | More chunks to rank, context fragmentation |
| Larger (4000)        | Better context preservation   | Fewer chunks, less precision               |
| Semantic chunking    | Preserves meaning boundaries  | More complex implementation                |

### 4. Citation Quality

**Current Implementation**:

```typescript
citations: [
  {
    documentId: documents[0]?.id || "unknown",
    documentName: documents[0]?.name || "Multiple Documents",
    textSnippet: citationSnippet,
    relevanceScore: confidence === "high" ? 3 : confidence === "medium" ? 2 : 1,
  },
];
```

**Issues**:

1. Only first document is cited, regardless of actual source
2. Citation snippet is first 200 chars of combined chunks, not actual quoted text
3. No page numbers or specific location references
4. Cannot trace answer back to specific document sections

### 5. Ranking Algorithm

**Current**: Simple keyword occurrence count

```typescript
const score = keywords.reduce(
  (acc, kw) => acc + (chunkLower.includes(kw) ? 1 : 0),
  0,
);
```

**Missing Features**:

- Term frequency (TF): How often keyword appears
- Inverse document frequency (IDF): Rare words should score higher
- Proximity scoring: Keywords close together should score higher
- Phrase matching: "cash flow" as a unit vs separate words

### 6. Scalability Constraints

| Metric           | Current Limit | Bottleneck                     |
| ---------------- | ------------- | ------------------------------ |
| Documents        | ~50-100       | Memory for loading all content |
| Total text       | ~500KB-1MB    | Processing time for chunking   |
| Concurrent users | ~10-20        | Synchronous processing         |

---

## Code-Level Analysis

### Critical Trade-off Points

#### 1. Top-K Selection (Line 42-44)

```typescript
.slice(0, 3) // Take top 3 chunks
```

**Trade-off**:

- **Pro**: Limits context size for LLM, reduces cost
- **Con**: Important information in 4th+ chunks is lost
- **Alternative**: Dynamic selection based on score threshold

#### 2. Fallback Logic (Line 48-50)

```typescript
if (!bestChunks.trim()) {
  bestChunks = chunks[0] || allContext.substring(0, 2000);
}
```

**Trade-off**:

- **Pro**: Ensures some context is always provided
- **Con**: First chunk may be completely irrelevant (e.g., table of contents)
- **Alternative**: Random sampling or middle chunk selection

#### 3. Error Handling (Line 73-82)

```typescript
catch (error: any) {
  return {
    text: `Error generating answer: ${error.message}...`,
    confidence: 'low',
    ...
  };
}
```

**Trade-off**:

- **Pro**: Graceful degradation, user sees helpful error
- **Con**: No retry logic, no fallback models
- **Alternative**: Implement retry with exponential backoff

---

## Comparison with Alternatives

### Option A: Vector Embedding + Semantic Search

```
┌──────────────┐     ┌─────────────────┐     ┌──────────────┐
│   Question   │────▶│   Embedding     │────▶│   Vector     │
│              │     │   API (OpenAI)  │     │   Search     │
└──────────────┘     └─────────────────┘     └──────────────┘
                                                    │
                     ┌─────────────────┐            ▼
                     │   Vector DB     │◀────┌──────────────┐
                     │   (ChromaDB)    │     │   Top-K      │
                     └─────────────────┘     │   Similarity │
                                             └──────────────┘
```

| Aspect                 | Keyword-Based (Current) | Vector Embedding    |
| ---------------------- | ----------------------- | ------------------- |
| Semantic understanding | ❌ None                 | ✅ Excellent        |
| Setup complexity       | ✅ Simple               | ❌ Complex          |
| Cost per query         | ✅ ~$0.001              | ⚠️ ~$0.01           |
| Infrastructure         | ✅ None                 | ❌ Vector DB needed |
| Synonym handling       | ❌ No                   | ✅ Yes              |
| Scalability            | ⚠️ Limited              | ✅ Excellent        |

### Option B: Hybrid Search (BM25 + Embeddings)

Best of both worlds, but most complex:

| Aspect          | Score              |
| --------------- | ------------------ |
| Accuracy        | ⭐⭐⭐⭐⭐         |
| Complexity      | ⭐⭐               |
| Cost            | ⭐⭐⭐             |
| Recommended for | Production systems |

### Option C: Full Document Context (No Retrieval)

Send entire document(s) to LLM:

| Aspect          | Score                         |
| --------------- | ----------------------------- |
| Accuracy        | ⭐⭐⭐⭐                      |
| Complexity      | ⭐⭐⭐⭐⭐                    |
| Cost            | ⭐ (expensive for large docs) |
| Recommended for | Small documents only          |

---

## Recommendations for Improvement

### Short-term (Low Effort)

1. **Improve Keyword Extraction**

```typescript
// Add common abbreviations to preserve
const preserveWords = ["ceo", "cfo", "roi", "q1", "q2", "q3", "q4", "ai", "ml"];
const keywords = questionText
  .toLowerCase()
  .split(/\s+/)
  .filter((w) => w.length > 3 || preserveWords.includes(w))
  .filter((w) => !stopWords.includes(w));
```

2. **Add TF-IDF Scoring**

```typescript
const tf = (term, chunk) => (chunk.match(new RegExp(term, "gi")) || []).length;
const idf = (term, chunks) =>
  Math.log(chunks.length / chunks.filter((c) => c.includes(term)).length);
const score = keywords.reduce(
  (acc, kw) => acc + tf(kw, chunk) * idf(kw, chunks),
  0,
);
```

3. **Fix Citation Tracking**

```typescript
// Track source document per chunk
const chunksWithSource = documents.flatMap((doc) =>
  ingestionService.chunkText(doc.content, 2000).map((chunk) => ({
    chunk,
    docId: doc.id,
    docName: doc.name,
  })),
);
```

### Medium-term (Moderate Effort)

4. **Implement Semantic Chunking**
   - Split on sentence/paragraph boundaries
   - Use overlap between chunks
   - Preserve headers with their content

5. **Add BM25 Ranking**
   - Use `wink-bm25-text-search` npm package
   - Significant improvement with minimal code changes

### Long-term (High Effort)

6. **Vector Embeddings**
   - Use ChromaDB (local) or Pinecone (hosted)
   - HuggingFace `all-MiniLM-L6-v2` for free embeddings
   - Or OpenAI `text-embedding-3-small` for best quality

7. **Hybrid Search**
   - Combine BM25 scores with vector similarity
   - Rerank with cross-encoder model

---

## When to Use This Approach

### ✅ Good Fit

- Small document sets (< 50 documents)
- MVP/Prototype phase
- Budget-constrained projects
- Simple, keyword-matching queries
- Internal tools with known vocabulary

### ❌ Not Recommended

- Large document corpus (> 100 documents)
- Complex semantic queries
- Production systems requiring high accuracy
- Legal/compliance where precision matters
- Multi-language documents

---

## Conclusion

The current keyword-based approach is a **pragmatic MVP solution** that prioritizes simplicity and cost over retrieval accuracy. It works well for small document sets with straightforward queries but will struggle with semantic understanding and scalability.

For production deployment with higher accuracy requirements, consider migrating to a hybrid BM25 + embedding approach with proper citation tracking.

---

## References

- [RAG Patterns](https://www.pinecone.io/learn/retrieval-augmented-generation/)
- [BM25 Algorithm](https://en.wikipedia.org/wiki/Okapi_BM25)
- [ChromaDB Documentation](https://docs.trychroma.com/)
- [Groq API Documentation](https://console.groq.com/docs/)

---

_Last Updated: February 2026_
