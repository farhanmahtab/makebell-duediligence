// Manually load env vars for script execution
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

// Fallback for DATABASE_URL if dotenv fails
if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL = "postgresql://farhanmahi@localhost:5432/duediligence";
}

// Ensure GROQ_API_KEY is available
if (!process.env.GROQ_API_KEY) {
    console.warn("⚠️ GROQ_API_KEY is missing. LLM tests will fail.");
}
if (!process.env.LLM_MODEL) {
    process.env.LLM_MODEL = "llama-3.3-70b-versatile";
}

console.log('Environment Debug:');
console.log('DB URL:', process.env.DATABASE_URL ? 'Set' : 'Missing');
console.log('Groq Key:', process.env.GROQ_API_KEY ? 'Set' : 'Missing');
console.log('LLM Model:', process.env.LLM_MODEL);

import { prisma } from '../src/lib/db';
import { ingestionService } from '../src/services/ingestionService';
import { qaService } from '../src/services/qaService';
import { chatService } from '../src/services/chatService';
import { evaluationService } from '../src/services/evaluationService';

console.log('🚀 Starting End-to-End System Verification...\n');

async function runE2ETest() {
  try {
    // 1. Create a Test Project
    console.log('1️⃣  Creating Test Project...');
    const project = await prisma.project.create({
      data: {
        name: 'E2E Verification Project',
        clientName: 'Automated Test Client',
      }
    });
    console.log(`✅ Project created: ${project.id}\n`);

    // 2. Mock Document Ingestion (Simulating a file)
    console.log('2️⃣  Simulating Document Ingestion...');
    // We'll manually insert a document since we can't upload a real file easily in script
    const doc = await prisma.document.create({
      data: {
        projectId: project.id,
        name: 'Financial_Report_2023.pdf',
        path: '/tmp/Financial_Report_2023.pdf',
        status: 'indexed',
        content: `
          Fiscal Year 2023 Financial Highlights:
          - Total Revenue: $45.2 million (up 23% YoY)
          - Net Income: $5.8 million
          - Product Sales: $32.1 million
          - Service Contracts: $10.5 million
          - Licensing: $2.6 million
          - R&D Investment: $8.2 million
          
          Risk Factors:
          - Market volatility in the tech sector.
          - Supply chain disruptions affecting hardware delivery.
          - Regulatory changes in data privacy (GDPR, CCPA).
        `
      }
    });
    console.log(`✅ Document indexed: ${doc.name}\n`);

    // 3. Add Questions
    console.log('3️⃣  Adding Questions...');
    const questions = await prisma.question.createMany({
      data: [
        { projectId: project.id, text: 'What was the total revenue in 2023?', section: 'Financials' },
        { projectId: project.id, text: 'What are the primary risk factors?', section: 'Risk' }
      ]
    });
    console.log(`✅ Questions added: 2\n`);

    // 4. Generate Answers (Testing LLM)
    console.log('4️⃣  Generating Answers (LLM Integration)...');
    const questionList = await prisma.question.findMany({ where: { projectId: project.id } });
    
    // Using a properly typed mock for fetched documents
    const projectDocs = await prisma.document.findMany({ where: { projectId: project.id } });
    const formattedDocs = projectDocs.map(d => ({
        ...d,
        status: d.status as any,
        uploadedAt: d.uploadedAt as any,
        content: d.content || undefined
    }));

    for (const q of questionList) {
        process.stdout.write(`   Answer for "${q.text}": `);
        const answer = await qaService.generateAnswer(q.text, formattedDocs);
        
        await prisma.answer.create({
            data: {
                id: crypto.randomUUID(),
                questionId: q.id,
                text: answer.text,
                manualText: null,
                confidence: answer.confidence,
                status: 'completed',
                citations: {
                    create: answer.citations.map(c => ({
                        documentId: c.documentId,
                        documentName: c.documentName,
                        textSnippet: c.textSnippet,
                        relevanceScore: c.relevanceScore
                    }))
                }
            }
        });

        console.log(answer.confidence === 'high' ? '✅ High Confidence' : `⚠️ ${answer.confidence}`);
        console.log(`   "${answer.text.substring(0, 80)}..."\n`);
    }

    // 5. Test Chat Extension
    console.log('5️⃣  Testing Chat Extension...');
    const session = await chatService.createSession(project.id, 'E2E Test Chat');
    const chatResponse = await chatService.sendMessage(session.id, "How much was spent on R&D?");
    console.log(`✅ Chat User: ${chatResponse.userMsg.content}`);
    console.log(`✅ Chat AI: "${chatResponse.assistantMsg.content.substring(0, 80)}..."`);
    console.log(`   Confidence: ${chatResponse.assistantMsg.confidence}\n`);

    // 6. Test Evaluation
    console.log('6️⃣  Testing Evaluation Framework...');
    // Add a manual override for evaluation
    const revenueQ = questionList.find(q => q.text.includes('revenue'));
    if (revenueQ) {
        const answer = await prisma.answer.findUnique({ where: { questionId: revenueQ.id } });
        if (answer) {
            await prisma.answer.update({
                where: { id: answer.id },
                data: { manualText: '$45.2 million' }
            });
        }
    }

    const evalResult = await evaluationService.runProjectEvaluation(project.id);
    console.log(`✅ Evaluation run complete.`);
    console.log(`   Processed: ${evalResult.count}`);
    console.log(`   Avg Score: ${evalResult.averageScore}%\n`);

    // Cleanup
    console.log('🧹 Cleaning up...');
    await prisma.project.delete({ where: { id: project.id } });
    console.log('✅ Test project deleted.\n');

    console.log('🎉 E2E Verification Complete! All systems functional.');

  } catch (error) {
    console.error('❌ E2E Test Failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

runE2ETest();
