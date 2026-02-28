import { Server, Socket } from "socket.io";
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

const voteSchema = z.object({
  pollId: z.string().min(1),
  optionId: z.string().min(1),
  studentId: z.string().min(1),
  studentName: z.string().min(1),
});

const respondError = (error: unknown) => {
  if (error instanceof ServiceError) {
    return { ok: false, error: error.code, message: error.message };
  }
  return { ok: false, error: "SERVER_ERROR", message: "Something went wrong." };
};

export const registerPollHandlers = (io: Server, socket: Socket) => {
  socket.on("poll:create", async (payload, ack) => {
    try {
      const data = createPollSchema.parse(payload);
      const poll = await pollService.createPoll(data);
      const state = await pollService.getPollState(poll);
      io.emit("poll:state", state);
      if (ack) {
        ack({ ok: true, state });
      }
    } catch (error) {
      if (ack) {
        ack(respondError(error));
      }
    }
  });

  socket.on("poll:vote", async (payload, ack) => {
    try {
      const data = voteSchema.parse(payload);
      const results = await pollService.submitVote(data);
      io.emit("poll:results", results);
      if (ack) {
        ack({ ok: true, results });
      }
    } catch (error) {
      if (ack) {
        ack(respondError(error));
      }
    }
  });
};
