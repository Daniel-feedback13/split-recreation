"use client";

import { useEffect, useMemo, useState } from "react";
import getSocket from "./socketClient";
import type { RoomState } from "@/shared/model/socket";

export default function useRoomSocket(roomId: string) {
  const socket = useMemo(() => getSocket(), []);
  const [state, setState] = useState<RoomState | null>(null);
  const [lastEvent, setLastEvent] = useState<string>("");

  useEffect(() => {
    const onState = (nextState: RoomState) => setState(nextState);
    const onEffect = (payload: { type: string; message?: string }) =>
      setLastEvent(payload.message || payload.type);
    const onBuzzer = (payload: { nickname: string }) =>
      setLastEvent(`${payload.nickname} 버저`);
    const onAnswer = (payload: { nickname: string; answer: string }) =>
      setLastEvent(`${payload.nickname}: ${payload.answer}`);

    socket.on("room:state", onState);
    socket.on("screen:effect", onEffect);
    socket.on("buzzer:accepted", onBuzzer);
    socket.on("answer:received", onAnswer);

    return () => {
      socket.off("room:state", onState);
      socket.off("screen:effect", onEffect);
      socket.off("buzzer:accepted", onBuzzer);
      socket.off("answer:received", onAnswer);
    };
  }, [socket, roomId]);

  return { socket, state, lastEvent };
}
