import { useCallback, useEffect, useMemo, useState } from "react";
import { fetchLatestPoll } from "../api/polls";
import type { ChatMessage, Participant, PollResults, PollState } from "../types";
import { useSocket } from "./useSocket";

type Role = "teacher" | "student";

type UseLivePollParams = {
  role: Role;
  studentId?: string;
  studentName?: string;
};

export const useLivePoll = ({
  role,
  studentId,
  studentName,
}: UseLivePollParams) => {
  const { socket, isConnected, connectionError } = useSocket({
    role,
    studentId,
    studentName,
  });
  const [pollState, setPollState] = useState<PollState>({ poll: null });
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [kicked, setKicked] = useState(false);
  const [nameTaken, setNameTaken] = useState(false);

  useEffect(() => {
    let isMounted = true;
    fetchLatestPoll()
      .then((state) => {
        if (isMounted && state?.poll) {
          setPollState(state);
        }
      })
      .catch(() => null);
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!socket) {
      return;
    }

    const handlePollState = (state: PollState) => {
      setPollState(state);
    };
    const handlePollResults = (results: PollResults) => {
      setPollState((prev) => ({
        ...prev,
        results,
      }));
    };
    const handlePollEnded = (state: PollState) => {
      setPollState(state);
    };
    const handleParticipants = (list: Participant[]) => {
      setParticipants(list);
    };
    const handleChatHistory = (messages: ChatMessage[]) => {
      setChatMessages(messages);
    };
    const handleChatMessage = (message: ChatMessage) => {
      setChatMessages((prev) => [...prev, message]);
    };
    const handleKicked = () => {
      setKicked(true);
    };
    const handleNameTaken = () => {
      setNameTaken(true);
    };

    socket.on("poll:state", handlePollState);
    socket.on("poll:results", handlePollResults);
    socket.on("poll:ended", handlePollEnded);
    socket.on("participant:list", handleParticipants);
    socket.on("chat:history", handleChatHistory);
    socket.on("chat:message", handleChatMessage);
    socket.on("participant:kicked", handleKicked);
    socket.on("participant:name-taken", handleNameTaken);

    return () => {
      socket.off("poll:state", handlePollState);
      socket.off("poll:results", handlePollResults);
      socket.off("poll:ended", handlePollEnded);
      socket.off("participant:list", handleParticipants);
      socket.off("chat:history", handleChatHistory);
      socket.off("chat:message", handleChatMessage);
      socket.off("participant:kicked", handleKicked);
      socket.off("participant:name-taken", handleNameTaken);
    };
  }, [socket]);

  const createPoll = useCallback(
    (payload: {
      question: string;
      durationSec: number;
      options: Array<{ text: string; isCorrect?: boolean }>;
    }) =>
      new Promise<PollState>((resolve, reject) => {
        if (!socket) {
          reject(new Error("Socket not ready"));
          return;
        }
        socket.emit("poll:create", payload, (response: any) => {
          if (response?.ok) {
            setPollState(response.state);
            resolve(response.state);
          } else {
            reject(new Error(response?.message ?? "Failed to create poll."));
          }
        });
      }),
    [socket]
  );

  const submitVote = useCallback(
    (payload: {
      pollId: string;
      optionId: string;
      studentId: string;
      studentName: string;
    }) =>
      new Promise<PollResults>((resolve, reject) => {
        if (!socket) {
          reject(new Error("Socket not ready"));
          return;
        }
        socket.emit("poll:vote", payload, (response: any) => {
          if (response?.ok) {
            setPollState((prev) => ({ ...prev, results: response.results }));
            resolve(response.results);
          } else {
            reject(new Error(response?.message ?? "Failed to submit vote."));
          }
        });
      }),
    [socket]
  );

  const sendChat = useCallback(
    (text: string) =>
      new Promise<void>((resolve, reject) => {
        if (!socket) {
          reject(new Error("Socket not ready"));
          return;
        }
        socket.emit("chat:send", { text }, (response: any) => {
          if (response?.ok) {
            resolve();
          } else {
            reject(new Error("Message not sent."));
          }
        });
      }),
    [socket]
  );

  const kickParticipant = useCallback(
    (studentIdToKick: string) =>
      new Promise<void>((resolve, reject) => {
        if (!socket) {
          reject(new Error("Socket not ready"));
          return;
        }
        socket.emit(
          "participant:kick",
          { studentId: studentIdToKick },
          (response: any) => {
            if (response?.ok) {
              resolve();
            } else {
              reject(new Error("Failed to kick participant."));
            }
          }
        );
      }),
    [socket]
  );

  const latestResults = useMemo(() => pollState.results, [pollState.results]);

  return {
    pollState,
    latestResults,
    participants,
    chatMessages,
    kicked,
    nameTaken,
    isConnected,
    connectionError,
    createPoll,
    submitVote,
    sendChat,
    kickParticipant,
    resetNameTaken: () => setNameTaken(false),
  };
};
