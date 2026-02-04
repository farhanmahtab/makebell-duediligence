export type ProjectStatus = 'active' | 'completed' | 'archived' | 'OUTDATED';
export type AssessmentStatus = 'unanswered' | 'processing' | 'completed' | 'review_required' | 'CONFIRMED' | 'REJECTED' | 'MANUAL_UPDATED' | 'MISSING_DATA';
export type DocumentStatus = 'uploaded' | 'indexing' | 'indexed' | 'failed';

export interface Project {
  id: string;
  name: string;
  clientName: string;
  status: ProjectStatus;
  createdAt: string;
  updatedAt: string;
  documents: Document[];
  questions: Question[];
}

export interface Document {
  id: string;
  name: string;
  path: string; // Path in data/ folder or upload path
  status: DocumentStatus;
  uploadedAt: string;
  content?: string; // Extracted text
}

export interface Question {
  id: string;
  text: string;
  section: string;
  answer?: Answer;
}

export interface Answer {
  id?: string;
  text: string;
  manualText?: string;
  confidence: 'high' | 'medium' | 'low';
  citations: Citation[];
  status: AssessmentStatus;
  evalScore?: number;
  evalExplanation?: string;
  generatedAt: string;
}

export interface Citation {
  documentId: string;
  documentName: string;
  pageNumber?: number;
  textSnippet: string;
  relevanceScore: number;
}
