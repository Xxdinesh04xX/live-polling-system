import { Request, Response } from "express";
import { z } from "zod";
import { pollService } from "../services/PollService";
import { ServiceError } from "../utils/serviceError";

const createPollSchema = z.object({
  question: z.string().min(5),
  durationSec: z.number().min(10).max(60),
  options: z
    .array(
      z.object({
        text: z.string().min(1),
        isCorrect: z.boolean().optional(),
      })
    )
    .min(2),
});

const submitVoteSchema = z.object({
  pollId: z.string().min(1),
  optionId: z.string().min(1),
  studentId: z.string().min(1),
  studentName: z.string().min(1),
});

const handleError = (error: unknown, res: Response) => {
  if (error instanceof ServiceError) {
    return res.status(error.status).json({ error: error.code, message: error.message });
  }
  console.error("Poll controller error:", error);
  return res.status(500).json({ error: "SERVER_ERROR", message: "Something went wrong." });
};

export const pollController = {
  async createPoll(req: Request, res: Response) {
    try {
      const payload = createPollSchema.parse(req.body);
      const poll = await pollService.createPoll(payload);
      const state = await pollService.getPollState(poll);
      return res.status(201).json(state);
    } catch (error) {
      return handleError(error, res);
    }
  },

  async getActivePoll(req: Request, res: Response) {
    try {
      const poll = await pollService.getActivePoll();
      if (!poll) {
        return res.status(200).json({ poll: null });
      }
      const state = await pollService.getPollState(poll);
      return res.status(200).json(state);
    } catch (error) {
      return handleError(error, res);
    }
  },

  async getLatestPoll(req: Request, res: Response) {
    try {
      const poll = await pollService.getLatestPoll();
      if (!poll) {
        return res.status(200).json({ poll: null });
      }
      const state = await pollService.getPollState(poll);
      return res.status(200).json(state);
    } catch (error) {
      return handleError(error, res);
    }
  },

  async getHistory(req: Request, res: Response) {
    try {
      const history = await pollService.getPollHistory();
      return res.status(200).json({ history });
    } catch (error) {
      return handleError(error, res);
    }
  },

  async submitVote(req: Request, res: Response) {
    try {
      const payload = submitVoteSchema.parse({
        ...req.body,
        pollId: req.params.pollId ?? req.body.pollId,
      });
      const results = await pollService.submitVote(payload);
      return res.status(200).json({ results });
    } catch (error) {
      return handleError(error, res);
    }
  },
};
