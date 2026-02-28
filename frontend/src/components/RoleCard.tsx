type RoleCardProps = {
  title: string;
  description: string;
  selected?: boolean;
  onClick: () => void;
};

export const RoleCard = ({
  title,
  description,
  selected,
  onClick,
}: RoleCardProps) => {
  return (
    <button
      type="button"
      className={`role-card ${selected ? "selected" : ""}`}
      onClick={onClick}
    >
      <h3>{title}</h3>
      <p>{description}</p>
    </button>
  );
};
