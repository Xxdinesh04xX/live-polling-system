export type ChatMessage = {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: "teacher" | "student";
  text: string;
  createdAt: number;
};

class ChatService {
  private messages: ChatMessage[] = [];
  private maxMessages = 200;

  addMessage(message: ChatMessage) {
    this.messages.push(message);
    if (this.messages.length > this.maxMessages) {
      this.messages.shift();
    }
  }

  getMessages() {
    return [...this.messages];
  }
}

export const chatService = new ChatService();
