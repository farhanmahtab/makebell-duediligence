import { Answer, Document, Project } from '../types';
import { ingestionService } from './ingestionService';

// Mock QA Service
export const qaService = {
  generateAnswer: async (questionText: string, documents: Document[]): Promise<Answer> => {
    // 1. Gather context from all indexed documents
    let allContext = '';
    for (const doc of documents) {
      if (doc.content) {
        allContext += doc.content + '\n';
      } else if (doc.status === 'indexed') {
         // Attempt to re-read if content missing from memory but status claims indexed
         // In real app, this would fetch from vector store
         try {
             const text = await ingestionService.indexDocument(path.basename(doc.path));
             allContext += text + '\n';
         } catch (e) {
             console.error(`Failed to read doc ${doc.name}`);
         }
      }
    }

    // 2. Simple keyword matching to find a "relevant" chunk
    // Split question into words and filter stop words (naive)
    const keywords = questionText.toLowerCase().split(' ').filter(w => w.length > 3);
    
    // Chunk context
    const chunks = ingestionService.chunkText(allContext, 500);
    
    // Find best chunk
    let bestChunk = '';
    let maxMatches = 0;

    for (const chunk of chunks) {
      const chunkLower = chunk.toLowerCase();
      let matches = 0;
      for (const cw of keywords) {
        if (chunkLower.includes(cw)) matches++;
      }
      if (matches > maxMatches) {
        maxMatches = matches;
        bestChunk = chunk;
      }
    }

    // If no good match, just pick a random chunk or say insufficient data
    if (maxMatches === 0 && chunks.length > 0) {
        bestChunk = chunks[0].substring(0, 200) + '...';
    } else if (chunks.length === 0) {
        return {
            text: "No documents available to answer this question.",
            confidence: 'low',
            citations: [],
            status: 'completed',
            generatedAt: new Date().toISOString()
        };
    }

    // 3. Construct Answer
    return {
      text: `Based on the analysis of provided documents, relevant information was found: "${bestChunk.trim().substring(0, 150)}..."`,
      confidence: maxMatches > 2 ? 'high' : (maxMatches > 0 ? 'medium' : 'low'),
      citations: [{
        documentId: documents[0]?.id || 'unknown',
        documentName: documents[0]?.name || 'unknown',
        textSnippet: bestChunk.substring(0, 50) + '...',
        relevanceScore: maxMatches
      }],
      status: 'completed', // Mark as completed automatically for demo
      generatedAt: new Date().toISOString()
    };
  }
};

import path from 'path'; // Need to import path for the re-read logic
