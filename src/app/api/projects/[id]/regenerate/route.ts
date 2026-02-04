import { NextResponse } from 'next/server';
import { projectService } from '@/services/projectService';
import { qaService } from '@/services/qaService';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
    const project = await projectService.getById(projectId);

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    if (project.documents.length === 0) {
      return NextResponse.json({ error: 'No documents available for generation' }, { status: 400 });
    }

    const results = [];
    
    // Batch process questions
    // In a real app, this should be a background job. For demo, we do it in-process.
    for (const question of project.questions) {
      try {
        const answer = await qaService.generateAnswer(question.text, project.documents);
        await projectService.updateAnswer(projectId, question.id, answer);
        results.push({ questionId: question.id, success: true });
      } catch (e: any) {
        console.error(`Failed to generate answer for ${question.id}:`, e);
        results.push({ questionId: question.id, success: false, error: e.message });
      }
    }

    // Reset project status to active if it was OUTDATED
    await projectService.updateProjectStatus(projectId, 'active');

    return NextResponse.json({ 
      success: true, 
      count: results.length,
      processed: results 
    });

  } catch (error: any) {
    console.error('Batch Regeneration Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to regenerate answers' }, { status: 500 });
  }
}
