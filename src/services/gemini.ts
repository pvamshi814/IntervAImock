import { GoogleGenAI } from "@google/genai";
import { Domain, Difficulty, Question, Interview, Qualification, UserStatus } from "../types";

// Lazy initialization helper to ensure we use the latest API key
function getAI() {
  const apiKey = 
    (typeof process !== 'undefined' ? process.env.GEMINI_API_KEY : null) || 
    ((import.meta as any).env?.VITE_GEMINI_API_KEY) ||
    (typeof process !== 'undefined' ? process.env.API_KEY : null) || 
    "";

  if (!apiKey) {
    console.warn("Gemini API key is missing. Please set GEMINI_API_KEY or VITE_GEMINI_API_KEY.");
  }
  
  return new GoogleGenAI({ apiKey });
}

function getDifficultyGuidelines(difficulty: Difficulty): string {
  switch (difficulty) {
    case 'Easy':
      return `EASY DIFFICULTY RULES:
  - Ask simple, direct questions that test basic understanding.
  - Questions should be answerable in 2-3 sentences.
  - Focus on definitions, basic concepts, and "what is" style questions.
  - Avoid multi-part questions. Ask ONE thing at a time.
  - Keep questions SHORT (1-2 sentences max).
  - Example style: "What is...?", "Name the...?", "What does X do?"
  - The candidate should feel confident and comfortable answering.`;
      
    case 'Medium':
      return `MEDIUM DIFFICULTY RULES:
  - Ask standard interview-level questions that test practical knowledge.
  - Questions can require explanations or comparisons (answerable in 3-5 sentences).
  - Mix of conceptual and practical/scenario-based questions.
  - Some questions can be short ("Explain X"), others can have a small scenario.
  - Keep most questions to 1-3 sentences. Only occasionally ask longer ones.
  - Example style: "Explain the difference between...", "How would you handle...", "What are the advantages of..."`;
      
    case 'Hard':
      return `HARD DIFFICULTY RULES:
  - Ask challenging questions that test deep expertise and critical thinking.
  - Include scenario-based problems, system design, trade-off analysis.
  - Questions can be multi-layered but should still be clear.
  - Test edge cases, best practices, and real-world problem solving.
  - Keep questions concise but impactful — no unnecessary padding.
  - Example style: "Design a system that...", "You notice X happening in production. How would you debug...", "Compare the trade-offs between..."`;
  }
}

export async function generateFirstQuestion(
  domain: Domain, 
  difficulty: Difficulty,
  qualification: Qualification,
  userStatus: UserStatus
): Promise<string> {
  const ai = getAI();
  const model = "gemini-2.5-flash";
  const diffGuidelines = getDifficultyGuidelines(difficulty);
  
  const prompt = `You are a professional interviewer conducting a mock interview for the "${domain}" field.

Candidate Profile:
- Qualification: ${qualification}
- Current Status: ${userStatus}
- Difficulty Level: ${difficulty}

${diffGuidelines}

IMPORTANT RULES:
1. Ask your FIRST question now. Make it welcoming but professional.
2. The question must be relevant to the "${domain}" field and appropriate for someone with a ${qualification} background.
3. Do NOT add any greeting, introduction, or "Let's begin" — just ask the question directly.
4. Keep the question concise. ${difficulty === 'Easy' ? 'Maximum 1-2 sentences.' : difficulty === 'Medium' ? 'Maximum 2-3 sentences.' : 'Maximum 3-4 sentences.'}
5. Return ONLY the question text, nothing else.`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
    });
    return response.text?.trim() || "Could you tell me about your experience with " + domain + "?";
  } catch (error: any) {
    const isQuota = error.code === 429 || JSON.stringify(error).includes('429') || JSON.stringify(error).includes('RESOURCE_EXHAUSTED');
    if (isQuota) {
      console.error("Gemini API Quota Exceeded (429).");
    } else {
      console.error("Gemini API Error:", error);
    }
    throw error;
  }
}

