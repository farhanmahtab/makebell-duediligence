# Project Walkthrough - Questionnaire Agent

## 🚀 Overview

The **Questionnaire Agent** is a full-stack automated due diligence platform designed to streamline the process of answering complex questionnaires using AI. It ingests documents, indexes them, and uses advanced Large Language Models (LLMs) to generate accurate, cited answers.

Key capabilities include:
- **Intelligent Q&A**: Generates high-confidence answers with citations using Groq's Llama 3.3.
- **Review Workflow**: Allows human experts to confirm, reject, or manually override AI answers.
- **Evaluation Framework**: Benchmarks AI performance against human inputs.
- **Chat Assistant**: Provides an interactive chat interface for ad-hoc document queries.

---

## ✨ Key Features

### 1. Document Ingestion & Indexing
- **Multi-format Support**: Handles PDF, DOCX, XLSX, and text files.
- **Intelligent Chunking**: Splits documents into semantic chunks for efficient retrieval.
- **Status Tracking**: Visual indicators for indexing status (Indexed, Pending, Failed).

### 2. LLM-Powered Answer Generation
- **Model**: Utilizes **Llama 3.3 70B** via Groq for state-of-the-art reasoning.
- **RAG Architecture**: Retrieval-Augmented Generation ensures answers are grounded in provided documents.
- **Citations**: Every answer includes specific citations (text snippets) to the source document.
- **Confidence Scoring**: AI assigns High/Medium/Low confidence scores to each answer.

### 3. Review & Manual Overrides
- **Workflow**: 
  - `CONFIRMED`: Answer accepted by human reviewer.
  - `REJECTED/MISSING_DATA`: Answer flagged for attention.
  - `MANUAL_OVERRIDE`: Human expert provides a corrected answer.
- **Audit Trail**: Manual edits are preserved alongside original AI answers for comparison.

### 4. Evaluation Framework
- **Comparison**: Automatically compares AI answers vs Human overrides.
- **Metrics**: Calculates semantic similarity and keyword overlap scores (0-100%).
- **Reporting**: Provides visual dashboards with average accuracy and detailed explanations.

### 5. Chat Extensions
- **Interactive Q&A**: Chat interface to ask follow-up questions about the project documents.
- **Context Aware**: Uses the same indexed corpus as the main questionnaire engine.
- **History**: Saves chat sessions for future reference.

---

## 🛠️ Technical Architecture

### Stack
- **Frontend**: Next.js 16 (App Router), React 19, Tailwind CSS
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL
- **AI/LLM**: Groq API (Llama 3.3 70B)
- **Language**: TypeScript

### Core Services
- `ingestionService`: Handles file parsing and vector-ready chunking.
- `qaService`: Manages RAG pipeline and LLM interaction.
- `projectService`: Orchestrates project lifecycle and data persistence.
- `chatService`: Manages real-time chat sessions.
- `evaluationService`: Computes accuracy metrics.

---

## 📦 Setup & Installation

### Prerequisites
- Node.js 18+
- PostgreSQL
- Groq API Key (Free at console.groq.com)

### Steps
1. **Clone & Install**
   ```bash
   git clone <repo-url>
   cd DueDiligence
   npm install
   ```

2. **Configure Environment**
   Create `.env.local` with the following:
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/duediligence"
   GROQ_API_KEY="gsk_..."
   LLM_MODEL="llama-3.3-70b-versatile"
   ```

3. **Database Setup**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

4. **Run Application**
   ```bash
   npm run dev
   ```
   Visit `http://localhost:3000`

---

## 📖 Usage Guide

### Creating a Project
1. Click **"New Project"**.
2. Upload due diligence documents (PDFs, etc.).
3. Upload a questionnaire file or use default questions.

### Generating Answers
1. Go to the **"Questions"** tab.
2. Click **"Generate Answer"** for a specific question, or use **"Regenerate All"**.
3. View the AI-generated response, confidence score, and citation.

### Reviewing Answers
1. Review the AI answer.
2. Click **"Confirm"** if correct.
3. Click **"Edit"** to provide a manual override. The status will update to `MANUAL_UPDATED`.

### Running Evaluation
1. Ensure you have some manual overrides provided (Ground Truth).
2. Go to the **"Evaluation"** tab.
3. Click **"Run Evaluation"**.
4. View the accuracy scores and detailed comparison report.

### Using Chat
1. Go to the **"Chat"** tab.
2. Create a new session.
3. Ask questions like "What are the key risks mentioned in the documents?".

---

## ✅ Verification

To verify the entire system functionality, run the end-to-end test suite:

```bash
npx tsx scripts/test-e2e.ts
```

This script verifies:
- Project creation
- Document indexing
- Question extraction
- LLM answer generation
- Chat functionality
- Evaluation logic

---
