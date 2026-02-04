import { NextResponse } from 'next/server';
import { chatService } from '@/services/chatService';

// DELETE /api/chat/sessions/[id]
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await chatService.deleteSession(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delete session error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete session' },
      { status: 500 }
    );
  }
}

// PATCH /api/chat/sessions/[id]
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { title } = await request.json();
    
    if (!title) {
      return NextResponse.json({ error: 'title required' }, { status: 400 });
    }

    const session = await chatService.updateSessionTitle(id, title);
    return NextResponse.json(session);
  } catch (error: any) {
    console.error('Update session error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update session' },
      { status: 500 }
    );
  }
}
