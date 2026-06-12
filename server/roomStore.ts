import { randomUUID } from "node:crypto";
import teamSurveyQuestions from "../src/entities/teamSurvey/model/questions";
import type {
  GameMode,
  Participant,
  RoomPhase,
  RoomState,
  ScreenRoute,
  TeamConfig,
} from "../src/shared/model/socket";

interface RoomRecord {
  roomId: string;
  phase: RoomPhase;
  screen: ScreenRoute;
  mode: GameMode;
  participants: Map<string, Participant>;
  showParticipantOverlay: boolean;
  showTeamScoreOverlay: boolean;
  randomPickup?: RoomState["randomPickup"];
  teams: TeamConfig[];
  buzzerBattle: RoomState["buzzerBattle"];
  teamSurvey: RoomState["teamSurvey"];
  speedQuiz: RoomState["speedQuiz"];
  timingGame?: RoomState["timingGame"];
  activeParticipantId?: string;
  message?: string;
  updatedAt: number;
}

interface RoomPatch {
  phase?: RoomPhase;
  screen?: ScreenRoute;
  mode?: GameMode;
  message?: string;
  showParticipantOverlay?: boolean;
  showTeamScoreOverlay?: boolean;
  randomPickup?: Partial<RoomState["randomPickup"]>;
  teams?: TeamConfig[];
  buzzerBattle?: Partial<RoomState["buzzerBattle"]>;
  teamSurvey?: Partial<RoomState["teamSurvey"]>;
  speedQuiz?: Partial<RoomState["speedQuiz"]>;
  timingGame?: Partial<RoomState["timingGame"]>;
}

const rooms = new Map<string, RoomRecord>();

function createDefaultTimingGame(): RoomState["timingGame"] {
  return {
    targetOrder: 1,
    active: false,
    resultVisible: false,
    clicks: [],
  };
}

function createDefaultRandomPickup(): RoomState["randomPickup"] {
  return {
    open: false,
    revealNames: false,
    participantIds: [],
    selectedParticipantId: undefined,
  };
}

function ensureRoomDefaults(
  room: RoomRecord,
): RoomRecord & {
  timingGame: RoomState["timingGame"];
  randomPickup: RoomState["randomPickup"];
} {
  room.showTeamScoreOverlay ??= false;
  room.timingGame ??= createDefaultTimingGame();
  room.randomPickup ??= createDefaultRandomPickup();
  room.buzzerBattle = {
    ...room.buzzerBattle,
    level: room.buzzerBattle.level ?? 1,
  };

  return room as RoomRecord & {
    timingGame: RoomState["timingGame"];
    randomPickup: RoomState["randomPickup"];
  };
}

function createRoom(roomId: string): RoomRecord {
  const room: RoomRecord = {
    roomId,
    phase: "lobby",
    screen: "lobby",
    mode: "idle",
    participants: new Map(),
    showParticipantOverlay: false,
    showTeamScoreOverlay: false,
    randomPickup: createDefaultRandomPickup(),
    teams: [],
    buzzerBattle: {
      level: 1,
      durationSeconds: 10,
      active: false,
      resultVisible: false,
      counts: {},
    },
    teamSurvey: {
      questionIndex: 0,
      question: teamSurveyQuestions[0] ?? "",
      active: false,
      revealAnswers: false,
      submissions: {},
    },
    speedQuiz: {
      question: "",
      buzzerActive: false,
    },
    timingGame: createDefaultTimingGame(),
    updatedAt: Date.now(),
  };
  rooms.set(roomId, room);
  return room;
}

export function getOrCreateRoom(
  roomId: string,
): RoomRecord & {
  timingGame: RoomState["timingGame"];
  randomPickup: RoomState["randomPickup"];
} {
  const room = rooms.get(roomId) ?? createRoom(roomId);
  return ensureRoomDefaults(room);
}

export function toRoomState(room: RoomRecord): RoomState {
  const safeRoom = ensureRoomDefaults(room);

  return {
    roomId: safeRoom.roomId,
    phase: safeRoom.phase,
    screen: safeRoom.screen,
    mode: safeRoom.mode,
    participants: Array.from(safeRoom.participants.values()).sort(
      (a, b) => a.joinedAt - b.joinedAt,
    ),
    showParticipantOverlay: safeRoom.showParticipantOverlay,
    showTeamScoreOverlay: safeRoom.showTeamScoreOverlay,
    randomPickup: safeRoom.randomPickup,
    teams: safeRoom.teams,
    buzzerBattle: safeRoom.buzzerBattle,
    teamSurvey: safeRoom.teamSurvey,
    speedQuiz: safeRoom.speedQuiz,
    timingGame: safeRoom.timingGame,
    activeParticipantId: safeRoom.activeParticipantId,
    message: safeRoom.message,
    updatedAt: safeRoom.updatedAt,
  };
}

