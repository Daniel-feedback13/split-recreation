"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Divider,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import ModeSelectPanel from "./ModeSelectPanel";
import TeamScoreControlPanel from "./TeamScoreControlPanel";
import modeOptions from "../model/modeOptions";
import { createDefaultTeam, normalizeTeams } from "@/entities/team/model/team";
import teamSurveyQuestions from "@/entities/teamSurvey/model/questions";
import DEFAULT_ROOM_ID from "@/shared/config/room";
import useRoomSocket from "@/shared/lib/useRoomSocket";
import type {
  BuzzerBattleLevel,
  GameMode,
  RoomPhase,
  ScreenRoute,
  TeamConfig,
} from "@/shared/model/socket";

export default function HostPage() {
  const { socket, state, lastEvent } = useRoomSocket(DEFAULT_ROOM_ID);
  const [message, setMessage] = useState("레크리에이션을 시작합니다!");
  const [battleLevel, setBattleLevel] = useState<BuzzerBattleLevel>(1);
  const [battleDuration, setBattleDuration] = useState(10);
  const [surveyQuestionIndex, setSurveyQuestionIndex] = useState(0);
  const [surveyQuestion, setSurveyQuestion] = useState<string>(
    teamSurveyQuestions[0] ?? "",
  );
  const [speedQuizQuestion, setSpeedQuizQuestion] = useState("");
  const [timingTargetOrder, setTimingTargetOrder] = useState(1);
  const [teamCount, setTeamCount] = useState(2);
  const [draftTeams, setDraftTeams] = useState<TeamConfig[]>([
    createDefaultTeam(0),
    createDefaultTeam(1),
  ]);

  useEffect(() => {
    socket.emit("host:join", { roomId: DEFAULT_ROOM_ID });
  }, [socket]);

  useEffect(() => {
    if (!state) {
      return;
    }

    setMessage(state.message || "레크리에이션을 시작합니다!");
    setBattleLevel(state.buzzerBattle.level);
    setBattleDuration(state.buzzerBattle.durationSeconds);
    setSurveyQuestionIndex(state.teamSurvey.questionIndex);
    setSurveyQuestion(state.teamSurvey.question);
    setSpeedQuizQuestion(state.speedQuiz.question);
    setTimingTargetOrder(state.timingGame?.targetOrder ?? 1);

    if (state.teams.length > 0) {
      const normalizedTeams = normalizeTeams(state.teams.length, state.teams);
      setDraftTeams(normalizedTeams);
      setTeamCount(normalizedTeams.length);
    }
  }, [state]);

  const connectedParticipants = useMemo(
    () => state?.participants.filter((participant) => participant.connected) ?? [],
    [state?.participants],
  );
  const totalParticipants = state?.participants.length ?? 0;
  const surveyQuestionCount = teamSurveyQuestions.length;
  const unassignedParticipants = useMemo(() => {
    const assignedIds = new Set(draftTeams.flatMap((team) => team.memberIds));

    return connectedParticipants.filter(
      (participant) => !assignedIds.has(participant.id),
    );
  }, [connectedParticipants, draftTeams]);

  const syncSurveyQuestion = (nextIndex: number) => {
    const safeIndex = Math.min(
      Math.max(nextIndex, 0),
      Math.max(surveyQuestionCount - 1, 0),
    );
    const nextQuestion = teamSurveyQuestions[safeIndex] ?? "";

    setSurveyQuestionIndex(safeIndex);
    setSurveyQuestion(nextQuestion);

    if (state?.mode !== "teamSurvey") {
      return;
    }

    socket.emit("host:command", {
      roomId: DEFAULT_ROOM_ID,
      teamSurvey: {
        questionIndex: safeIndex,
        question: nextQuestion,
        active: false,
        revealAnswers: false,
        submissions: {},
      },
    });
  };

  const sendCommand = (
    phase: RoomPhase,
    screen: ScreenRoute,
    patch?: Record<string, unknown>,
  ) => {
    socket.emit("host:command", {
      roomId: DEFAULT_ROOM_ID,
      phase,
      screen,
      message,
      ...patch,
    });
  };

  const setMode = (mode: GameMode) => {
    let phase: RoomPhase = "playing";
    let screen: ScreenRoute = "buzzer";

    if (mode === "idle") {
      phase = "lobby";
      screen = "lobby";
    } else if (mode === "buzzerBattle") {
      phase = "ready";
    } else if (mode === "teamSurvey") {
      screen = "question";
    } else if (mode === "timingGame") {
      phase = "ready";
      sendCommand(phase, screen, {
        mode,
        timingGame: {
          active: false,
          resultVisible: false,
          clicks: [],
        },
      });

      return;
    }

    sendCommand(phase, screen, { mode });
  };

  const handleTeamCountChange = (nextCount: number) => {
    const safeCount = Math.max(1, nextCount);
    setTeamCount(safeCount);
    setDraftTeams((currentTeams) => normalizeTeams(safeCount, currentTeams));
  };

  const handleTeamNameChange = (teamId: string, nextName: string) => {
    setDraftTeams((currentTeams) =>
      currentTeams.map((team, index) =>
        team.id === teamId ? { ...team, name: nextName || `Team ${index + 1}` } : team,
      ),
    );
  };

  const updateTeamScore = (teamId: string, nextScore: number) => {
    const normalizedScore = Number.isNaN(nextScore) ? 0 : nextScore;
    const updatedTeams = normalizeTeams(
      teamCount,
      draftTeams.map((team) =>
        team.id === teamId ? { ...team, score: normalizedScore } : team,
      ),
    );

    setDraftTeams(updatedTeams);
    socket.emit("host:command", {
      roomId: DEFAULT_ROOM_ID,
      teams: updatedTeams,
    });
  };

  const adjustTeamScore = (teamId: string, delta: number) => {
    const currentScore = draftTeams.find((team) => team.id === teamId)?.score ?? 0;
    updateTeamScore(teamId, currentScore + delta);
  };

  const handleParticipantTeamChange = (participantId: string, nextTeamId: string) => {
    setDraftTeams((currentTeams) =>
      currentTeams.map((team) => {
        const filteredMemberIds = team.memberIds.filter(
          (memberId) => memberId !== participantId,
        );

        return team.id === nextTeamId
          ? { ...team, memberIds: [...filteredMemberIds, participantId] }
          : { ...team, memberIds: filteredMemberIds };
      }),
    );
  };

  const saveTeams = () => {
    const normalizedTeams = normalizeTeams(teamCount, draftTeams);
    setDraftTeams(normalizedTeams);
    socket.emit("host:command", {
      roomId: DEFAULT_ROOM_ID,
      teams: normalizedTeams,
    });
  };

  const startBuzzerBattle = () => {
    const endsAt = Date.now() + battleDuration * 1000;
    socket.emit("host:command", {
      roomId: DEFAULT_ROOM_ID,
      mode: "buzzerBattle",
      phase: "playing",
      screen: "buzzer",
      message,
      buzzerBattle: {
        level: battleLevel,
        durationSeconds: battleDuration,
        active: true,
        endsAt,
        resultVisible: false,
        counts: {},
      },
    });
  };

  const revealBuzzerBattleResult = () => {
    socket.emit("host:command", {
      roomId: DEFAULT_ROOM_ID,
      buzzerBattle: {
        resultVisible: true,
      },
    });
  };

  const startSurvey = () => {
    socket.emit("host:command", {
      roomId: DEFAULT_ROOM_ID,
      mode: "teamSurvey",
      phase: "playing",
      screen: "question",
      message,
      teamSurvey: {
        questionIndex: surveyQuestionIndex,
        question: surveyQuestion,
        active: true,
        revealAnswers: false,
        submissions: {},
      },
    });
  };

  const revealSurveyAnswers = () => {
    socket.emit("host:command", {
      roomId: DEFAULT_ROOM_ID,
      teamSurvey: {
        revealAnswers: true,
        active: false,
      },
    });
  };

  const activateSpeedQuiz = () => {
    socket.emit("host:command", {
      roomId: DEFAULT_ROOM_ID,
      mode: "speedQuiz",
      phase: "playing",
      screen: "buzzer",
      message,
      speedQuiz: {
        question: speedQuizQuestion,
        buzzerActive: true,
        fastestParticipantId: undefined,
      },
    });
  };

  const resetSpeedQuiz = () => {
    socket.emit("host:command", {
      roomId: DEFAULT_ROOM_ID,
      speedQuiz: {
        question: speedQuizQuestion,
        buzzerActive: true,
        fastestParticipantId: undefined,
      },
    });
  };

  const setRandomTimingTarget = () => {
    const participantCount = Math.max(connectedParticipants.length, 1);
    setTimingTargetOrder(Math.floor(Math.random() * participantCount) + 1);
  };

  const startTimingGame = () => {
    const participantCount = Math.max(connectedParticipants.length, 1);
    const safeTargetOrder = Math.min(Math.max(timingTargetOrder, 1), participantCount);

    setTimingTargetOrder(safeTargetOrder);
    socket.emit("host:command", {
      roomId: DEFAULT_ROOM_ID,
      mode: "timingGame",
      phase: "playing",
      screen: "buzzer",
      message,
      timingGame: {
        targetOrder: safeTargetOrder,
        active: true,
        resultVisible: false,
        clicks: [],
      },
    });
  };

  const revealTimingGameResult = () => {
    socket.emit("host:command", {
      roomId: DEFAULT_ROOM_ID,
      mode: "timingGame",
      phase: "finished",
      screen: "result",
      timingGame: {
        active: false,
        resultVisible: true,
      },
    });
  };

  const toggleOverlay = () => {
    socket.emit("host:command", {
      roomId: DEFAULT_ROOM_ID,
      showParticipantOverlay: !state?.showParticipantOverlay,
    });
  };

  const toggleTeamScoreOverlay = () => {
    socket.emit("host:command", {
      roomId: DEFAULT_ROOM_ID,
      showTeamScoreOverlay: !state?.showTeamScoreOverlay,
    });
  };

  return (
    <Box
      component="main"
      sx={{
        minHeight: "100vh",
        py: { xs: 3, md: 5 },
        background:
          "linear-gradient(180deg, rgba(124,140,255,0.12) 0%, rgba(16,19,26,1) 25%)",
      }}
    >
      <Container maxWidth="xl">
        <Stack spacing={3}>
          <Paper sx={{ p: { xs: 3, md: 4 }, borderRadius: 2 }}>
            <Stack spacing={3}>
              <Box>
                <Typography
                  variant="overline"
                  color="primary.main"
                  sx={{ fontWeight: 800 }}
                >
                  HOST CONTROL
                </Typography>
                <Typography variant="h3">사회자 제어화면</Typography>
              </Box>

              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", md: "repeat(3, minmax(0, 1fr))" },
                  gap: 2,
                }}
              >
                <Card variant="outlined">
                  <CardContent>
                    <Typography color="text.secondary">현재 참가 인원</Typography>
                    <Typography variant="h4">{connectedParticipants.length}명</Typography>
                  </CardContent>
                </Card>
                <Card variant="outlined">
                  <CardContent>
                    <Typography color="text.secondary">누적 입장 인원</Typography>
                    <Typography variant="h4">{totalParticipants}명</Typography>
                  </CardContent>
                </Card>
                <Card variant="outlined">
                  <CardContent>
                    <Typography color="text.secondary">현재 모드</Typography>
                    <Typography variant="h5">
                      {modeOptions.find((option) => option.value === state?.mode)?.label}
                    </Typography>
                  </CardContent>
                </Card>
              </Box>

              <TextField
                label="메인 화면 메시지"
                value={message}
                onChange={(event) => setMessage(event.target.value)}
              />

              <Stack direction="row" sx={{ flexWrap: "wrap", gap: 1.5 }}>
                <Button variant="outlined" onClick={() => sendCommand("lobby", "lobby")}>
                  로비
                </Button>
                <Button variant="outlined" onClick={toggleOverlay}>
                  {state?.showParticipantOverlay
                    ? "참가자 목록 닫기"
                    : "참가자 목록 보기"}
                </Button>
                <Button variant="outlined" onClick={toggleTeamScoreOverlay}>
                  {state?.showTeamScoreOverlay ? "팀 점수판 닫기" : "팀 점수판 보기"}
                </Button>
              </Stack>

              {lastEvent && <Chip label={`최근 이벤트: ${lastEvent}`} color="primary" />}
            </Stack>
          </Paper>

          <ModeSelectPanel
            mode={state?.mode}
            options={modeOptions}
            onModeSelect={setMode}
          />

          <Paper sx={{ p: { xs: 3, md: 4 }, borderRadius: 2 }}>
            <Stack spacing={2.5}>
              <Typography variant="h5">팀 설정</Typography>
              <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                <TextField
                  select
                  label="팀 개수"
                  value={teamCount}
                  onChange={(event) => handleTeamCountChange(Number(event.target.value))}
                  sx={{ maxWidth: 220 }}
                >
                  {[1, 2, 3, 4, 5, 6].map((count) => (
                    <MenuItem key={count} value={count}>
                      {count}개 팀
                    </MenuItem>
                  ))}
                </TextField>
                <Button variant="contained" onClick={saveTeams}>
                  팀 설정 저장
                </Button>
              </Stack>

              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", xl: "1.2fr 1fr" },
                  gap: 3,
                }}
              >
                <Stack spacing={2}>
                  {draftTeams.map((team, index) => (
                    <Card key={team.id} variant="outlined">
                      <CardContent>
                        <Stack spacing={2}>
                          <TextField
                            label={`팀 ${index + 1} 이름`}
                            value={team.name}
                            onChange={(event) =>
                              handleTeamNameChange(team.id, event.target.value)
                            }
                          />
                          <Stack direction="row" sx={{ flexWrap: "wrap", gap: 1 }}>
                            {team.memberIds.length > 0 ? (
                              team.memberIds.map((memberId) => {
                                const participant = connectedParticipants.find(
                                  (item) => item.id === memberId,
                                );
                                if (!participant) {
                                  return null;
                                }

                                return (
                                  <Chip
                                    key={memberId}
                                    label={participant.nickname}
                                    color="primary"
                                    variant="outlined"
                                  />
                                );
                              })
                            ) : (
                              <Typography color="text.secondary">
                                아직 배정된 멤버가 없습니다.
                              </Typography>
                            )}
                          </Stack>
                        </Stack>
                      </CardContent>
                    </Card>
                  ))}
                </Stack>

                <Card variant="outlined">
                  <CardContent>
                    <Stack spacing={2}>
                      <Typography variant="h6">멤버별 팀 배정</Typography>
                      {connectedParticipants.map((participant) => {
                        const assignedTeamId =
                          draftTeams.find((team) =>
                            team.memberIds.includes(participant.id),
                          )?.id ?? "";

                        return (
                          <Stack key={participant.id} spacing={1.5}>
                            <Typography sx={{ fontWeight: 700 }}>
                              {participant.nickname}
                            </Typography>
                            <TextField
                              select
                              label="소속 팀"
                              value={assignedTeamId}
                              onChange={(event) =>
                                handleParticipantTeamChange(
                                  participant.id,
                                  event.target.value,
                                )
                              }
                            >
                              {draftTeams.map((team, index) => (
                                <MenuItem key={team.id} value={team.id}>
                                  {team.name || `Team ${index + 1}`}
                                </MenuItem>
                              ))}
                            </TextField>
                            <Divider />
                          </Stack>
                        );
                      })}
                    </Stack>
                  </CardContent>
                </Card>
              </Box>

              {unassignedParticipants.length > 0 && (
                <Stack direction="row" sx={{ flexWrap: "wrap", gap: 1 }}>
                  <Typography color="text.secondary">미배정 참가자:</Typography>
                  {unassignedParticipants.map((participant) => (
                    <Chip
                      key={participant.id}
                      label={participant.nickname}
                      color="warning"
                      variant="outlined"
                    />
                  ))}
                </Stack>
              )}
            </Stack>
          </Paper>

          <TeamScoreControlPanel
            teams={draftTeams}
            onScoreAdjust={adjustTeamScore}
            onScoreChange={updateTeamScore}
          />

          <Paper sx={{ p: { xs: 3, md: 4 }, borderRadius: 2 }}>
            <Stack spacing={2.5}>
              <Typography variant="h5">버저비터 설정</Typography>
              <TextField
                select
                label="난이도"
                value={battleLevel}
                onChange={(event) =>
                  setBattleLevel(Number(event.target.value) as BuzzerBattleLevel)
                }
                sx={{ maxWidth: 220 }}
              >
                {[1, 2, 3].map((level) => (
                  <MenuItem key={level} value={level}>
                    Level {level}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                type="number"
                label="제한 시간 (초)"
                value={battleDuration}
                onChange={(event) => setBattleDuration(Number(event.target.value))}
                sx={{ maxWidth: 220 }}
              />
              <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                <Button variant="contained" onClick={startBuzzerBattle}>
                  시작
                </Button>
                <Button
                  variant="outlined"
                  onClick={revealBuzzerBattleResult}
                  disabled={!state?.buzzerBattle.counts}
                >
                  결과 공개
                </Button>
              </Stack>
            </Stack>
          </Paper>

          <Paper sx={{ p: { xs: 3, md: 4 }, borderRadius: 2 }}>
            <Stack spacing={2.5}>
              <Typography variant="h5">단합력 평가 게임</Typography>
              <Stack
                direction={{ xs: "column", md: "row" }}
                sx={{ alignItems: { md: "center" }, gap: 1.5 }}
              >
                <Button
                  variant="outlined"
                  onClick={() => syncSurveyQuestion(surveyQuestionIndex - 1)}
                  disabled={surveyQuestionIndex <= 0}
                >
                  이전 질문
                </Button>
                <Chip
                  color="secondary"
                  label={`질문 ${surveyQuestionIndex + 1} / ${surveyQuestionCount}`}
                />
                <Button
                  variant="outlined"
                  onClick={() => syncSurveyQuestion(surveyQuestionIndex + 1)}
                  disabled={surveyQuestionIndex >= surveyQuestionCount - 1}
                >
                  다음 질문
                </Button>
              </Stack>
              <TextField
                label="질문"
                value={surveyQuestion}
                onChange={(event) => setSurveyQuestion(event.target.value)}
              />
              <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                <Button variant="contained" onClick={startSurvey}>
                  설문 활성화
                </Button>
                <Button variant="outlined" onClick={revealSurveyAnswers}>
                  정답 공개
                </Button>
              </Stack>
              <Stack direction="row" sx={{ flexWrap: "wrap", gap: 1 }}>
                {connectedParticipants.map((participant) => {
                  const submitted = Boolean(
                    state?.teamSurvey.submissions[participant.id],
                  );

                  return (
                    <Chip
                      key={participant.id}
                      label={`${participant.nickname} ${submitted ? "제출완료" : "미제출"}`}
                      color={submitted ? "success" : "default"}
                      variant="outlined"
                    />
                  );
                })}
              </Stack>
            </Stack>
          </Paper>

          <Paper sx={{ p: { xs: 3, md: 4 }, borderRadius: 2 }}>
            <Stack spacing={2.5}>
              <Typography variant="h5">스피드 퀴즈</Typography>
              <TextField
                label="문제"
                value={speedQuizQuestion}
                onChange={(event) => setSpeedQuizQuestion(event.target.value)}
              />
              <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                <Button variant="contained" onClick={activateSpeedQuiz}>
                  buzzer 활성화
                </Button>
                <Button variant="outlined" onClick={resetSpeedQuiz}>
                  오답 후 다시 활성화
                </Button>
              </Stack>
            </Stack>
          </Paper>

          <Paper sx={{ p: { xs: 3, md: 4 }, borderRadius: 2 }}>
            <Stack spacing={2.5}>
              <Typography variant="h5">눈치게임</Typography>
              <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                <TextField
                  type="number"
                  label="승리 순번"
                  value={timingTargetOrder}
                  onChange={(event) =>
                    setTimingTargetOrder(Math.max(1, Number(event.target.value) || 1))
                  }
                  sx={{ maxWidth: 220 }}
                />
                <Button variant="outlined" onClick={setRandomTimingTarget}>
                  랜덤 지정
                </Button>
              </Stack>
              <Typography color="text.secondary">
                현재 참가 인원 기준 1부터 {Math.max(connectedParticipants.length, 1)}
                까지 지정할 수 있습니다.
              </Typography>
              <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                <Button variant="contained" onClick={startTimingGame}>
                  시작
                </Button>
                <Button variant="outlined" onClick={revealTimingGameResult}>
                  결과 공개
                </Button>
              </Stack>
            </Stack>
          </Paper>
        </Stack>
      </Container>
    </Box>
  );
}
