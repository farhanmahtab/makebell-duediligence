import { NextResponse } from 'next/server';
import { projectService } from '@/services/projectService';
import { ingestionService } from '@/services/ingestionService';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { projectId, filename } = body;

    if (!projectId || !filename) {
      return NextResponse.json({ error: 'Missing projectId or filename' }, { status: 400 });
    }

    // 1. Add document to project with "indexing" status
    const doc = await projectService.addDocument(projectId, {
      name: filename,
      path: `data/${filename}`,
      status: 'indexing'
    });

    // 2. Perform indexing (Mock/Real)
    try {
        const text = await ingestionService.indexDocument(filename);
        
        // Update document status and content in DB
        await projectService.updateDocumentContent(doc.id, text, 'indexed');
        
        return NextResponse.json({ ...doc, status: 'indexed', content: text });
    } catch (e) {
        await projectService.updateDocumentContent(doc.id, '', 'failed');
        return NextResponse.json({ error: 'Indexing failed' }, { status: 500 });
    }

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
