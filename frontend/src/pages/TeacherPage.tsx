import { useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import { useLocation, useNavigate } from "react-router-dom";
import { Badge } from "../components/Badge";
import { ChatWidget } from "../components/ChatWidget";
import { PollResults } from "../components/PollResults";
import { PrimaryButton } from "../components/PrimaryButton";
import { generateAiQuestions, type AiQuestion } from "../api/ai";
import { useLivePoll } from "../hooks/useLivePoll";
import type { PollResultsOption } from "../types";

const durationOptions = [60, 45, 30];

export const TeacherPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const forceCreate = Boolean(
    (location.state as { openCreate?: boolean } | null)?.openCreate
  );
  const [forceCreateOnce, setForceCreateOnce] = useState(forceCreate);
  const draftKey = "teacher_poll_draft";
  const [question, setQuestion] = useState("");
  const [duration, setDuration] = useState(60);
  const [options, setOptions] = useState([
    { text: "", isCorrect: true },
    { text: "", isCorrect: false },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createMode, setCreateMode] = useState(true);
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [aiTopic, setAiTopic] = useState("");
  const [aiDifficulty, setAiDifficulty] = useState<"easy" | "medium" | "hard">(
    "easy"
  );
  const [aiQuestions, setAiQuestions] = useState<AiQuestion[]>([]);
  const [isAiLoading, setIsAiLoading] = useState(false);

  const {
    pollState,
    latestResults,
    participants,
    chatMessages,
    connectionError,
    createPoll,
    sendChat,
    kickParticipant,
  } = useLivePoll({ role: "teacher" });

  useEffect(() => {
    if (connectionError) {
      toast.error("Connection lost. Trying to reconnect...");
    }
  }, [connectionError]);

  useEffect(() => {
    if (forceCreate) {
      setForceCreateOnce(true);
      setCreateMode(true);
      navigate("/teacher", { replace: true, state: {} });
    }
  }, [forceCreate, navigate]);

  useEffect(() => {
    if (forceCreateOnce) {
      setCreateMode(true);
      return;
    }
    if (pollState.poll) {
      setCreateMode(false);
      return;
    }
    setCreateMode(true);
  }, [pollState.poll, forceCreateOnce]);

  useEffect(() => {
    if (!createMode) {
      return;
    }
    const raw = sessionStorage.getItem(draftKey);
    if (!raw) {
      return;
    }
    try {
      const draft = JSON.parse(raw) as {
        question?: string;
        duration?: number;
        options?: Array<{ text: string; isCorrect?: boolean }>;
      };
      if (draft.question != null) {
        setQuestion(draft.question);
      }
      if (draft.duration != null) {
        setDuration(draft.duration);
      }
      if (draft.options && draft.options.length >= 2) {
        setOptions(
          draft.options.map((option, index) => ({
            text: option.text ?? "",
            isCorrect:
              typeof option.isCorrect === "boolean"
                ? option.isCorrect
                : index === 0,
          }))
        );
      }
    } catch {
      sessionStorage.removeItem(draftKey);
    }
  }, [createMode, draftKey]);

  useEffect(() => {
    if (!createMode) {
      return;
    }
    const payload = JSON.stringify({
      question,
      duration,
      options,
    });
    sessionStorage.setItem(draftKey, payload);
  }, [question, duration, options, createMode, draftKey]);

  const allAnswered =
    (participants.length > 0 &&
      latestResults &&
      latestResults.totalVotes >= participants.length) ||
    false;
  const canAskNewQuestion = pollState.poll
    ? pollState.poll.status !== "active" || allAnswered
    : true;

  const handleOptionChange = (index: number, value: string) => {
    setOptions((prev) =>
      prev.map((option, idx) =>
        idx === index ? { ...option, text: value } : option
      )
    );
  };

  const handleCorrectChange = (index: number, isCorrect: boolean) => {
    setOptions((prev) =>
      prev.map((option, idx) =>
        idx === index ? { ...option, isCorrect } : option
      )
    );
  };

  const handleAddOption = () => {
    if (options.length >= 4) {
      return;
    }
    setOptions((prev) => [...prev, { text: "", isCorrect: false }]);
  };

  const handleAskQuestion = async () => {
    if (!question.trim() || options.some((option) => !option.text.trim())) {
      toast.error("Please enter question and options.");
      return;
    }
    setIsSubmitting(true);
    try {
      await createPoll({
        question,
        durationSec: duration,
        options,
      });
      sessionStorage.removeItem(draftKey);
      setQuestion("");
      setOptions([
        { text: "", isCorrect: true },
        { text: "", isCorrect: false },
      ]);
      setForceCreateOnce(false);
      setCreateMode(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create poll.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGenerateAi = async () => {
    const trimmedTopic = aiTopic.trim();
    if (!trimmedTopic) {
      toast.error("Please enter a topic.");
      return;
    }
    if (trimmedTopic.length < 3) {
      toast.error("Topic must be at least 3 characters.");
      return;
    }
    setIsAiLoading(true);
    try {
      const data = await generateAiQuestions({
        topic: trimmedTopic,
        difficulty: aiDifficulty,
      });
      setAiQuestions(data.questions);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "AI generation failed.");
    } finally {
      setIsAiLoading(false);
    }
  };

  const openAiModal = () => {
    setAiTopic("");
    setAiDifficulty("easy");
    setAiQuestions([]);
    setIsAiOpen(true);
  };

  const closeAiModal = () => {
    setIsAiOpen(false);
  };

  const handleUseAiQuestion = (item: AiQuestion) => {
    setQuestion(item.question);
    setOptions(
      item.options.map((text, index) => ({
        text,
        isCorrect: index === item.correctIndex,
      }))
    );
    closeAiModal();
  };

  const chatUserId = useMemo(() => "teacher", []);

  return (
    <div className="page teacher">
      {createMode ? (
        <div className="teacher-form">
          <div className="teacher-topbar">
            <Badge text="Intervue Poll" />
            <PrimaryButton
              label="View Poll history"
              variant="ghost"
              onClick={() => navigate("/teacher/history", { state: { openCreate: true } })}
            />
          </div>
          <h1>Let's Get Started</h1>
          <p className="subtitle">
            you'll have the ability to create and manage polls, ask questions,
            and monitor your students' responses in real-time.
          </p>

          <div className="form-field">
            <div className="question-header">
              <label>Enter your question</label>
              <div className="question-actions">
                <button
                  type="button"
                  className="ask-ai-button"
                  onClick={openAiModal}
                >
                  Ask AI
                </button>
                <select
                  value={duration}
                  onChange={(event) => setDuration(Number(event.target.value))}
                >
                  {durationOptions.map((option) => (
                    <option key={option} value={option}>
                      {option} seconds
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="question-body">
              <textarea
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                placeholder="Rahul Bajaj"
                maxLength={100}
              />
              <span className="char-count">{question.length}/100</span>
            </div>
          </div>

          <div className="option-editor">
            <div className="option-column">
              <label>Edit Options</label>
              {options.map((option, index) => (
                <div key={`option-${index}`} className="option-row">
                  <span className="option-index">{index + 1}</span>
                  <input
                    value={option.text}
                    onChange={(event) =>
                      handleOptionChange(index, event.target.value)
                    }
                    placeholder="Rahul Bajaj"
                  />
                </div>
              ))}
              <button type="button" className="add-option" onClick={handleAddOption}>
                + Add More option
              </button>
            </div>

            <div className="correct-column">
              <label>Is it Correct?</label>
              {options.map((option, index) => (
                <div key={`correct-${index}`} className="correct-row">
                  <label>
                    <input
                      type="radio"
                      name={`correct-${index}`}
                      checked={option.isCorrect === true}
                      onChange={() => handleCorrectChange(index, true)}
                    />
                    Yes
                  </label>
                  <label>
                    <input
                      type="radio"
                      name={`correct-${index}`}
                      checked={option.isCorrect === false}
                      onChange={() => handleCorrectChange(index, false)}
                    />
                    No
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div className="teacher-actions">
            <PrimaryButton
              label="Ask Question"
              onClick={handleAskQuestion}
              disabled={isSubmitting}
            />
          </div>

          {isAiOpen ? (
            <div className="ai-modal">
              <div className="ai-card">
                <h3>Ask AI</h3>
                <div className="ai-field">
                  <label>Topic</label>
                  <input
                    value={aiTopic}
                    onChange={(event) => setAiTopic(event.target.value)}
                    placeholder="e.g., Operating Systems"
                  />
                </div>
                <div className="ai-field">
                  <label>Difficulty</label>
                  <select
                    value={aiDifficulty}
                    onChange={(event) =>
                      setAiDifficulty(event.target.value as "easy" | "medium" | "hard")
                    }
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
                <div className="ai-actions">
                  <button
                    type="button"
                    className="ask-ai-button"
                    onClick={handleGenerateAi}
                    disabled={isAiLoading}
                  >
                    {isAiLoading ? "Generating..." : "Generate"}
                  </button>
                  <button
                    type="button"
                    className="ask-ai-button ghost"
                    onClick={closeAiModal}
                  >
                    Cancel
                  </button>
                </div>
                <div className="ai-results">
                  {aiQuestions.map((item, index) => (
                    <div key={`${item.question}-${index}`} className="ai-result-card">
                      <h4>{item.question}</h4>
                      <ul>
                        {item.options.map((opt, optIndex) => (
                          <li key={`${opt}-${optIndex}`}>{opt}</li>
                        ))}
                      </ul>
                      <button
                        type="button"
                        className="ask-ai-button"
                        onClick={() => handleUseAiQuestion(item)}
                      >
                        Use this
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      ) : pollState.poll ? (
        <div className="poll-section">
          <div className="teacher-toolbar">
            <PrimaryButton
              label="View Poll history"
              variant="ghost"
              onClick={() => navigate("/teacher/history")}
            />
          </div>
          {latestResults ? (
            <PollResults
              question={pollState.poll.question}
              options={latestResults.options as PollResultsOption[]}
            />
          ) : null}
          <PrimaryButton
            label="Ask a new question"
            onClick={() => setCreateMode(true)}
            disabled={!canAskNewQuestion}
          />
        </div>
      ) : null}

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
