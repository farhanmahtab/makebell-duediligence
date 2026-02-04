import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
// Polyfill for pdf-parse v2.4.5 in Node.js environment
if (typeof global !== 'undefined') {
  // @ts-ignore
  if (!global.DOMMatrix) global.DOMMatrix = class DOMMatrix {};
  // @ts-ignore
  if (!global.ImageData) global.ImageData = class ImageData {};
  // @ts-ignore
  if (!global.Path2D) global.Path2D = class Path2D {};
  // Force fake worker to avoid dynamic loading issues in Next.js
  // @ts-ignore
  global.PDFJS_DISABLE_WORKER = true;
  // @ts-ignore
  global.Worker = null;
}

// @ts-ignore
const pdf = require('pdf-parse');
import mammoth from 'mammoth';
import * as XLSX from 'xlsx';

const DATA_DIR = path.join(process.cwd(), 'data');

export const ingestionService = {
  // List available files in the data directory
  listAvailableFiles: async (): Promise<string[]> => {
    if (!fs.existsSync(DATA_DIR)) {
      return [];
    }
    const files = await fs.promises.readdir(DATA_DIR);
    return files.filter(f => 
       f.endsWith('.pdf') || 
       f.endsWith('.docx') || 
       f.endsWith('.xlsx')
    );
  },

  // Simulate indexing a document (extract text and return it)
  indexDocument: async (filename: string): Promise<string> => {
    const filePath = path.join(DATA_DIR, filename);
    if (!fs.existsSync(filePath)) {
      throw new Error(`File ${filename} not found`);
    }

    const ext = path.extname(filename).toLowerCase();
    const dataBuffer = await fs.promises.readFile(filePath);

    if (ext === '.pdf') {
      // @ts-ignore
      const pdfParserClass = pdf.PDFParse || pdf.default || pdf;
      const parser = new (pdfParserClass as any)(new Uint8Array(dataBuffer));
      const result = await parser.getText();

      if (result.text) return result.text;
      if (result.pages) {
        return result.pages
          .sort((a: any, b: any) => a.pageNumber - b.pageNumber)
          .map((p: any) => p.text)
          .join('\n');
      }
      return '';
    } 
    
    if (ext === '.docx') {
      const result = await mammoth.extractRawText({ buffer: dataBuffer });
      return result.value;
    }

    if (ext === '.xlsx') {
      const workbook = XLSX.read(dataBuffer, { type: 'buffer' });
      let fullText = '';
      workbook.SheetNames.forEach(sheetName => {
        const sheet = workbook.Sheets[sheetName];
        fullText += XLSX.utils.sheet_to_txt(sheet) + '\n';
      });
      return fullText;
    }

    throw new Error(`Unsupported file extension: ${ext}`);
  },
  
  // Helper to chunk text (naive implementation)
  chunkText: (text: string, chunkSize: number = 1000): string[] => {
    if (!text) return [];
    const chunks = [];
    for (let i = 0; i < text.length; i += chunkSize) {
      chunks.push(text.slice(i, i + chunkSize));
    }
    return chunks;
  }
};
