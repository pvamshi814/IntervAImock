import { GoogleGenAI, Type } from "@google/genai";
import { Domain, Difficulty, Question, Interview, Qualification, UserStatus } from "../types";

// Lazy initialization helper to ensure we use the latest API key
function getAI() {
  // Check multiple sources for the API key
  const apiKey = 
    (typeof process !== 'undefined' ? process.env.GEMINI_API_KEY : null) || 
    ((import.meta as any).env?.VITE_GEMINI_API_KEY) ||
    (typeof process !== 'undefined' ? process.env.API_KEY : null) || 
    "";

  if (!apiKey) {
    console.warn("Gemini API key is missing. Please set GEMINI_API_KEY or VITE_GEMINI_API_KEY.");
  } else {
    // Masked log for debugging (e.g., "AI Key detected: AIza...4Xy")
    const masked = apiKey.length > 8 
      ? `${apiKey.substring(0, 4)}...${apiKey.substring(apiKey.length - 4)}`
      : "***";
    console.log(`Gemini API initialized with key: ${masked}`);
  }
  
  return new GoogleGenAI({ apiKey });
}

export async function generateFirstQuestion(
  domain: Domain, 
  difficulty: Difficulty,
  qualification: Qualification,
  userStatus: UserStatus
): Promise<string> {
  const ai = getAI();
  const model = "gemini-3-flash-preview";
  const prompt = `You are a world-class technical interviewer. You are interviewing a candidate for a ${domain} role.
  
  Candidate Profile:
  - Qualification: ${qualification}
  - Current Status: ${userStatus}
  - Target Difficulty: ${difficulty}
  
  Instructions:
  1. Start the interview with a high-quality, relevant technical question.
  2. The question should be appropriate for someone with a ${qualification} background and their status as a ${userStatus}.
  3. Be professional, encouraging, and concise.
  4. Return ONLY the question text. Do not include any introductory remarks like "Hello" or "Let's start".`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
    });
    return response.text?.trim() || "Could you tell me about your experience with " + domain + "?";
  } catch (error: any) {
    const isQuota = error.code === 429 || JSON.stringify(error).includes('429') || JSON.stringify(error).includes('RESOURCE_EXHAUSTED');
    if (isQuota) {
      console.error("Gemini API Quota Exceeded (429). This is a limit on the shared API key. Please set your own API key in the app settings to continue.");
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
  const model = "gemini-3-flash-preview";
  const prompt = `You are a world-class technical interviewer for a ${domain} role.
  
  Candidate Profile:
  - Qualification: ${qualification}
  - Current Status: ${userStatus}
  - Target Difficulty: ${difficulty}
  
  Interview History:
  ${JSON.stringify(history, null, 2)}
  
  Instructions:
  1. Based on the previous answers, ask the next high-quality technical question.
  2. You can follow up on a previous answer to dig deeper or move to a new relevant topic within ${domain}.
  3. Ensure the question is challenging but fair given the ${difficulty} level and ${qualification} background.
  4. Be professional and concise.
  5. Return ONLY the question text.`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
    });
    return response.text?.trim() || "What are some other key concepts in " + domain + " that you're familiar with?";
  } catch (error: any) {
    const isQuota = error.code === 429 || JSON.stringify(error).includes('429') || JSON.stringify(error).includes('RESOURCE_EXHAUSTED');
    if (isQuota) {
      console.error("Gemini API Quota Exceeded (429). This is a limit on the shared API key. Please set your own API key in the app settings to continue.");
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
  const model = "gemini-3-flash-preview";
  
  const prompt = `Evaluate the following technical mock interview.
  
  Candidate Profile:
  - Domain: ${domain}
  - Difficulty: ${difficulty}
  - Qualification: ${qualification}
  - Status: ${userStatus}
  
  Interview Data (Questions and Answers):
  ${JSON.stringify(history, null, 2)}
  
  Instructions:
  1. Provide a detailed, professional evaluation of the candidate's performance.
  2. Communication Score (0-100): Evaluate clarity, confidence, and structure of explanations.
  3. Technical Score (0-100): Evaluate accuracy, depth of knowledge, and problem-solving approach.
  4. Overall Score (0-100): A weighted average based on the role and difficulty.
  5. Feedback:
      - Strengths: List 3-5 specific areas where the candidate performed well.
      - Weaknesses: List 3-5 specific areas where the candidate needs improvement.
      - Suggestions: Provide actionable advice for further study or practice.
  
  Return the response as a JSON object matching the requested schema. Ensure the feedback is constructive and professional.`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            communicationScore: { type: Type.NUMBER },
            technicalScore: { type: Type.NUMBER },
            overallScore: { type: Type.NUMBER },
            feedback: {
              type: Type.OBJECT,
              properties: {
                strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
                weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
                suggestions: { type: Type.ARRAY, items: { type: Type.STRING } },
              },
              required: ["strengths", "weaknesses", "suggestions"],
            },
          },
          required: ["communicationScore", "technicalScore", "overallScore", "feedback"],
        },
      },
    });

    return JSON.parse(response.text || "{}");
  } catch (error: any) {
    const isQuota = error.code === 429 || JSON.stringify(error).includes('429') || JSON.stringify(error).includes('RESOURCE_EXHAUSTED');
    if (isQuota) {
      console.error("Gemini API Quota Exceeded (429). This is a limit on the shared API key. Please set your own API key in the app settings to continue.");
    } else {
      console.error("Gemini API Error:", error);
    }
    throw error;
  }
}
