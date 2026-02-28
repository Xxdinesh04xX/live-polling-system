type BadgeProps = {
  text: string;
};

export const Badge = ({ text }: BadgeProps) => {
  return (
    <span className="badge">
      <span className="badge-icon" aria-hidden="true">
        <svg viewBox="0 0 16 16" focusable="false">
          <path d="M8 1l1.4 3.6L13 6l-3.6 1.4L8 11l-1.4-3.6L3 6l3.6-1.4L8 1z" />
        </svg>
      </span>
      <span className="badge-text">{text}</span>
    </span>
  );
};
