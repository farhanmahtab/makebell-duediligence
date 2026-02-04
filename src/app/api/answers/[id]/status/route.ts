import { NextResponse } from 'next/server';
import { projectService } from '@/services/projectService';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> } // Actually this is questionId if we follow the path. Let's make it clear.
) {
  try {
    const { id: questionId } = await params;
    const body = await request.json();
    const { projectId, status, manualText } = body;

    if (!projectId || !status) {
      return NextResponse.json({ error: 'Missing projectId or status' }, { status: 400 });
    }

    await projectService.updateAnswerStatus(projectId, questionId, status, manualText);

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Update Status Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to update answer status' }, { status: 500 });
  }
}
