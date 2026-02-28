import { Request, Response } from "express";
import { z } from "zod";
import { aiService } from "../services/AiService";
import { ServiceError } from "../utils/serviceError";

const generateSchema = z.object({
  topic: z.string().min(3),
  difficulty: z.enum(["easy", "medium", "hard"]),
});

const handleError = (error: unknown, res: Response) => {
  if (error instanceof ServiceError) {
    return res.status(error.status).json({ error: error.code, message: error.message });
  }
  if (error instanceof z.ZodError) {
    const topicIssue = error.issues.find((issue) => issue.path[0] === "topic");
    const message =
      topicIssue?.code === "too_small"
        ? "Topic must be at least 3 characters."
        : "Invalid request.";
    return res.status(400).json({ error: "VALIDATION_ERROR", message });
  }
  console.error("AI controller error:", error);
  if (error instanceof Error) {
    return res.status(500).json({ error: "SERVER_ERROR", message: error.message });
  }
  return res.status(500).json({ error: "SERVER_ERROR", message: "Something went wrong." });
};

export const aiController = {
  async generateQuestions(req: Request, res: Response) {
    try {
      const payload = generateSchema.parse(req.body);
      const questions = await aiService.generateQuestions(payload);
      return res.status(200).json({ questions });
    } catch (error) {
      return handleError(error, res);
    }
  },
};
