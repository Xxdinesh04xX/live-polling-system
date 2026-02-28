import { apiFetch } from "./client";

export type AiQuestion = {
  question: string;
  options: string[];
  correctIndex: number;
};

export const generateAiQuestions = (payload: {
  topic: string;
  difficulty: "easy" | "medium" | "hard";
}) =>
  apiFetch<{ questions: AiQuestion[] }>("/api/ai/questions", {
    method: "POST",
    body: JSON.stringify(payload),
  });