export async function generateNextQuestion(
  domain: Domain,
  difficulty: Difficulty,
  qualification: Qualification,
  userStatus: UserStatus,
  history: { question: string; answer: string }[]
): Promise<string> {
  const ai = getAI();
  const model = "gemini-2.5-flash";
  const diffGuidelines = getDifficultyGuidelines(difficulty);
  const questionNumber = history.length + 1;
  
  const prompt = `You are a professional interviewer conducting a mock interview for the "${domain}" field.
This is question #${questionNumber} out of 10.

Candidate Profile:
- Qualification: ${qualification}
- Current Status: ${userStatus}
- Difficulty Level: ${difficulty}

${diffGuidelines}

Previous Q&A:
${history.map((h, i) => `Q${i+1}: ${h.question}\nA${i+1}: ${h.answer}`).join('\n\n')}

IMPORTANT RULES:
1. Ask the NEXT interview question based on the conversation so far.
2. If the candidate answered well, move to a new topic within ${domain}. If they struggled, ask a simpler follow-up.
3. Cover DIFFERENT topics — don't repeat the same subject area.
4. Keep the question ${difficulty === 'Easy' ? 'short and simple (1-2 sentences max)' : difficulty === 'Medium' ? 'moderate length (1-3 sentences)' : 'focused but can include a scenario (2-4 sentences max)'}.
5. ${questionNumber <= 5 ? 'Focus on core fundamentals of ' + domain + '.' : 'You can explore slightly advanced or practical topics now.'}
6. Vary question length — some questions should be very short ("What is X?"), others can be a bit longer.
7. Return ONLY the question text, nothing else.`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
    });
    return response.text?.trim() || "What are some other key concepts in " + domain + " that you're familiar with?";
  } catch (error: any) {
    const isQuota = error.code === 429 || JSON.stringify(error).includes('429') || JSON.stringify(error).includes('RESOURCE_EXHAUSTED');
    if (isQuota) {
      console.error("Gemini API Quota Exceeded (429).");
    } else {
      console.error("Gemini API Error:", error);
    }
    throw error;
  }
}

export async function evaluateInterview(
  domain: Domain,
  difficulty: Difficulty,
  qualification: Qualification,
  userStatus: UserStatus,
  history: { question: string; answer: string }[]
): Promise<Partial<Interview>> {
  const ai = getAI();
  const model = "gemini-2.5-flash";
  
  const prompt = `Evaluate the following mock interview comprehensively.
  
  Candidate Profile:
  - Domain: ${domain}
  - Difficulty: ${difficulty}
  - Qualification: ${qualification}
  - Status: ${userStatus}
  
  Interview Data:
  ${history.map((h, i) => `Q${i+1}: ${h.question}\nA${i+1}: ${h.answer}`).join('\n\n')}
  
  Instructions:
  1. Communication Score (0-100): Clarity, structure, confidence of answers.
  2. Technical Score (0-100): Accuracy, depth, problem-solving ability.
  3. Overall Score (0-100): Weighted average considering the ${difficulty} difficulty and ${qualification} level.
  4. Feedback:
      - Strengths: List 3-5 specific strong points.
      - Weaknesses: List 3-5 specific areas to improve.
      - Suggestions: Provide 3-5 actionable study/practice tips.
  
  Be fair but honest. If answers are mostly empty or irrelevant, scores should reflect that.
  
  You MUST return ONLY valid JSON with this exact structure (no markdown, no explanation):
  {
    "communicationScore": <number>,
    "technicalScore": <number>,
    "overallScore": <number>,
    "feedback": {
      "strengths": ["..."],
      "weaknesses": ["..."],
      "suggestions": ["..."]
    }
  }`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
    });

    const text = response.text || "{}";
    
    // Safely parse JSON structure
    let parsed: any = {};
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try { parsed = JSON.parse(jsonMatch[0]); } catch {}
    } else {
      try { parsed = JSON.parse(text); } catch {}
    }
    
    // Enforce types to prevent Firebase Schema 'Failed to Evaluate' errors
    return {
      communicationScore: Number(parsed.communicationScore) || 0,
      technicalScore: Number(parsed.technicalScore) || 0,
      overallScore: Number(parsed.overallScore) || 0,
      feedback: {
        strengths: Array.isArray(parsed.feedback?.strengths) ? parsed.feedback.strengths : ["Good effort in completing the mock interview."],
        weaknesses: Array.isArray(parsed.feedback?.weaknesses) ? parsed.feedback.weaknesses : ["Required more technical depth in several topics."],
        suggestions: Array.isArray(parsed.feedback?.suggestions) ? parsed.feedback.suggestions : ["Review the core fundamentals of this domain.", "Practice expressing technical concepts more clearly."],
      }
    };
  } catch (error: any) {
    const isQuota = error.code === 429 || JSON.stringify(error).includes('429') || JSON.stringify(error).includes('RESOURCE_EXHAUSTED');
    if (isQuota) {
      console.error("Gemini API Quota Exceeded (429).");
    } else {
      console.error("Gemini API Error:", error);
    }
    throw error;
  }
}
