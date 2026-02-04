import { chatService } from '../src/services/chatService';
import { prisma } from '../src/lib/db';

console.log('Testing Chat Service...\n');

async function testChat() {
  try {
    // Find a project with documents
    const project = await prisma.project.findFirst({
      include: { documents: true },
    });

    if (!project) {
      console.log('❌ No projects found. Please create a project first.');
      return;
    }

    console.log(`✓ Found project: ${project.name}`);
    console.log(`  Documents: ${project.documents.length}\n`);

    // Test 1: Create a chat session
    console.log('Test 1: Creating chat session...');
    const session = await chatService.createSession(project.id, 'Test Chat');
    console.log(`✓ Session created: ${session.id}`);
    console.log(`  Title: ${session.title}\n`);

    // Test 2: Send a message
    if (project.documents.length > 0) {
      console.log('Test 2: Sending message...');
      const result = await chatService.sendMessage(
        session.id,
        'What is this document about?'
      );
      console.log(`✓ User message: ${result.userMsg.content}`);
      console.log(`✓ AI response: ${result.assistantMsg.content.substring(0, 100)}...`);
      console.log(`  Confidence: ${result.assistantMsg.confidence}`);
      console.log(`  Citations: ${result.assistantMsg.citations.length}\n`);
    } else {
      console.log('⚠ Skipping message test - no documents indexed\n');
    }

    // Test 3: Get all sessions
    console.log('Test 3: Fetching all sessions...');
    const sessions = await chatService.getSessions(project.id);
    console.log(`✓ Found ${sessions.length} session(s)`);
    sessions.forEach(s => {
      console.log(`  - ${s.title}: ${s.messages.length} messages`);
    });
    console.log();

    // Test 4: Delete session
    console.log('Test 4: Deleting session...');
    await chatService.deleteSession(session.id);
    console.log(`✓ Session deleted\n`);

    console.log('✅ All tests passed!');
  } catch (error: any) {
    console.error('❌ Test failed:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

testChat();
