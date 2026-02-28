import type { PollOption } from "../types";

type PollQuestionProps = {
  question: string;
  options: PollOption[];
  selectedId?: string;
  onSelect: (optionId: string) => void;
  disabled?: boolean;
  showTimer?: boolean;
  timerLabel?: string;
};

export const PollQuestion = ({
  question,
  options,
  selectedId,
  onSelect,
  disabled,
  showTimer,
  timerLabel,
}: PollQuestionProps) => {
  return (
    <div className="poll-card">
      <div className="poll-header">
        <span>Question</span>
        {showTimer ? <span className="timer-pill">{timerLabel}</span> : null}
      </div>
      <div className="poll-question">{question}</div>
      <div className="poll-options">
        {options.map((option, index) => (
          <button
            key={option.id}
            type="button"
            className={`poll-option ${selectedId === option.id ? "active" : ""}`}
            onClick={() => onSelect(option.id)}
            disabled={disabled}
          >
            <span className="option-index">{index + 1}</span>
            <span>{option.text}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
