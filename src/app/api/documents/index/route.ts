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
    // In a real app this might be a background job. Here we await it or fire-and-forget?
    // We'll await for simplicity in demo.
    try {
        const text = await ingestionService.indexDocument(filename);
        
        // Update document status to indexed (in memory hack: we need to update the object ref)
        // Since projectService stores in memory objects, modifying the returned doc object *should* work if it's a reference,
        // but projectService.addDocument returned a new object or ref?
        // Let's rely on reference or add an updateDocumentStatus method in service if needed.
        // For now, I'll update the doc object directly as it's in-memory.
        doc.status = 'indexed';
        doc.content = text;
        
        return NextResponse.json(doc);
    } catch (e) {
        doc.status = 'failed';
        return NextResponse.json({ error: 'Indexing failed' }, { status: 500 });
    }

  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
