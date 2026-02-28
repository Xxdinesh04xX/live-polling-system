import { apiFetch } from "./client";
import type { Poll, PollResults, PollState } from "../types";

export const fetchActivePoll = () =>
  apiFetch<PollState>("/api/polls/active");

export const fetchLatestPoll = () =>
  apiFetch<PollState>("/api/polls/latest");

export const fetchPollHistory = () =>
  apiFetch<{ history: Array<{ poll: Poll; results: PollResults }> }>(
    "/api/polls/history"
  );
