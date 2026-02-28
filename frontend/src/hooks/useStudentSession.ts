import { useCallback, useMemo, useState } from "react";

const STUDENT_ID_KEY = "live_poll_student_id";
const STUDENT_NAME_KEY = "live_poll_student_name";

const getSessionValue = (key: string) => {
  if (typeof window === "undefined") {
    return "";
  }
  return sessionStorage.getItem(key) ?? "";
};

export const useStudentSession = () => {
  const [name, setNameState] = useState(() => getSessionValue(STUDENT_NAME_KEY));
  const studentId = useMemo(() => {
    const existing = getSessionValue(STUDENT_ID_KEY);
    if (existing) {
      return existing;
    }
    const generated = crypto.randomUUID();
    sessionStorage.setItem(STUDENT_ID_KEY, generated);
    return generated;
  }, []);

  const setName = useCallback((nextName: string) => {
    const trimmed = nextName.trim();
    sessionStorage.setItem(STUDENT_NAME_KEY, trimmed);
    setNameState(trimmed);
  }, []);

  const clearName = useCallback(() => {
    sessionStorage.removeItem(STUDENT_NAME_KEY);
    setNameState("");
  }, []);

  const clearSession = useCallback(() => {
    sessionStorage.removeItem(STUDENT_NAME_KEY);
    sessionStorage.removeItem(STUDENT_ID_KEY);
    setNameState("");
  }, []);

  return { studentId, name, setName, clearName, clearSession };
};
