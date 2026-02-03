import fs from 'fs';
import path from 'path';
import pdf from 'pdf-parse';

const DATA_DIR = path.join(process.cwd(), 'data');

export const ingestionService = {
  // List available files in the data directory
  listAvailableFiles: async (): Promise<string[]> => {
    if (!fs.existsSync(DATA_DIR)) {
      return [];
    }
    const files = await fs.promises.readdir(DATA_DIR);
    return files.filter(f => f.endsWith('.pdf'));
  },

  // Simulate indexing a document (extract text and return it)
  indexDocument: async (filename: string): Promise<string> => {
    const filePath = path.join(DATA_DIR, filename);
    if (!fs.existsSync(filePath)) {
      throw new Error(`File ${filename} not found`);
    }

    const dataBuffer = await fs.promises.readFile(filePath);
    const data = await pdf(dataBuffer);
    return data.text;
  },
  
  // Helper to chunk text (naive implementation)
  chunkText: (text: string, chunkSize: number = 1000): string[] => {
    const chunks = [];
    for (let i = 0; i < text.length; i += chunkSize) {
      chunks.push(text.slice(i, i + chunkSize));
    }
    return chunks;
  }
};
