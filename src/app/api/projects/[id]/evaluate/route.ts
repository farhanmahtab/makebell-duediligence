import { NextResponse } from 'next/server';
import { evaluationService } from '@/services/evaluationService';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;

    const result = await evaluationService.runProjectEvaluation(projectId);

    return NextResponse.json({ 
      success: true, 
      count: result.count,
      averageScore: result.averageScore
    });

  } catch (error: any) {
    console.error('Evaluation Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to run evaluation' }, { status: 500 });
  }
}
