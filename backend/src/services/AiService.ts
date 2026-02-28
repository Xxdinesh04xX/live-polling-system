import { z } from "zod";
import { ServiceError } from "../utils/serviceError";

const aiResponseSchema = z.object({
  questions: z
    .array(
      z.object({
        question: z.string().min(5),
        options: z.array(z.string().min(1)).length(4),
        correctIndex: z.number().int().min(0).max(3),
      })
    )
    .min(1),
});

const extractJson = (content: string) => {
  const trimmed = content.trim();
  if (trimmed.startsWith("```")) {
    const withoutFence = trimmed.replace(/^```[a-z]*\n?/i, "").replace(/```$/, "");
    return withoutFence.trim();
  }
  return trimmed;
};

type GenerateInput = {
  topic: string;
  difficulty: "easy" | "medium" | "hard";
  count?: number;
};

class AiService {
  async generateQuestions(input: GenerateInput) {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      throw new ServiceError(
        "GROQ_KEY_MISSING",
        500,
        "Groq API key missing."
      );
    }

    const count = Math.min(Math.max(input.count ?? 3, 1), 5);
    const model = process.env.GROQ_MODEL ?? "llama-3.1-8b-instant";

    const prompt = `You are generating multiple-choice questions.
Return ONLY valid JSON in the following format:
{"questions":[{"question":"...","options":["A","B","C","D"],"correctIndex":0}]}

Topic: ${input.topic}
Difficulty: ${input.difficulty}
Count: ${count}
Rules:
- Provide exactly 4 options per question.
- correctIndex must be 0-3.
- Keep questions concise.`;

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.5,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new ServiceError(
        "GROQ_ERROR",
        502,
        `Groq API error: ${text}`
      );
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      throw new ServiceError("GROQ_EMPTY", 502, "Groq returned empty response.");
    }

    const jsonText = extractJson(content);
    let parsed: unknown;
    try {
      parsed = JSON.parse(jsonText);
    } catch (error) {
      throw new ServiceError(
        "GROQ_PARSE_FAILED",
        502,
        "Failed to parse Groq response."
      );
    }

    const validated = aiResponseSchema.parse(parsed);
    return validated.questions;
  }
}

export const aiService = new AiService();
