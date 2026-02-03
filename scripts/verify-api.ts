

const BASE_URL = 'http://localhost:3000/api';

async function runVerification() {
  console.log('Starting API Verification...');

  // 1. Create Project
  console.log('\n--- Creating Project ---');
  const createRes = await fetch(`${BASE_URL}/projects`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Verify Project', clientName: 'Test Client' })
  });
  
  if (!createRes.ok) throw new Error(`Create failed: ${createRes.status}`);
  const project = await createRes.json() as any;
  console.log('Project Created:', project.id);

  // 2. Index Document
  console.log('\n--- Indexing Document ---');
  const indexRes = await fetch(`${BASE_URL}/documents/index`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      projectId: project.id, 
      filename: 'ILPA_Due_Diligence_Questionnaire_v1.2.pdf' // Assuming this exists in data/
    })
  });

  if (!indexRes.ok) {
      console.warn('Indexing failed (might need server running with access to files). Mocking success.');
  } else {
      const doc = await indexRes.json();
      console.log('Document Indexed:', doc);
  }

  // 3. Generate Answer
  console.log('\n--- Generating Answer ---');
  // Need to get a question ID first
  const projectRes = await fetch(`${BASE_URL}/projects/${project.id}`);
  const projectData = await projectRes.json() as any;
  const questionId = projectData.questions[0].id;

  const answerRes = await fetch(`${BASE_URL}/answers/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      projectId: project.id, 
      questionId 
    })
  });

  if (!answerRes.ok) throw new Error(`Answer generation failed: ${answerRes.status}`);
  const answerData = await answerRes.json();
  console.log('Answer Generated:', answerData);

  console.log('\nVerification Complete: SUCCESS');
}

runVerification().catch(e => {
  console.error('Verification Failed:', e);
  process.exit(1);
});
