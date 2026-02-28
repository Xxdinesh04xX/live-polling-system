import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { Badge } from "../components/Badge";
import { ChatWidget } from "../components/ChatWidget";
import { PollQuestion } from "../components/PollQuestion";
import { PollResults } from "../components/PollResults";
import { PrimaryButton } from "../components/PrimaryButton";
import { useLivePoll } from "../hooks/useLivePoll";
import { usePollTimer } from "../hooks/usePollTimer";
import { useStudentSession } from "../hooks/useStudentSession";
import type { PollResultsOption } from "../types";

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const secs = Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0");
  return `${mins}:${secs}`;
};

export const StudentPage = () => {
  const navigate = useNavigate();
  const { studentId, name, setName, clearName } = useStudentSession();
  const [localName, setLocalName] = useState(name);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    pollState,
    latestResults,
    participants,
    chatMessages,
    kicked,
    connectionError,
    submitVote,
    sendChat,
    nameTaken,
    resetNameTaken,
  } = useLivePoll({
    role: "student",
    studentId,
    studentName: name,
  });

  useEffect(() => {
    if (connectionError) {
      toast.error("Connection lost. Trying to reconnect...");
    }
  }, [connectionError]);

  useEffect(() => {
    if (nameTaken) {
      toast.error("Name already exists. Please choose another.");
      clearName();
      setLocalName("");
      resetNameTaken();
    }
  }, [nameTaken, clearName, resetNameTaken]);

  useEffect(() => {
    if (pollState.poll?._id) {
      const key = `poll_voted_${pollState.poll._id}`;
      const stored = sessionStorage.getItem(key) === "true";
      setHasSubmitted(stored);
      setSelectedOption(null);
    }
  }, [pollState.poll?._id]);

  const { remainingSec } = usePollTimer(
    pollState.remainingMs,
    pollState.serverTime
  );

  const poll = pollState.poll;
  const results = latestResults;
  const isPollActive = poll?.status === "active" && remainingSec > 0;

  const handleSubmit = async () => {
    if (!poll || !selectedOption) {
      return;
    }
    setIsSubmitting(true);
    setHasSubmitted(true);
    sessionStorage.setItem(`poll_voted_${poll._id}`, "true");
    try {
      await submitVote({
        pollId: poll._id,
        optionId: selectedOption,
        studentId,
        studentName: name,
      });
    } catch (error) {
      sessionStorage.removeItem(`poll_voted_${poll._id}`);
      setHasSubmitted(false);
      toast.error(error instanceof Error ? error.message : "Vote failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const chatUserId = useMemo(() => studentId, [studentId]);

  const handleOpenHistory = () => {
    navigate("/student/history");
  };

  if (kicked) {
    return (
      <div className="page center">
        <Badge text="Intervue Poll" />
        <h1>You've been Kicked out !</h1>
        <p className="subtitle">
          Looks like the teacher had removed you from the poll system. Please
          Try again sometime.
        </p>
      </div>
    );
  }

  if (!name) {
    return (
      <div className="page center">
        <Badge text="Intervue Poll" />
        <h1>Let's Get Started</h1>
        <p className="subtitle">
          If you're a student, you'll be able to <strong>submit your answers</strong>
          , participate in live polls, and see how your responses compare with
          your classmates
        </p>
        <div className="form-field">
          <label htmlFor="studentName">Enter your Name</label>
          <input
            id="studentName"
            type="text"
            placeholder="Rahul Bajaj"
            value={localName}
            onChange={(event) => setLocalName(event.target.value)}
          />
        </div>
        <PrimaryButton
          label="Continue"
          onClick={() => setName(localName)}
          disabled={!localName.trim()}
        />
      </div>
    );
  }

  return (
    <div className="page student">
      <div className="page-toolbar">
        <PrimaryButton
          label="Poll History"
          variant="ghost"
          onClick={handleOpenHistory}
        />
      </div>
      {!poll ? (
        <div className="page center">
          <Badge text="Intervue Poll" />
          <div className="spinner" />
          <h2>Wait for the teacher to ask questions..</h2>
        </div>
      ) : isPollActive && !hasSubmitted ? (
        <div className="poll-section">
          <PollQuestion
            question={poll.question}
            options={poll.options}
            selectedId={selectedOption ?? undefined}
            onSelect={setSelectedOption}
            timerLabel={formatTime(remainingSec)}
            showTimer
            disabled={isSubmitting}
          />
          <PrimaryButton
            label="Submit"
            onClick={handleSubmit}
            disabled={!selectedOption || isSubmitting}
          />
        </div>
      ) : (
        <div className="poll-section">
          {results ? (
            <PollResults
              question={poll.question}
              options={results.options as PollResultsOption[]}
              showTimer
              timerLabel={formatTime(remainingSec)}
              selectedOptionId={selectedOption ?? undefined}
              showCorrectMarkers
              correctOptionIds={poll.options
                .filter((option) => option.isCorrect)
                .map((option) => option.id)}
              markMode="student"
            />
          ) : null}
          <h3 className="wait-message">
            Wait for the teacher to ask a new question..
          </h3>
        </div>
      )}

      <ChatWidget
        role="student"
        currentUserId={chatUserId}
        participants={participants}
        messages={chatMessages}
        onSendMessage={(text) =>
          sendChat(text).catch((error) => {
            toast.error(error instanceof Error ? error.message : "Message failed.");
            return Promise.reject(error);
          })
        }
      />
    </div>
  );
};
