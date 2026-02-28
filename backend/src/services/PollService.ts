import mongoose, { Types } from "mongoose";
import { v4 as uuidv4 } from "uuid";
import { Poll, PollDocument, PollOption } from "../models/Poll";
import { Vote } from "../models/Vote";
import { ServiceError } from "../utils/serviceError";
import { getRemainingMs } from "../utils/time";
import { participantService } from "./ParticipantService";

export type PollResultsOption = PollOption & {
  votes: number;
  percentage: number;
};

export type PollResults = {
  pollId: string;
  totalVotes: number;
  options: PollResultsOption[];
};

export type PollState = {
  poll: PollDocument;
  remainingMs: number;
  serverTime: number;
  results: PollResults;
};

type CreatePollInput = {
  question: string;
  options: Array<{ text: string; isCorrect?: boolean }>;
  durationSec: number;
};

class PollService {
  private pollTimer: NodeJS.Timeout | null = null;
  private onPollEnded?: (pollId: string) => void;

  async bootstrapActivePoll() {
    this.ensureDbReady();
    const poll = await Poll.findOne({ status: "active" }).sort({ startTime: -1 });
    if (!poll) {
      return;
    }
    if (poll.endTime.getTime() <= Date.now()) {
      await this.endPoll(poll._id);
      return;
    }
    this.schedulePollEnd(poll);
  }

  async createPoll(input: CreatePollInput) {
    this.ensureDbReady();
    const active = await Poll.findOne({ status: "active" }).sort({
      startTime: -1,
    });
    if (active) {
      if (active.endTime.getTime() <= Date.now()) {
        await this.endPoll(active._id);
      } else {
        throw new ServiceError(
          "ACTIVE_POLL_EXISTS",
          409,
          "An active poll is already running."
        );
      }
    }

    if (input.durationSec > 60) {
      throw new ServiceError("DURATION_TOO_LONG", 400, "Max duration is 60.");
    }

    const now = new Date();
    const pollOptions: PollOption[] = input.options.map((option) => ({
      id: uuidv4(),
      text: option.text.trim(),
      isCorrect: option.isCorrect ?? false,
    }));

    const poll = await Poll.create({
      question: input.question.trim(),
      options: pollOptions,
      durationSec: input.durationSec,
      startTime: now,
      endTime: new Date(now.getTime() + input.durationSec * 1000),
      status: "active",
    });

    this.schedulePollEnd(poll);
    return poll;
  }

  async getActivePoll() {
    this.ensureDbReady();
    const poll = await Poll.findOne({ status: "active" }).sort({ startTime: -1 });
    if (!poll) {
      return null;
    }
    if (poll.endTime.getTime() <= Date.now()) {
      await this.endPoll(poll._id);
      return null;
    }
    return poll;
  }

  async getLatestPoll() {
    this.ensureDbReady();
    return Poll.findOne({}).sort({ startTime: -1 });
  }

  async getPollHistory() {
    this.ensureDbReady();
    const polls = await Poll.find({ status: "ended" }).sort({ startTime: 1 });
    const results = await Promise.all(
      polls.map(async (poll) => ({
        poll,
        results: await this.getPollResults(poll),
      }))
    );
    return results;
  }

  async getPollState(poll: PollDocument): Promise<PollState> {
    const results = await this.getPollResults(poll);
    return {
      poll,
      remainingMs: getRemainingMs(poll.endTime),
      serverTime: Date.now(),
      results,
    };
  }

  async submitVote(params: {
    pollId: string;
    optionId: string;
    studentId: string;
    studentName: string;
  }) {
    this.ensureDbReady();
    const poll = await Poll.findById(params.pollId);
    if (!poll) {
      throw new ServiceError("POLL_NOT_FOUND", 404, "Poll not found.");
    }
    if (poll.status === "ended" || poll.endTime.getTime() <= Date.now()) {
      await this.endPoll(poll._id);
      throw new ServiceError("POLL_ENDED", 409, "Poll has ended.");
    }

    if (participantService.isKicked(params.studentId)) {
      throw new ServiceError("STUDENT_KICKED", 403, "Student was removed.");
    }

    const optionExists = poll.options.some(
      (option) => option.id === params.optionId
    );
    if (!optionExists) {
      throw new ServiceError("OPTION_NOT_FOUND", 404, "Option not found.");
    }

    try {
      await Vote.create({
        pollId: poll._id,
        optionId: params.optionId,
        studentId: params.studentId,
        studentName: params.studentName,
      });
    } catch (error) {
      const maybeMongoError = error as { code?: number };
      if (maybeMongoError.code === 11000) {
        throw new ServiceError(
          "ALREADY_VOTED",
          409,
          "Student already voted."
        );
      }
      throw error;
    }

    await this.maybeEndEarly(poll._id);
    return this.getPollResults(poll);
  }

  private async maybeEndEarly(pollId: Types.ObjectId) {
    this.ensureDbReady();
    const totalVotes = await Vote.countDocuments({ pollId });
    const participantCount = participantService.getActiveCount();
    if (participantCount > 0 && totalVotes >= participantCount) {
      await this.endPoll(pollId);
    }
  }

  async endPoll(pollId: Types.ObjectId) {
    this.ensureDbReady();
    const now = new Date();
    await Poll.updateOne(
      { _id: pollId, status: "active" },
      { $set: { status: "ended", endedAt: now, endTime: now } }
    );
    if (this.pollTimer) {
      clearTimeout(this.pollTimer);
      this.pollTimer = null;
    }
    if (this.onPollEnded) {
      this.onPollEnded(pollId.toString());
    }
  }

  registerOnPollEnded(handler: (pollId: string) => void) {
    this.onPollEnded = handler;
  }

  private schedulePollEnd(poll: PollDocument) {
    const remaining = getRemainingMs(poll.endTime);
    if (remaining <= 0) {
      void this.endPoll(poll._id);
      return;
    }
    if (this.pollTimer) {
      clearTimeout(this.pollTimer);
    }
    this.pollTimer = setTimeout(() => {
      void this.endPoll(poll._id);
    }, remaining);
  }

  private async getPollResults(poll: PollDocument): Promise<PollResults> {
    this.ensureDbReady();
    const voteCounts = await Vote.aggregate<{
      _id: string;
      count: number;
    }>([
      { $match: { pollId: poll._id } },
      { $group: { _id: "$optionId", count: { $sum: 1 } } },
    ]);

    const totalVotes = voteCounts.reduce((acc, item) => acc + item.count, 0);
    const countMap = new Map(voteCounts.map((item) => [item._id, item.count]));

    const options = poll.options.map((option) => {
      const votes = countMap.get(option.id) ?? 0;
      const percentage = totalVotes === 0 ? 0 : Math.round((votes / totalVotes) * 100);
      return {
        id: option.id,
        text: option.text,
        isCorrect: option.isCorrect,
        votes,
        percentage,
      };
    });

    return {
      pollId: poll._id.toString(),
      totalVotes,
      options,
    };
  }

  private ensureDbReady() {
    if (mongoose.connection.readyState !== 1) {
      throw new ServiceError("DB_UNAVAILABLE", 503, "Database unavailable.");
    }
  }
}

export const pollService = new PollService();
