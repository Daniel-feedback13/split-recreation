import { createServer } from "node:http";
import { createServer as createNetServer } from "node:net";
import next from "next";
import { Server } from "socket.io";
import type { ClientToServerEvents, ServerToClientEvents } from "../src/types/socket";
import {
  acceptSpeedQuizBuzzer,
  adjustScore,
  getOrCreateRoom,
  incrementBuzzerBattleCount,
  joinParticipant,
  markDisconnected,
  resetBuzzer,
  submitSurveyAnswer,
  toRoomState,
  updateRoom,
} from "./roomStore";

const dev = process.env.NODE_ENV !== "production";
const hostname = process.env.HOST || "0.0.0.0";
const preferredPort = Number(process.env.PORT || 3000);
const battleTimers = new Map<string, NodeJS.Timeout>();

function clearBattleTimer(roomId: string) {
  const timer = battleTimers.get(roomId);
  if (timer) {
    clearTimeout(timer);
    battleTimers.delete(roomId);
  }
}

function findAvailablePort(startPort: number, host: string): Promise<number> {
  const tryPort = (port: number): Promise<number> =>
    new Promise((resolve, reject) => {
      const tester = createNetServer();

      tester.once("error", (error: NodeJS.ErrnoException) => {
        tester.close();
        if (error.code === "EADDRINUSE") {
          resolve(tryPort(port + 1));
          return;
        }

        reject(error);
      });

      tester.once("listening", () => {
        tester.close(() => resolve(port));
      });

      tester.listen(port, host);
    });

  return tryPort(startPort);
}

void findAvailablePort(preferredPort, hostname).then((port) => {
  const app = next({ dev, hostname, port });
  const handler = app.getRequestHandler();

  return app.prepare().then(() => {
    const httpServer = createServer(handler);
    const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
      path: "/socket.io",
      cors: { origin: "*" },
    });

    const emitRoomState = (roomId: string) => {
      const state = toRoomState(getOrCreateRoom(roomId));
      io.to(roomId).emit("room:state", state);
    };

    const scheduleBattleEnd = (roomId: string, endsAt?: number) => {
      clearBattleTimer(roomId);
      if (!endsAt) return;

      const timeoutMs = Math.max(endsAt - Date.now(), 0);
      const timer = setTimeout(() => {
        updateRoom(roomId, {
          buzzerBattle: {
            active: false,
          },
        });
        battleTimers.delete(roomId);
        emitRoomState(roomId);
      }, timeoutMs);

      battleTimers.set(roomId, timer);
    };

    io.on("connection", (socket) => {
      let currentParticipantId: string | undefined;
      let joinedRooms: string[] = [];

      socket.on("host:join", (payload, ack) => {
        socket.join(payload.roomId);
        joinedRooms = Array.from(new Set([...joinedRooms, payload.roomId]));
        const state = toRoomState(getOrCreateRoom(payload.roomId));
        ack?.(state);
        emitRoomState(payload.roomId);
      });

      socket.on("host:command", (payload) => {
        socket.join(payload.roomId);
        joinedRooms = Array.from(new Set([...joinedRooms, payload.roomId]));
        const room = updateRoom(payload.roomId, {
          phase: payload.phase,
          screen: payload.screen,
          mode: payload.mode,
          message: payload.message,
          showParticipantOverlay: payload.showParticipantOverlay,
          teams: payload.teams,
          buzzerBattle: payload.buzzerBattle,
          teamSurvey: payload.teamSurvey,
          speedQuiz: payload.speedQuiz,
        });

        if (payload.buzzerBattle?.active) {
          scheduleBattleEnd(payload.roomId, room.buzzerBattle.endsAt);
        }
        if (payload.buzzerBattle?.active === false) {
          clearBattleTimer(payload.roomId);
        }

        emitRoomState(payload.roomId);

        if (payload.message) {
          io.to(payload.roomId).emit("screen:effect", {
            type: "flash",
            message: payload.message,
          });
        }
      });

      socket.on("host:reset-buzzer", ({ roomId }) => {
        resetBuzzer(roomId);
        emitRoomState(roomId);
      });

      socket.on("host:score-adjust", ({ roomId, participantId, delta }) => {
        const participant = adjustScore(roomId, participantId, delta);
        if (!participant) {
          socket.emit("room:error", "참가자를 찾을 수 없습니다.");
          return;
        }

        emitRoomState(roomId);
      });

      socket.on("player:join", (payload, ack) => {
        socket.join(payload.roomId);
        joinedRooms = Array.from(new Set([...joinedRooms, payload.roomId]));
        const participant = joinParticipant(
          payload.roomId,
          payload.nickname,
          payload.participantId,
        );
        currentParticipantId = participant.id;
        const state = toRoomState(getOrCreateRoom(payload.roomId));
        ack?.({ participant, state });
        io.to(payload.roomId).emit(
          payload.participantId ? "player:rejoined" : "player:joined",
          participant,
        );
        emitRoomState(payload.roomId);
      });

      socket.on("player:buzzer", ({ roomId, participantId }) => {
        const room = getOrCreateRoom(roomId);

        if (room.mode === "buzzerBattle") {
          const participant = incrementBuzzerBattleCount(roomId, participantId);
          if (!participant) return;
          emitRoomState(roomId);
          return;
        }

        if (room.mode === "speedQuiz") {
          const participant = acceptSpeedQuizBuzzer(roomId, participantId);
          if (!participant) return;
          io.to(roomId).emit("buzzer:accepted", {
            participantId,
            nickname: participant.nickname,
            at: Date.now(),
          });
          io.to(roomId).emit("screen:effect", {
            type: "shake",
            message: `${participant.nickname} 버저!`,
          });
          emitRoomState(roomId);
        }
      });

      socket.on("player:answer-submit", ({ roomId, participantId, answer }) => {
        const room = getOrCreateRoom(roomId);

        if (room.mode === "teamSurvey") {
          const participant = submitSurveyAnswer(roomId, participantId, answer);
          if (!participant) {
            socket.emit("room:error", "답안을 제출할 수 없는 상태입니다.");
            return;
          }

          io.to(roomId).emit("answer:received", {
            participantId,
            nickname: participant.nickname,
            answer,
            at: Date.now(),
          });
          emitRoomState(roomId);
          return;
        }

        const participant = room.participants.get(participantId);
        if (!participant) {
          socket.emit("room:error", "참가자 정보가 없습니다. 다시 입장해주세요.");
          return;
        }

        io.to(roomId).emit("answer:received", {
          participantId,
          nickname: participant.nickname,
          answer,
          at: Date.now(),
        });
      });

      socket.on("disconnect", () => {
        if (!currentParticipantId) return;
        markDisconnected(currentParticipantId);
        for (const roomId of joinedRooms) {
          emitRoomState(roomId);
        }
      });
    });

    httpServer.listen(port, hostname, () => {
      const localUrl = `http://localhost:${port}`;
      const networkUrl = `http://${hostname}:${port}`;
      console.log(`Ready on ${localUrl}`);
      console.log(`Network access on ${networkUrl}`);
    });
  });
});
