import { NextResponse } from 'next/server';
import { projectService } from '@/services/projectService';
import { qaService } from '@/services/qaService';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { projectId, questionId } = body;

    if (!projectId || !questionId) {
      return NextResponse.json({ error: 'Missing projectId or questionId' }, { status: 400 });
    }

    const project = await projectService.getById(projectId);
    if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    
    const question = project.questions.find(q => q.id === questionId);
    if (!question) return NextResponse.json({ error: 'Question not found' }, { status: 404 });

    // Generate Answer
    const answer = await qaService.generateAnswer(question.text, project.documents);
    
    // Save Answer
    await projectService.updateAnswer(projectId, questionId, answer);

    return NextResponse.json({ success: true, answer });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to generate answer' }, { status: 500 });
  }
}
