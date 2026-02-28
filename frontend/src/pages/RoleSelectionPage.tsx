import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Badge } from "../components/Badge";
import { PrimaryButton } from "../components/PrimaryButton";
import { RoleCard } from "../components/RoleCard";

export const RoleSelectionPage = () => {
  const [role, setRole] = useState<"student" | "teacher">("student");
  const navigate = useNavigate();

  const handleContinue = () => {
    if (role === "student") {
      navigate("/student");
      return;
    }
    navigate("/teacher", { state: { openCreate: true } });
  };

  return (
    <div className="page center">
      <Badge text="Intervue Poll" />
      <h1>
        Welcome to the <span>Live Polling System</span>
      </h1>
      <p className="subtitle">
        Please select the role that best describes you to begin using the live
        polling system
      </p>
      <div className="role-grid">
        <RoleCard
          title="I'm a Student"
          description="Lorem Ipsum is simply dummy text of the printing and typesetting industry"
          selected={role === "student"}
          onClick={() => setRole("student")}
        />
        <RoleCard
          title="I'm a Teacher"
          description="Submit answers and view live poll results in real-time."
          selected={role === "teacher"}
          onClick={() => setRole("teacher")}
        />
      </div>
      <PrimaryButton label="Continue" onClick={handleContinue} />
    </div>
  );
};
