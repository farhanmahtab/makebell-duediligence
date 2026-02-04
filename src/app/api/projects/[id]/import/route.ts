import { NextResponse } from 'next/server';
import { projectService } from '@/services/projectService';
import { questionnaireService } from '@/services/questionnaireService';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
    const body = await request.json();
    const { filename, mode } = body; // mode: 'replace' | 'append'

    if (!filename) {
      return NextResponse.json({ error: 'Missing filename' }, { status: 400 });
    }

    // 1. Parse questions from file
    const questions = await questionnaireService.parseFromFile(filename);

    if (questions.length === 0) {
      return NextResponse.json({ error: 'No questions found in file' }, { status: 400 });
    }

    // 2. Clear existing questions if mode is replace (default)
    if (mode !== 'append') {
      await projectService.clearQuestions(projectId);
    }

    // 3. Add new questions
    await projectService.addQuestions(projectId, questions);

    return NextResponse.json({ 
      success: true, 
      count: questions.length,
      questions 
    });

  } catch (error: any) {
    console.error('Import Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to import questionnaire' }, { status: 500 });
  }
}
