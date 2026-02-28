import type { ButtonHTMLAttributes } from "react";

type PrimaryButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string;
  variant?: "primary" | "ghost";
};

export const PrimaryButton = ({
  label,
  variant = "primary",
  ...props
}: PrimaryButtonProps) => {
  return (
    <button className={`primary-button ${variant}`} {...props}>
      {label}
    </button>
  );
};
