import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { Badge } from "../components/Badge";
import { PollResults } from "../components/PollResults";
import { PrimaryButton } from "../components/PrimaryButton";
import { fetchPollHistory } from "../api/polls";
import type { Poll, PollResults as PollResultsType } from "../types";
import { downloadPollHistoryPdf } from "../utils/pdf";

type HistoryItem = {
  poll: Poll;
  results: PollResultsType;
};

export const StudentHistoryPage = () => {
  const navigate = useNavigate();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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

  const handleDownload = () => {
    if (!history.length) {
      toast.error("No poll history available.");
      return;
    }
    downloadPollHistoryPdf(history);
  };

  return (
    <div className="page history">
      <div className="history-header">
        <Badge text="Intervue Poll" />
        <PrimaryButton label="Back" variant="ghost" onClick={() => navigate("/student")} />
      </div>
      <h1>Poll History</h1>

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

      <div className="history-footer">
        <PrimaryButton label="Download PDF" onClick={handleDownload} />
      </div>
    </div>
  );
};
