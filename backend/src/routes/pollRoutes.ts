import { Router } from "express";
import { pollController } from "../controllers/pollController";

export const pollRoutes = Router();

pollRoutes.get("/active", pollController.getActivePoll);
pollRoutes.get("/latest", pollController.getLatestPoll);
pollRoutes.get("/history", pollController.getHistory);
pollRoutes.post("/", pollController.createPoll);
pollRoutes.post("/:pollId/vote", pollController.submitVote);
