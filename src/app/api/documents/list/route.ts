import { NextResponse } from 'next/server';
import { ingestionService } from '@/services/ingestionService';

export async function GET() {
  try {
    const files = await ingestionService.listAvailableFiles();
    return NextResponse.json(files);
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Failed to list available files' }, 
      { status: 500 }
    );
  }
}
