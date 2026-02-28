import { Schema, model, Types } from "mongoose";

export type PollOption = {
  id: string;
  text: string;
  isCorrect?: boolean;
};

export type PollStatus = "active" | "ended";

export type PollDocument = {
  _id: Types.ObjectId;
  question: string;
  options: PollOption[];
  durationSec: number;
  startTime: Date;
  endTime: Date;
  status: PollStatus;
  endedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
};

const pollOptionSchema = new Schema<PollOption>(
  {
    id: { type: String, required: true },
    text: { type: String, required: true },
    isCorrect: { type: Boolean, default: false },
  },
  { _id: false }
);

const pollSchema = new Schema<PollDocument>(
  {
    question: { type: String, required: true, trim: true },
    options: { type: [pollOptionSchema], required: true },
    durationSec: { type: Number, required: true },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    status: { type: String, enum: ["active", "ended"], default: "active" },
    endedAt: { type: Date },
  },
  { timestamps: true }
);

export const Poll = model<PollDocument>("Poll", pollSchema);
