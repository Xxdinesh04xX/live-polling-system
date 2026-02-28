import { useEffect, useMemo, useState } from "react";
import { io, Socket } from "socket.io-client";

type UseSocketParams = {
  role: "teacher" | "student";
  studentId?: string;
  studentName?: string;
};

export const useSocket = ({ role, studentId, studentName }: UseSocketParams) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  const socketUrl = useMemo(
    () => import.meta.env.VITE_SOCKET_URL ?? "http://localhost:4000",
    []
  );

  const shouldConnect =
    role === "teacher" || (Boolean(studentId) && Boolean(studentName));

  useEffect(() => {
    if (!shouldConnect) {
      return;
    }
    const nextSocket = io(socketUrl, {
      transports: ["websocket"],
      query: {
        role,
        studentId,
        studentName,
      },
    });

    setSocket(nextSocket);

    nextSocket.on("connect", () => {
      setIsConnected(true);
      setConnectionError(null);
    });

    nextSocket.on("disconnect", () => {
      setIsConnected(false);
    });

    nextSocket.on("connect_error", (error) => {
      setConnectionError(error.message ?? "Connection error");
    });

    return () => {
      nextSocket.disconnect();
    };
  }, [role, studentId, studentName, socketUrl, shouldConnect]);

  return { socket, isConnected, connectionError };
};
