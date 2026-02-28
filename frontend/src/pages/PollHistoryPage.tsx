import { useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import { useLocation, useNavigate } from "react-router-dom";
import { Badge } from "../components/Badge";
import { ChatWidget } from "../components/ChatWidget";
import { PollResults } from "../components/PollResults";
import { PrimaryButton } from "../components/PrimaryButton";
import { fetchPollHistory } from "../api/polls";
import { useLivePoll } from "../hooks/useLivePoll";
import type { Poll, PollResults as PollResultsType } from "../types";

type HistoryItem = {
  poll: Poll;
  results: PollResultsType;
};

export const PollHistoryPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const { participants, chatMessages, sendChat, kickParticipant } = useLivePoll({
    role: "teacher",
  });

  useEffect(() => {
    fetchPollHistory()
      .then((data) => {
        setHistory(data.history as HistoryItem[]);
      })
      .catch(() => {
        toast.error("Failed to load poll history.");
      })
      .finally(() => setIsLoading(false));
  }, []);

  const chatUserId = useMemo(() => "teacher", []);

  return (
    <div className="page history">
      <div className="history-header">
        <Badge text="Intervue Poll" />
        <PrimaryButton
          label="Back"
          variant="ghost"
          onClick={() =>
            navigate("/teacher", {
              state: {
                openCreate: Boolean(
                  (location.state as { openCreate?: boolean } | null)?.openCreate
                ),
              },
            })
          }
        />
      </div>
      <h1>View Poll History</h1>

      {isLoading ? (
        <p className="subtitle">Loading...</p>
      ) : history.length === 0 ? (
        <p className="subtitle">No polls yet.</p>
      ) : (
        <div className="history-list">
          {history.map((item, index) => (
            <div key={item.poll._id} className="history-item">
              <h3>Question {index + 1}</h3>
              <PollResults
                question={item.poll.question}
                options={item.results.options}
                showCorrectMarkers
                correctOptionIds={item.poll.options
                  .filter((option) => option.isCorrect)
                  .map((option) => option.id)}
              />
            </div>
          ))}
        </div>
      )}

      <ChatWidget
        role="teacher"
        currentUserId={chatUserId}
        participants={participants}
        messages={chatMessages}
        onSendMessage={(text) =>
          sendChat(text).catch((error) => {
            toast.error(error instanceof Error ? error.message : "Message failed.");
            return Promise.reject(error);
          })
        }
        onKickParticipant={(studentId) =>
          kickParticipant(studentId).catch((error) => {
            toast.error(error instanceof Error ? error.message : "Kick failed.");
            return Promise.reject(error);
          })
        }
      />
    </div>
  );
};
