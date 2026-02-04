import { Project, Document, Question, Answer } from '../types';
import { prisma } from '@/lib/db';

const INITIAL_QUESTIONS = [
  { text: 'Does the fund have a dedicated ESG team?', section: 'ESG' },
  { text: 'What is the fund\'s strategy for risk management?', section: 'Risk' },
  { text: 'Provide details on the key investment professionals.', section: 'Team' },
];

export const projectService = {
  getAll: async (): Promise<Project[]> => {
    // @ts-ignore - Prisma types are compatible but strict checking might complain about exact matches
    const projects = await prisma.project.findMany({
      include: {
        documents: true,
        questions: {
          include: {
            answer: {
              include: {
                citations: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    return projects as unknown as Project[];
  },

  getById: async (id: string): Promise<Project | undefined> => {
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        documents: true,
        questions: {
          include: {
            answer: {
              include: {
                citations: true
              }
            }
          },
          orderBy: { section: 'asc' }
        }
      }
    });
    return project as unknown as Project || undefined;
  },

  create: async (name: string, clientName: string): Promise<Project> => {
    const project = await prisma.project.create({
      data: {
        name,
        clientName,
        questions: {
          create: INITIAL_QUESTIONS.map(q => ({
            text: q.text,
            section: q.section,
          }))
        }
      },
      include: {
        documents: true,
        questions: true
      }
    });
    return project as unknown as Project;
  },

  addDocument: async (projectId: string, documentData: Omit<Document, 'id' | 'uploadedAt' | 'projectId' | 'project'>): Promise<Document> => {
    const doc = await prisma.document.create({
      data: {
        ...documentData,
        projectId,
      }
    });

    // Mark project as outdated when a new document is added
    await prisma.project.update({
      where: { id: projectId },
      data: { 
        status: 'OUTDATED',
        updatedAt: new Date()
      }
    });

    return doc as unknown as Document;
  },

  updateAnswer: async (projectId: string, questionId: string, answer: Answer): Promise<void> => {
    // 1. Delete existing answer and citations if any (due to @unique questionId and Cascade)
    // Actually, we can use upsert if we want to preserve the ID, but since citations are many-to-one, 
    // it's easier to recreate or update. Prisma upsert doesn't handle nested list updates well (it appends).
    // So we'll delete the existing answer first to be safe and clean.
    await prisma.answer.deleteMany({
      where: { questionId }
    });

    await prisma.answer.create({
        data: {
            id: crypto.randomUUID(),
            questionId,
            text: answer.text,
            confidence: answer.confidence,
            status: answer.status,
            citations: {
                create: answer.citations.map(c => ({
                   documentId: c.documentId,
                   documentName: c.documentName,
                   textSnippet: c.textSnippet,
                   relevanceScore: c.relevanceScore,
                   pageNumber: c.pageNumber
                }))
            }
        }
    });

    await prisma.project.update({
        where: { id: projectId },
        data: { updatedAt: new Date() }
    });
  },

  updateDocumentContent: async (id: string, content: string, status: string): Promise<void> => {
    await prisma.document.update({
      where: { id },
      data: { content, status }
    });
  },

  addQuestions: async (projectId: string, questions: { text: string; section: string }[]): Promise<void> => {
    await prisma.question.createMany({
      data: questions.map(q => ({
        projectId,
        text: q.text,
        section: q.section,
      }))
    });
  },

  clearQuestions: async (projectId: string): Promise<void> => {
    await prisma.question.deleteMany({
      where: { projectId }
    });
  },

  updateProjectStatus: async (projectId: string, status: string): Promise<void> => {
    await prisma.project.update({
      where: { id: projectId },
      data: { status, updatedAt: new Date() }
    });
  }
};
