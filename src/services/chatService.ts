import { prisma } from '@/lib/db';
import { qaService } from './qaService';

export const chatService = {
  // Create new chat session
  createSession: async (projectId: string, title?: string) => {
    return await prisma.chatSession.create({
      data: {
        projectId,
        title: title || 'New Chat',
      },
      include: {
        messages: {
          include: { citations: true },
        },
      },
    });
  },

  // Get all sessions for a project
  getSessions: async (projectId: string) => {
    return await prisma.chatSession.findMany({
      where: { projectId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          include: { citations: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
  },

  // Get single session
  getSession: async (sessionId: string) => {
    return await prisma.chatSession.findUnique({
      where: { id: sessionId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          include: { citations: true },
        },
        project: true,
      },
    });
  },

  // Send message and get AI response
  sendMessage: async (sessionId: string, userMessage: string) => {
    // Save user message
    const userMsg = await prisma.chatMessage.create({
      data: {
        sessionId,
        role: 'user',
        content: userMessage,
      },
    });

    // Get session with project and documents
    const session = await prisma.chatSession.findUnique({
      where: { id: sessionId },
      include: { 
        project: {
          include: {
            documents: true
          }
        }
      },
    });

    if (!session) throw new Error('Session not found');

    // Generate AI response using existing QA service
    const aiResponse = await qaService.generateAnswer(
      userMessage,
      session.project.documents as any // Type cast for Prisma compatibility
    );

    // Save assistant message with citations
    const assistantMsg = await prisma.chatMessage.create({
      data: {
        sessionId,
        role: 'assistant',
        content: aiResponse.text,
        confidence: aiResponse.confidence,
        citations: {
          create: aiResponse.citations.map(c => ({
            documentId: c.documentId,
            documentName: c.documentName,
            textSnippet: c.textSnippet,
            pageNumber: c.pageNumber,
            relevanceScore: c.relevanceScore,
          })),
        },
      },
      include: { citations: true },
    });

    // Update session timestamp
    await prisma.chatSession.update({
      where: { id: sessionId },
      data: { updatedAt: new Date() },
    });

    return { userMsg, assistantMsg };
  },

  // Update session title
  updateSessionTitle: async (sessionId: string, title: string) => {
    return await prisma.chatSession.update({
      where: { id: sessionId },
      data: { title },
    });
  },

  // Delete session
  deleteSession: async (sessionId: string) => {
    await prisma.chatSession.delete({
      where: { id: sessionId },
    });
  },
};
