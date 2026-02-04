import { Answer, Document } from '../types';
import { ingestionService } from './ingestionService';
import { llmService } from '@/lib/llm';
import path from 'path';

export const qaService = {
  generateAnswer: async (questionText: string, documents: Document[]): Promise<Answer> => {
    // 1. Gather context from all indexed documents
    let allContext = '';
    for (const doc of documents) {
      if (doc.content) {
        allContext += `\n--- ${doc.name} ---\n${doc.content}\n`;
      } else if (doc.status === 'indexed') {
        // Attempt to re-read if content missing from memory but status claims indexed
        try {
          const text = await ingestionService.indexDocument(path.basename(doc.path));
          allContext += `\n--- ${doc.name} ---\n${text}\n`;
        } catch (e) {
          console.error(`Failed to read doc ${doc.name}`);
        }
      }
    }

    // 2. Handle no documents case
    if (!allContext.trim()) {
      return {
        text: "No documents available to answer this question.",
        confidence: 'low',
        citations: [],
        status: 'completed',
        generatedAt: new Date().toISOString()
      };
    }

    // 3. Chunk context for better relevance (take most relevant chunks)
    const chunks = ingestionService.chunkText(allContext, 2000);
    
    // Simple keyword-based chunk selection
    const keywords = questionText.toLowerCase().split(' ').filter(w => w.length > 3);
    let bestChunks = chunks
      .map(chunk => {
        const chunkLower = chunk.toLowerCase();
        const score = keywords.reduce((acc, kw) => 
          acc + (chunkLower.includes(kw) ? 1 : 0), 0
        );
        return { chunk, score };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 3) // Take top 3 chunks
      .map(c => c.chunk)
      .join('\n\n');

    // If no good chunks, use first chunk
    if (!bestChunks.trim()) {
      bestChunks = chunks[0] || allContext.substring(0, 2000);
    }

    // 4. Generate answer using LLM
    try {
      const { answer, confidence } = await llmService.generateAnswerFromContext(
        questionText,
        bestChunks
      );

      // 5. Extract citation snippet
      const citationSnippet = bestChunks.substring(0, 200).trim();

      return {
        text: answer,
        confidence,
        citations: [{
          documentId: documents[0]?.id || 'unknown',
          documentName: documents[0]?.name || 'Multiple Documents',
          textSnippet: citationSnippet,
          relevanceScore: confidence === 'high' ? 3 : confidence === 'medium' ? 2 : 1
        }],
        status: 'completed',
        generatedAt: new Date().toISOString()
      };
    } catch (error: any) {
      console.error('LLM generation error:', error);
      
      // Fallback to simple response if LLM fails
      return {
        text: `Error generating answer: ${error.message}. Please check your GROQ_API_KEY in .env.local file.`,
        confidence: 'low',
        citations: [],
        status: 'completed',
        generatedAt: new Date().toISOString()
      };
    }
  }
};
