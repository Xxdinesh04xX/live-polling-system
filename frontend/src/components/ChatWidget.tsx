import { useState } from "react";
import type { ChatMessage, Participant } from "../types";

type ChatWidgetProps = {
  role: "teacher" | "student";
  currentUserId: string;
  participants: Participant[];
  messages: ChatMessage[];
  onSendMessage: (text: string) => Promise<void>;
  onKickParticipant?: (studentId: string) => Promise<void>;
};

export const ChatWidget = ({
  role,
  currentUserId,
  participants,
  messages,
  onSendMessage,
  onKickParticipant,
}: ChatWidgetProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [tab, setTab] = useState<"chat" | "participants">("chat");
  const [text, setText] = useState("");
  const [isSending, setIsSending] = useState(false);

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed) {
      return;
    }
    setIsSending(true);
    try {
      await onSendMessage(trimmed);
      setText("");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <>
      {isOpen ? (
        <div className="chat-panel">
          <div className="chat-tabs">
            <button
              type="button"
              className={tab === "chat" ? "active" : ""}
              onClick={() => setTab("chat")}
            >
              Chat
            </button>
            <button
              type="button"
              className={tab === "participants" ? "active" : ""}
              onClick={() => setTab("participants")}
            >
              Participants
            </button>
          </div>
          {tab === "chat" ? (
            <>
              <div className="chat-messages">
                {messages.map((message) => {
                  const isSelf =
                    message.senderId === currentUserId ||
                    (role === "teacher" && message.senderRole === "teacher");
                  return (
                  <div
                    key={message.id}
                    className={`chat-message ${isSelf ? "self" : ""}`}
                  >
                    <span className="chat-name">{message.senderName}</span>
                    <div className="chat-bubble">{message.text}</div>
                  </div>
                );
                })}
              </div>
              <div className="chat-input">
                <input
                  type="text"
                  value={text}
                  onChange={(event) => setText(event.target.value)}
                  placeholder="Type your message..."
                />
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={isSending}
                >
                  Send
                </button>
              </div>
            </>
          ) : (
            <div className="participant-list">
              <div className="participant-header">
                <span>Name</span>
                {role === "teacher" ? <span>Action</span> : null}
              </div>
              {participants.map((participant) => (
                <div key={participant.studentId} className="participant-row">
                  <span>{participant.name}</span>
                  {role === "teacher" ? (
                    <button
                      type="button"
                      className="kick-button"
                      onClick={() => {
                        const ok = window.confirm(
                          `Kick out ${participant.name}?`
                        );
                        if (ok) {
                          onKickParticipant?.(participant.studentId);
                        }
                      }}
                    >
                      Kick out
                    </button>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>
      ) : null}
      <button
        type="button"
        className="chat-toggle"
        onClick={() => setIsOpen((prev) => !prev)}
      >
        💬
      </button>
    </>
  );
};
