import { NextResponse } from 'next/server';
import { projectService } from '@/services/projectService';

export async function GET() {
  const projects = await projectService.getAll();
  return NextResponse.json(projects);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, clientName } = body;
    
    if (!name || !clientName) {
      return NextResponse.json(
        { error: 'Name and Client Name are required' }, 
        { status: 400 }
      );
    }

    const project = await projectService.create(name, clientName);
    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Failed to create project' }, 
      { status: 500 }
    );
  }
}
