export type RoomPhase = "lobby" | "ready" | "playing" | "paused" | "finished";

export type ScreenRoute =
  | "lobby"
  | "question"
  | "buzzer"
  | "result"
  | "scoreboard"
  | "custom";

export type GameMode = "idle" | "buzzerBattle" | "teamSurvey" | "speedQuiz";

export type BuzzerBattleLevel = 1 | 2 | 3;

export interface Participant {
  id: string;
  nickname: string;
  connected: boolean;
  score: number;
  joinedAt: number;
  lastSeenAt: number;
}

export interface TeamConfig {
  id: string;
  name: string;
  score: number;
  memberIds: string[];
}

export interface BuzzerBattleState {
  level: BuzzerBattleLevel;
  durationSeconds: number;
  active: boolean;
  endsAt?: number;
  resultVisible: boolean;
  counts: Record<string, number>;
}

export interface TeamSurveyState {
  questionIndex: number;
  question: string;
  active: boolean;
  revealAnswers: boolean;
  submissions: Record<string, string>;
}

export interface SpeedQuizState {
  question: string;
  buzzerActive: boolean;
  fastestParticipantId?: string;
}

export interface RoomState {
  roomId: string;
  phase: RoomPhase;
  screen: ScreenRoute;
  mode: GameMode;
  participants: Participant[];
  showParticipantOverlay: boolean;
  showTeamScoreOverlay: boolean;
  teams: TeamConfig[];
  buzzerBattle: BuzzerBattleState;
  teamSurvey: TeamSurveyState;
  speedQuiz: SpeedQuizState;
  activeParticipantId?: string;
  message?: string;
  updatedAt: number;
}

export interface JoinRoomPayload {
  roomId: string;
  participantId?: string;
  nickname: string;
}

export interface HostJoinPayload {
  roomId: string;
  hostKey?: string;
}

export interface HostCommandPayload {
  roomId: string;
  screen?: ScreenRoute;
  phase?: RoomPhase;
  mode?: GameMode;
  message?: string;
  showParticipantOverlay?: boolean;
  showTeamScoreOverlay?: boolean;
  teams?: TeamConfig[];
  buzzerBattle?: Partial<BuzzerBattleState>;
  teamSurvey?: Partial<TeamSurveyState>;
  speedQuiz?: Partial<SpeedQuizState>;
}

export interface BuzzerPayload {
  roomId: string;
  participantId: string;
}

export interface AnswerSubmitPayload {
  roomId: string;
  participantId: string;
  answer: string;
}

export interface ScoreAdjustPayload {
  roomId: string;
  participantId: string;
  delta: number;
}

export interface ServerToClientEvents {
  "room:state": (state: RoomState) => void;
  "room:error": (message: string) => void;
  "player:joined": (participant: Participant) => void;
  "player:rejoined": (participant: Participant) => void;
  "buzzer:accepted": (payload: {
    participantId: string;
    nickname: string;
    at: number;
  }) => void;
  "answer:received": (payload: {
    participantId: string;
    nickname: string;
    answer: string;
    at: number;
  }) => void;
  "screen:effect": (payload: {
    type: "flash" | "shake" | "confetti" | "sound";
    message?: string;
  }) => void;
}

export interface ClientToServerEvents {
  "host:join": (payload: HostJoinPayload, ack?: (state: RoomState) => void) => void;
  "host:command": (payload: HostCommandPayload) => void;
  "host:reset-buzzer": (payload: { roomId: string }) => void;
  "host:score-adjust": (payload: ScoreAdjustPayload) => void;
  "player:join": (
    payload: JoinRoomPayload,
    ack?: (payload: { participant: Participant; state: RoomState }) => void,
  ) => void;
  "player:buzzer": (payload: BuzzerPayload) => void;
  "player:answer-submit": (payload: AnswerSubmitPayload) => void;
}
