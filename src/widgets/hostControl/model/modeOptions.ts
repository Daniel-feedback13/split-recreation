import type { GameMode } from "@/shared/model/socket";

const modeOptions: Array<{ value: GameMode; label: string }> = [
  { value: "idle", label: "미선택" },
  { value: "buzzerBattle", label: "버저비터" },
  { value: "teamSurvey", label: "단합력 평가" },
  { value: "speedQuiz", label: "스피드 퀴즈" },
  { value: "timingGame", label: "눈치게임" },
];

export default modeOptions;
