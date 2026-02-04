import { evaluationService } from '../src/services/evaluationService';

console.log('Testing Evaluation Service...\n');

// Test 1: Identical texts
const test1 = evaluationService.evaluateAnswer(
  'The company was founded in 2020.',
  'The company was founded in 2020.'
);
console.log('Test 1 - Identical texts:');
console.log(`Score: ${test1.score}%`);
console.log(`Explanation: ${test1.explanation}\n`);

// Test 2: Similar texts
const test2 = evaluationService.evaluateAnswer(
  'Based on the analysis of provided documents, relevant information was found: "The company was established in 2020 and has grown significantly..."',
  'The company was founded in 2020.'
);
console.log('Test 2 - Similar texts:');
console.log(`Score: ${test2.score}%`);
console.log(`Explanation: ${test2.explanation}\n`);

// Test 3: Different texts
const test3 = evaluationService.evaluateAnswer(
  'The product is available in three colors: red, blue, and green.',
  'The company was founded in 2020.'
);
console.log('Test 3 - Different texts:');
console.log(`Score: ${test3.score}%`);
console.log(`Explanation: ${test3.explanation}\n`);

// Test 4: Missing data
const test4 = evaluationService.evaluateAnswer(
  'Based on the analysis of provided documents, relevant information was found...',
  ''
);
console.log('Test 4 - Missing human text:');
console.log(`Score: ${test4.score}%`);
console.log(`Explanation: ${test4.explanation}\n`);

console.log('All tests completed successfully!');
