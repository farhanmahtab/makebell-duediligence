import { NextResponse } from 'next/server';
import { chatService } from '@/services/chatService';

// GET /api/chat/sessions?projectId=xxx
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    
    if (!projectId) {
      return NextResponse.json({ error: 'projectId required' }, { status: 400 });
    }

    const sessions = await chatService.getSessions(projectId);
    return NextResponse.json(sessions);
  } catch (error: any) {
    console.error('Get sessions error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch sessions' },
      { status: 500 }
    );
  }
}

// POST /api/chat/sessions
export async function POST(request: Request) {
  try {
    const { projectId, title } = await request.json();
    
    if (!projectId) {
      return NextResponse.json({ error: 'projectId required' }, { status: 400 });
    }

    const session = await chatService.createSession(projectId, title);
    return NextResponse.json(session);
  } catch (error: any) {
    console.error('Create session error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create session' },
      { status: 500 }
    );
  }
}
