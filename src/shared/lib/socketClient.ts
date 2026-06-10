"use client";

import { io, Socket } from "socket.io-client";
import type { ClientToServerEvents, ServerToClientEvents } from "@/shared/model/socket";

let socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;

export default function getSocket(): Socket<ServerToClientEvents, ClientToServerEvents> {
  if (!socket) {
    socket = io({ path: "/socket.io", transports: ["websocket", "polling"] });
  }

  return socket;
}
