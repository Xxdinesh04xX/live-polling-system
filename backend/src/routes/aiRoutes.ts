import { Router } from "express";
import { aiController } from "../controllers/aiController";

export const aiRoutes = Router();

aiRoutes.post("/questions", aiController.generateQuestions);
