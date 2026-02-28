import { Server, Socket } from "socket.io";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";
import { chatService } from "../services/ChatService";

const chatSchema = z.object({
  text: z.string().min(1).max(300),
});

type SocketUser = {
  role: "teacher" | "student";
  studentId?: string;
  studentName?: string;
};

export const registerChatHandlers = (
  io: Server,
  socket: Socket,
  user: SocketUser
) => {
  socket.emit("chat:history", chatService.getMessages());

  socket.on("chat:send", (payload, ack) => {
    try {
      const data = chatSchema.parse(payload);
      const senderId = user.studentId ?? socket.id;
      const senderName = user.studentName ?? "Teacher";
      const message = {
        id: uuidv4(),
        senderId,
        senderName,
        senderRole: user.role,
        text: data.text.trim(),
        createdAt: Date.now(),
      };
      chatService.addMessage(message);
      io.emit("chat:message", message);
      if (ack) {
        ack({ ok: true });
      }
    } catch (error) {
      if (ack) {
        ack({ ok: false, error: "INVALID_MESSAGE" });
      }
    }
  });
};
