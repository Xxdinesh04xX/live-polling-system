export type PollOption = {
  id: string;
  text: string;
  isCorrect?: boolean;
  votes?: number;
  percentage?: number;
};

export type Poll = {
  _id: string;
  question: string;
  options: PollOption[];
  durationSec: number;
  startTime: string;
  endTime: string;
  status: "active" | "ended";
};

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
  poll: Poll | null;
  remainingMs?: number;
  serverTime?: number;
  results?: PollResults;
};

export type Participant = {
  studentId: string;
  name: string;
  joinedAt: number;
};

export type ChatMessage = {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: "teacher" | "student";
  text: string;
  createdAt: number;
};
