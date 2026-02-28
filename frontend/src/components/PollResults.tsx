import type { PollResultsOption } from "../types";

type PollResultsProps = {
  question: string;
  options: PollResultsOption[];
  showTimer?: boolean;
  timerLabel?: string;
  showCorrectMarkers?: boolean;
  correctOptionIds?: string[];
  selectedOptionId?: string;
  markMode?: "all" | "selected" | "student";
};

export const PollResults = ({
  question,
  options,
  showTimer,
  timerLabel,
  showCorrectMarkers,
  correctOptionIds,
  selectedOptionId,
  markMode = "all",
}: PollResultsProps) => {
  const hasCorrect = Boolean(correctOptionIds?.length);
  return (
    <div className="poll-card">
      <div className="poll-header">
        <span>Question</span>
        {showTimer ? <span className="timer-pill">{timerLabel}</span> : null}
      </div>
      <div className="poll-question">{question}</div>
      <div className="result-list">
        {options.map((option, index) => {
          const isCorrect = correctOptionIds?.includes(option.id) ?? false;
          const isSelected = selectedOptionId === option.id;
          const shouldMark =
            showCorrectMarkers &&
            hasCorrect &&
            (markMode === "all"
              ? true
              : markMode === "selected"
                ? isSelected
                : isCorrect || isSelected);
          const isWrongSelected = isSelected && !isCorrect;
          return (
          <div
            key={option.id}
            className={`result-row ${isSelected ? "selected" : ""}`}
          >
            <div className="result-bar">
              <div
                className="result-fill"
                style={{ width: `${option.percentage}%` }}
              />
              <div className="result-content">
                <span className="option-index">{index + 1}</span>
                <span className="result-text">{option.text}</span>
                {shouldMark ? (
                  <span
                    className={`result-mark ${
                      isCorrect ? "good" : isWrongSelected ? "bad" : ""
                    }`}
                  >
                    {isCorrect ? "✓" : isWrongSelected ? "✗" : ""}
                  </span>
                ) : null}
              </div>
            </div>
            <span className="result-percent">{option.percentage}%</span>
          </div>
        );
        })}
      </div>
    </div>
  );
};
