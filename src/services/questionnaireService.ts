import { ingestionService } from './ingestionService';
import { Question } from '../types';

export const questionnaireService = {
  /**
   * Parses a file to extract questions and their sections.
   * This is a heuristic-based parser for common questionnaire formats.
   */
  parseFromFile: async (filename: string): Promise<{ text: string; section: string }[]> => {
    const text = await ingestionService.indexDocument(filename);
    const ext = filename.split('.').pop()?.toLowerCase();

    if (ext === 'pdf' || ext === 'docx') {
      return questionnaireService.parseTextHeuristic(text);
    } else if (ext === 'xlsx') {
      return questionnaireService.parseExcelHeuristic(text);
    }

    return [];
  },

  /**
   * Heuristic for PDF/DOCX: Looks for numbered questions and section headers.
   */
  parseTextHeuristic: (text: string): { text: string; section: string }[] => {
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    const questions: { text: string; section: string }[] = [];
    let currentSection = 'General';

    // Regex for section headers like "1. General Firm Information" or "Section 1: ..."
    const sectionRegex = /^(?:Section\s+)?(\d+)\.\s+([A-Z][\w\s/&-]+)$/;
    // Regex for questions like "1.1 Has the Firm..." or "Q1. ..."
    const questionRegex = /^(?:Q)?(\d+(?:\.\d+)?)\.?\s+(.+)$/;

    for (const line of lines) {
      const sectionMatch = line.match(sectionRegex);
      if (sectionMatch) {
        currentSection = sectionMatch[2].trim();
        continue;
      }

      const questionMatch = line.match(questionRegex);
      if (questionMatch) {
        let questionText = questionMatch[2].trim();
        // If the line is short, it might be just a header, but we'll include it if it ends in a question mark or is at least 20 chars
        if (questionText.endsWith('?') || questionText.length > 20) {
          questions.push({
            text: questionText,
            section: currentSection
          });
        }
      }
    }

    // Fallback: if no questions found by regex, but we have long lines ending in ?, use them
    if (questions.length === 0) {
        for (const line of lines) {
            if (line.endsWith('?') && line.length > 15) {
                questions.push({ text: line, section: 'General' });
            }
        }
    }

    return questions;
  },

  /**
   * Heuristic for Excel: Assumes questions are in a list, often the first non-empty column.
   */
  parseExcelHeuristic: (text: string): { text: string; section: string }[] => {
    // xlsx sheet_to_txt gives tab separated or newline separated values
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    const questions: { text: string; section: string }[] = [];

    for (const line of lines) {
        // Look for cells that look like questions (at least 20 chars and ends in ? or just long)
        // Usually, Excel rows have section/category in one column and question in another.
        // For simplicity, if a line has multiple parts (tabs), use the last part that ends in ?
        const parts = line.split('\t').map(p => p.trim());
        const possibleQuestion = parts[parts.length - 1];
        
        if (possibleQuestion && (possibleQuestion.endsWith('?') || possibleQuestion.length > 30)) {
            const possibleSection = parts.length > 1 ? parts[0] : 'General';
            questions.push({
                text: possibleQuestion,
                section: possibleSection
            });
        }
    }

    return questions;
  }
};
