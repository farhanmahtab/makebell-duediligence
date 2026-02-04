import { prisma } from '@/lib/db';

export const evaluationService = {
  /**
   * Compares AI text with human ground truth and returns a score (0-100)
   * and a qualitative explanation.
   */
  evaluateAnswer: (aiText: string, humanText: string): { score: number; explanation: string } => {
    if (!aiText || !humanText) {
      return { score: 0, explanation: 'Missing AI or human text for comparison.' };
    }

    const aiWords = new Set(aiText.toLowerCase().split(/\s+/).filter(w => w.length > 3));
    const humanWords = new Set(humanText.toLowerCase().split(/\s+/).filter(w => w.length > 3));

    if (humanWords.size === 0) {
        return { score: 50, explanation: 'Human override too short for meaningful comparison.' };
    }

    // 1. Keyword Overlap (Jaccard similarity-ish)
    let matches = 0;
    humanWords.forEach(word => {
      if (aiWords.has(word)) matches++;
    });

    const overlapScore = (matches / humanWords.size) * 100;

    // 2. Length comparison
    const lengthRatio = Math.min(aiText.length, humanText.length) / Math.max(aiText.length, humanText.length);
    const lengthScore = lengthRatio * 100;

    // Weighted score
    const finalScore = Math.round((overlapScore * 0.7) + (lengthScore * 0.3));

    // 3. Explanation generation
    let explanation = '';
    if (finalScore > 80) {
      explanation = 'High alignment. The AI correctly identified key information consistent with the human override.';
    } else if (finalScore > 50) {
      explanation = 'Partial alignment. The AI captured some relevant keywords but differed in detail or framing.';
    } else {
      explanation = 'Low alignment. Significant differences between the AI-generated answer and the human override.';
    }

    if (aiWords.size > humanWords.size * 2) {
        explanation += ' AI result was notably wordier than ground truth.';
    }

    return { score: finalScore, explanation };
  },

  /**
   * Runs evaluation for all questions in a project that have manual overrides.
   */
  runProjectEvaluation: async (projectId: string): Promise<{ count: number; averageScore: number }> => {
    const answers = await prisma.answer.findMany({
      where: {
        question: { projectId },
        manualText: { not: null }
      }
    });

    let totalScore = 0;
    let count = 0;

    for (const answer of answers) {
      if (!answer.manualText) continue;

      const { score, explanation } = evaluationService.evaluateAnswer(answer.text, answer.manualText);
      
      await prisma.answer.update({
        where: { id: answer.id },
        data: {
          evalScore: score,
          evalExplanation: explanation
        }
      });

      totalScore += score;
      count++;
    }

    const averageScore = count > 0 ? totalScore / count : 0;
    
    // Optionally update project record with some metadata if needed
    // For now we'll just return the results

    return { count, averageScore };
  }
};
