import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export interface LLMMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export const llmService = {
  /**
   * Generate a completion using the LLM
   */
  generateCompletion: async (
    messages: LLMMessage[],
    options?: {
      model?: string;
      temperature?: number;
      maxTokens?: number;
    },
  ): Promise<string> => {
    try {
      const completion = await groq.chat.completions.create({
        model:
          options?.model || process.env.LLM_MODEL || "llama-3.3-70b-versatile",
        messages,
        temperature:
          options?.temperature ??
          parseFloat(process.env.LLM_TEMPERATURE || "0.3"),
        max_tokens:
          options?.maxTokens ?? parseInt(process.env.LLM_MAX_TOKENS || "1000"),
      });

      return completion.choices[0]?.message?.content || "";
    } catch (error: any) {
      console.error("LLM Error:", error);
      throw new Error(`LLM generation failed: ${error.message}`);
    }
  },

  /**
   * Generate answer from context using RAG pattern
   */
  generateAnswerFromContext: async (
    question: string,
    context: string,
  ): Promise<{
    answer: string;
    confidence: "high" | "medium" | "low";
  }> => {
    const systemPrompt = `You are a helpful AI assistant analyzing due diligence documents. Your task is to answer questions based ONLY on the provided context. Follow these rules:

1. If the context contains relevant information, provide a clear, concise answer
2. If the context is insufficient, say "Based on the provided documents, I cannot find sufficient information to answer this question."
3. Always cite specific information from the context
4. Be factual and precise
5. Do not make assumptions or add information not in the context`;

    const userPrompt = `Context from documents:
"""
${context}
"""

Question: ${question}

Please provide a detailed answer based on the context above.`;

    const messages: LLMMessage[] = [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ];

    const answer = await llmService.generateCompletion(messages);

    // Determine confidence based on answer content
    let confidence: "high" | "medium" | "low" = "medium";

    if (
      answer.toLowerCase().includes("cannot find") ||
      answer.toLowerCase().includes("insufficient information")
    ) {
      confidence = "low";
    } else if (answer.length > 200 && !answer.includes("unclear")) {
      confidence = "high";
    }

    return { answer, confidence };
  },
};
