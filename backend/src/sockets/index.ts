import { Server } from "socket.io";
import { pollService } from "../services/PollService";
import { participantService } from "../services/ParticipantService";
import { registerChatHandlers } from "./chatSocketHandler";
import { registerParticipantHandlers, emitParticipants } from "./participantSocketHandler";
import { registerPollHandlers } from "./pollSocketHandler";

type SocketUser = {
  role: "teacher" | "student";
  studentId?: string;
  studentName?: string;
};

export const registerSocketHandlers = (io: Server) => {
  pollService.registerOnPollEnded(async (pollId) => {
    try {
      const poll = await pollService.getLatestPoll();
      if (!poll || poll._id.toString() !== pollId) {
        return;
      }
      const state = await pollService.getPollState(poll);
      io.emit("poll:ended", state);
      io.emit("poll:results", state.results);
    } catch (error) {
      console.error("Poll end handler failed:", error);
    }
  });

  io.on("connection", async (socket) => {
    const roleRaw = socket.handshake.query.role;
    const role: SocketUser["role"] =
      roleRaw === "teacher" ? "teacher" : "student";
    const studentId = socket.handshake.query.studentId?.toString();
    const studentName = socket.handshake.query.studentName?.toString();

    const user: SocketUser = {
      role,
      studentId,
      studentName,
    };

    if (role === "student") {
      if (!studentId || !studentName) {
        socket.disconnect();
        return;
      }
      if (participantService.isKicked(studentId)) {
        socket.emit("participant:kicked");
        socket.disconnect();
        return;
      }
      if (participantService.isNameTaken(studentName, studentId)) {
        socket.emit("participant:name-taken");
        socket.disconnect();
        return;
      }
      participantService.addParticipant(studentId, studentName, socket.id);
    }

    emitParticipants(io);

    registerPollHandlers(io, socket);
    registerChatHandlers(io, socket, user);
    registerParticipantHandlers(io, socket, user);

    try {
      const latestPoll = await pollService.getLatestPoll();
      if (latestPoll) {
        const state = await pollService.getPollState(latestPoll);
        socket.emit("poll:state", state);
      } else {
        socket.emit("poll:state", { poll: null });
      }
    } catch (error) {
      console.error("Initial poll state failed:", error);
      socket.emit("poll:state", { poll: null });
    }
  });
};
