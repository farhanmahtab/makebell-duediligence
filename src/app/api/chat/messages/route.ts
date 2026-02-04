import { NextResponse } from 'next/server';
import { chatService } from '@/services/chatService';

// POST /api/chat/messages
export async function POST(request: Request) {
  try {
    const { sessionId, message } = await request.json();
    
    if (!sessionId || !message) {
      return NextResponse.json(
        { error: 'sessionId and message required' },
        { status: 400 }
      );
    }

    const result = await chatService.sendMessage(sessionId, message);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Send message error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to send message' },
      { status: 500 }
    );
  }
}
