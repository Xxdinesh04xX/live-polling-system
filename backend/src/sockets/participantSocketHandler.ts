import { Server, Socket } from "socket.io";
import { participantService } from "../services/ParticipantService";

type SocketUser = {
  role: "teacher" | "student";
  studentId?: string;
  studentName?: string;
};

export const emitParticipants = (io: Server) => {
  const list = participantService.getParticipants().map((participant) => ({
    studentId: participant.studentId,
    name: participant.name,
    joinedAt: participant.joinedAt,
  }));
  io.emit("participant:list", list);
};

export const registerParticipantHandlers = (
  io: Server,
  socket: Socket,
  user: SocketUser
) => {
  if (user.role === "teacher") {
    socket.on("participant:kick", (payload, ack) => {
      const studentId = payload?.studentId as string | undefined;
      if (!studentId) {
        if (ack) {
          ack({ ok: false, error: "INVALID_STUDENT" });
        }
        return;
      }

      const participant = participantService.kickParticipant(studentId);
      if (participant) {
        io.to(participant.socketId).emit("participant:kicked");
        io.to(participant.socketId).disconnectSockets(true);
      }
      emitParticipants(io);
      if (ack) {
        ack({ ok: true });
      }
    });
  }

  socket.on("disconnect", () => {
    participantService.removeParticipantBySocket(socket.id);
    emitParticipants(io);
  });
};
