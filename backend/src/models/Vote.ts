import { Schema, model, Types } from "mongoose";

export type VoteDocument = {
  _id: Types.ObjectId;
  pollId: Types.ObjectId;
  optionId: string;
  studentId: string;
  studentName: string;
  createdAt: Date;
  updatedAt: Date;
};

const voteSchema = new Schema<VoteDocument>(
  {
    pollId: { type: Schema.Types.ObjectId, ref: "Poll", required: true },
    optionId: { type: String, required: true },
    studentId: { type: String, required: true },
    studentName: { type: String, required: true },
  },
  { timestamps: true }
);

voteSchema.index({ pollId: 1, studentId: 1 }, { unique: true });

export const Vote = model<VoteDocument>("Vote", voteSchema);