export function joinParticipant(
  roomId: string,
  nickname: string,
  participantId?: string,
): Participant {
  const room = getOrCreateRoom(roomId);
  const now = Date.now();
  const id = participantId || randomUUID();
  const existing = room.participants.get(id);

  if (existing) {
    const participant = { ...existing, nickname, connected: true, lastSeenAt: now };
    room.participants.set(id, participant);
    room.updatedAt = now;
    return participant;
  }

  const participant: Participant = {
    id,
    nickname,
    connected: true,
    score: 0,
    joinedAt: now,
    lastSeenAt: now,
  };
  room.participants.set(id, participant);
  room.updatedAt = now;
  return participant;
}

export function markDisconnected(participantId: string): void {
  for (const room of rooms.values()) {
    const participant = room.participants.get(participantId);
    if (!participant) continue;
    room.participants.set(participantId, {
      ...participant,
      connected: false,
      lastSeenAt: Date.now(),
    });
    room.updatedAt = Date.now();
  }
}

export function updateRoom(roomId: string, patch: RoomPatch): RoomRecord {
  const room = getOrCreateRoom(roomId);
  room.phase = patch.phase ?? room.phase;
  room.screen = patch.screen ?? room.screen;
  room.mode = patch.mode ?? room.mode;
  room.message = patch.message ?? room.message;
  room.showParticipantOverlay =
    patch.showParticipantOverlay ?? room.showParticipantOverlay;
  room.showTeamScoreOverlay = patch.showTeamScoreOverlay ?? room.showTeamScoreOverlay;
  room.randomPickup = {
    ...createDefaultRandomPickup(),
    ...room.randomPickup,
    ...patch.randomPickup,
  };
  room.teams = patch.teams ?? room.teams;
  room.buzzerBattle = { ...room.buzzerBattle, ...patch.buzzerBattle };
  room.teamSurvey = { ...room.teamSurvey, ...patch.teamSurvey };
  room.speedQuiz = { ...room.speedQuiz, ...patch.speedQuiz };
  room.timingGame = {
    ...createDefaultTimingGame(),
    ...room.timingGame,
    ...patch.timingGame,
  };
  room.updatedAt = Date.now();
  return room;
}

export function incrementBuzzerBattleCount(
  roomId: string,
  participantId: string,
): Participant | null {
  const room = getOrCreateRoom(roomId);
  if (room.mode !== "buzzerBattle" || !room.buzzerBattle.active) return null;
  const participant = room.participants.get(participantId);
  if (!participant) return null;

  room.buzzerBattle = {
    ...room.buzzerBattle,
    counts: {
      ...room.buzzerBattle.counts,
      [participantId]: (room.buzzerBattle.counts[participantId] ?? 0) + 1,
    },
  };
  room.updatedAt = Date.now();
  return participant;
}

export function submitSurveyAnswer(
  roomId: string,
  participantId: string,
  answer: string,
): Participant | null {
  const room = getOrCreateRoom(roomId);
  if (room.mode !== "teamSurvey" || !room.teamSurvey.active) return null;
  const participant = room.participants.get(participantId);
  if (!participant) return null;

  room.teamSurvey = {
    ...room.teamSurvey,
    submissions: {
      ...room.teamSurvey.submissions,
      [participantId]: answer,
    },
  };
  room.updatedAt = Date.now();
  return participant;
}

export function acceptSpeedQuizBuzzer(
  roomId: string,
  participantId: string,
): Participant | null {
  const room = getOrCreateRoom(roomId);
  if (room.mode !== "speedQuiz" || !room.speedQuiz.buzzerActive) return null;
  const participant = room.participants.get(participantId);
  if (!participant) return null;

  room.speedQuiz = {
    ...room.speedQuiz,
    buzzerActive: false,
    fastestParticipantId: participantId,
  };
  room.activeParticipantId = participantId;
  room.updatedAt = Date.now();
  return participant;
}

export function acceptTimingGameClick(
  roomId: string,
  participantId: string,
): Participant | null {
  const room = getOrCreateRoom(roomId);
  if (room.mode !== "timingGame" || !room.timingGame.active) return null;
  const participant = room.participants.get(participantId);
  if (!participant) return null;
  const alreadyClicked = room.timingGame.clicks.some(
    (click) => click.participantId === participantId,
  );
  if (alreadyClicked) return null;

  room.timingGame = {
    ...room.timingGame,
    clicks: [
      ...room.timingGame.clicks,
      {
        participantId,
        order: room.timingGame.clicks.length + 1,
        clickedAt: Date.now(),
      },
    ],
  };
  room.updatedAt = Date.now();
  return participant;
}

export function resetBuzzer(roomId: string): RoomRecord {
  const room = getOrCreateRoom(roomId);
  room.activeParticipantId = undefined;
  room.speedQuiz = {
    ...room.speedQuiz,
    fastestParticipantId: undefined,
    buzzerActive: false,
  };
  room.updatedAt = Date.now();
  return room;
}

export function adjustScore(
  roomId: string,
  participantId: string,
  delta: number,
): Participant | null {
  const room = getOrCreateRoom(roomId);
  const participant = room.participants.get(participantId);
  if (!participant) return null;
  const updated = { ...participant, score: participant.score + delta };
  room.participants.set(participantId, updated);
  room.updatedAt = Date.now();
  return updated;
}
