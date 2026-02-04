# Groq LLM Integration Setup Guide

## Quick Start (5 minutes)

### Step 1: Get Your Free Groq API Key

1. Visit **https://console.groq.com**
2. Click "Sign Up" (or "Sign In" if you have an account)
3. Complete the registration
4. Navigate to **API Keys** section in the left sidebar
5. Click **"Create API Key"**
6. Give it a name (e.g., "DueDiligence App")
7. **Copy the API key** (starts with `gsk_...`)

### Step 2: Add API Key to Your Project

1. Open `.env.local` file in your project root
2. Replace `your_groq_api_key_here` with your actual API key:
   ```env
   GROQ_API_KEY=gsk_your_actual_key_here
   ```
3. Save the file

### Step 3: Restart the Development Server

```bash
# Stop the current server (Ctrl+C)
# Then restart:
npm run dev
```

### Step 4: Test the Integration

1. Open your browser to http://localhost:3000
2. Navigate to any project
3. Go to the "Questions" tab
4. Click "Generate Answer" on any question
5. You should now see **detailed, intelligent answers** instead of short keyword matches!

---

## What Changed?

### Before (Keyword Matching)
```
Q: What is the company's revenue?
A: Based on the analysis of provided documents, relevant information was found: "DDQ's comment period..."
Confidence: high
```

### After (LLM-Powered)
```
Q: What is the company's revenue?
A: According to the financial documents provided, the company's annual revenue for fiscal year 2023 was $45.2 million, representing a 23% increase from the previous year. The revenue breakdown shows: Product sales: $32.1M, Service contracts: $10.5M, and Licensing: $2.6M.
Confidence: high
```

---

## Groq Free Tier Limits

- **Requests per minute**: 30
- **Requests per day**: 14,400
- **Tokens per minute**: 6,000

This is more than enough for development and small-scale production use!

---

## Troubleshooting

### Error: "LLM generation failed: Invalid API Key"
- Make sure you copied the full API key from Groq console
- Ensure there are no extra spaces in `.env.local`
- Restart your dev server after adding the key

### Error: "Rate limit exceeded"
- You've hit the free tier limit (30 requests/minute)
- Wait a minute and try again
- Consider implementing request queuing for high-volume usage

### Answers are still short/irrelevant
- Check that `.env.local` has the correct API key
- Verify the server restarted after adding the key
- Check the browser console for any errors

---

## Alternative: Use Ollama (Completely Free, Local)

If you prefer not to use an API key, you can run LLMs locally:

### Install Ollama

```bash
# macOS
brew install ollama

# Start Ollama
ollama serve

# Pull Llama 3.1 model
ollama pull llama3.1
```

### Update `src/lib/llm.ts`

Replace the Groq implementation with:

```typescript
export const llmService = {
  generateCompletion: async (messages: LLMMessage[], options?) => {
    const response = await fetch('http://localhost:11434/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama3.1',
        messages,
        stream: false,
      }),
    });
    
    const data = await response.json();
    return data.message.content;
  },
  
  // Keep generateAnswerFromContext the same
};
```

---

## Model Options

You can change the model in `.env.local`:

```env
# Fast and efficient (default)
LLM_MODEL=llama-3.1-70b-versatile

# Even faster, slightly lower quality
LLM_MODEL=llama-3.1-8b-instant

# Best for complex reasoning
LLM_MODEL=mixtral-8x7b-32768
```

---

## Next Steps

1. **Get your API key** from https://console.groq.com
2. **Add it to `.env.local`**
3. **Restart the server**
4. **Test with real questions!**

Enjoy your dramatically improved answer quality! 🚀
