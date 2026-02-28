import { useEffect, useState } from "react";

export const usePollTimer = (
  remainingMs?: number,
  serverTime?: number
) => {
  const [remaining, setRemaining] = useState(remainingMs ?? 0);

  useEffect(() => {
    if (remainingMs == null || serverTime == null) {
      setRemaining(0);
      return;
    }

    const offset = serverTime - Date.now();
    const endAt = Date.now() + remainingMs + offset;

    const tick = () => {
      const next = Math.max(0, endAt - Date.now());
      setRemaining(next);
    };

    tick();
    const interval = setInterval(tick, 250);
    return () => clearInterval(interval);
  }, [remainingMs, serverTime]);

  return {
    remainingMs: remaining,
    remainingSec: Math.ceil(remaining / 1000),
  };
};
