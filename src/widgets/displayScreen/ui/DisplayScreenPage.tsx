"use client";

import { useEffect, useMemo, useRef } from "react";
import {
  Box,
  Card,
  CardContent,
  Chip,
  Container,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import ParticipantOverlayDialog from "./ParticipantOverlayDialog";
import TeamScoreOverlayDialog from "./TeamScoreOverlayDialog";
import DEFAULT_ROOM_ID from "@/shared/config/room";
import useRoomSocket from "@/shared/lib/useRoomSocket";

function normalizeAnswer(answer: string) {
  return answer.trim().toLowerCase();
}

export default function DisplayPage() {
  const { socket, state, lastEvent } = useRoomSocket(DEFAULT_ROOM_ID);
  const announcedParticipantId = useRef<string | undefined>(undefined);

  useEffect(() => {
    socket.emit("host:join", { roomId: DEFAULT_ROOM_ID });
  }, [socket]);

  useEffect(() => {
    if (state?.mode !== "speedQuiz") {
      return;
    }
    if (!state.speedQuiz.fastestParticipantId) {
      return;
    }
    if (announcedParticipantId.current === state.speedQuiz.fastestParticipantId) {
      return;
    }

    announcedParticipantId.current = state.speedQuiz.fastestParticipantId;
    const winner = state.participants.find(
      (participant) => participant.id === state.speedQuiz.fastestParticipantId,
    );
    if (!winner || typeof window === "undefined" || !("speechSynthesis" in window)) {
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(winner.nickname);
    utterance.rate = 0.9;
    utterance.pitch = 0.7;
    utterance.lang = "ko-KR";
    window.speechSynthesis.speak(utterance);
  }, [state]);

  const connectedParticipants = useMemo(
    () => state?.participants.filter((participant) => participant.connected) ?? [],
    [state?.participants],
  );

  const groupedTeams = useMemo(
    () =>
      state?.teams.map((team, index) => ({
        id: team.id,
        name: team.name || `Team ${index + 1}`,
        score: team.score ?? 0,
        members: connectedParticipants.filter((participant) =>
          team.memberIds.includes(participant.id),
        ),
      })) ?? [],
    [connectedParticipants, state?.teams],
  );

  const rankedTeams = useMemo(
    () => [...groupedTeams].sort((a, b) => b.score - a.score),
    [groupedTeams],
  );

  const battleResults = useMemo(
    () =>
      groupedTeams.map((team) => ({
        ...team,
        total: team.members.reduce(
          (sum, member) => sum + (state?.buzzerBattle.counts[member.id] ?? 0),
          0,
        ),
        memberCounts: team.members
          .map((member) => ({
            nickname: member.nickname,
            count: state?.buzzerBattle.counts[member.id] ?? 0,
          }))
          .sort((a, b) => b.count - a.count),
      })),
    [groupedTeams, state?.buzzerBattle.counts],
  );

  const surveyResults = useMemo(
    () =>
      groupedTeams.map((team) => {
        const answers = team.members.map((member) => ({
          nickname: member.nickname,
          answer: state?.teamSurvey.submissions[member.id] ?? "",
        }));
        const frequency = answers.reduce<Record<string, number>>(
          (accumulator, current) => {
            const key = normalizeAnswer(current.answer);
            if (!key) {
              return accumulator;
            }

            return {
              ...accumulator,
              [key]: (accumulator[key] ?? 0) + 1,
            };
          },
          {},
        );
        const topDuplicateCount = Math.max(0, ...Object.values(frequency));

        return {
          ...team,
          answers,
          topDuplicateCount,
        };
      }),
    [groupedTeams, state?.teamSurvey.submissions],
  );

  const fastestParticipant = state?.participants.find(
    (participant) => participant.id === state.speedQuiz.fastestParticipantId,
  );

  const renderModeContent = () => {
    if (!state) return null;

    if (state.mode === "idle") {
      return (
        <Box
          sx={{
            width: "100%",
            maxWidth: 1200,
            mx: "auto",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 3,
            "@keyframes welcomeGradientShift": {
              "0%": {
                backgroundPosition: "0% 50%",
                filter: "drop-shadow(0 0 18px rgba(124,140,255,0.18))",
              },
              "50%": {
                backgroundPosition: "100% 50%",
                filter: "drop-shadow(0 0 28px rgba(93,214,192,0.28))",
              },
              "100%": {
                backgroundPosition: "0% 50%",
                filter: "drop-shadow(0 0 18px rgba(255,146,194,0.18))",
              },
            },
            "@keyframes welcomeFloat": {
              "0%": { transform: "translateY(0px) scale(1)" },
              "50%": { transform: "translateY(-8px) scale(1.01)" },
              "100%": { transform: "translateY(0px) scale(1)" },
            },
          }}
        >
          <Box
            sx={{
              width: "100%",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
            }}
          >
            <Typography
              variant="h1"
              sx={{
                fontSize: { xs: 42, md: 88, xl: 104 },
                fontWeight: 900,
                letterSpacing: "-0.04em",
                lineHeight: 1.05,
                textAlign: "center",
                backgroundImage:
                  "linear-gradient(120deg, #7c8cff 0%, #5dd6c0 30%, #ffd166 58%, #ff92c2 82%, #7c8cff 100%)",
                backgroundSize: "220% 220%",
                backgroundClip: "text",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                animation:
                  "welcomeGradientShift 10s ease-in-out infinite, welcomeFloat 6s ease-in-out infinite",
              }}
            >
              Welcome to
            </Typography>
            <Typography
              variant="h1"
              sx={{
                fontSize: { xs: 42, md: 88, xl: 104 },
                fontWeight: 900,
                letterSpacing: "-0.04em",
                lineHeight: 1.05,
                textAlign: "center",
                backgroundImage:
                  "linear-gradient(120deg, #7c8cff 0%, #5dd6c0 30%, #ffd166 58%, #ff92c2 82%, #7c8cff 100%)",
                backgroundSize: "220% 220%",
                backgroundClip: "text",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                animation:
                  "welcomeGradientShift 10s ease-in-out infinite, welcomeFloat 6s ease-in-out infinite",
              }}
            >
              SPLIT Recreation
            </Typography>
          </Box>
          <Typography
            variant="h5"
            sx={{
              color: "rgba(255,255,255,0.78)",
              maxWidth: 720,
              lineHeight: 1.7,
              textAlign: "center",
            }}
          >
            팀을 준비하고, 참가자를 모으고, 다음 게임 모드를 시작해보세요.
          </Typography>
          <Stack
            direction="row"
            sx={{ flexWrap: "wrap", gap: 1.5, justifyContent: "center" }}
          >
            <Chip color="primary" label="Ready for the next game" />
            <Chip color="secondary" label="Players can join now" />
          </Stack>
        </Box>
      );
    }

    if (state.mode === "buzzerBattle") {
      if (state.buzzerBattle.resultVisible) {
        return (
          <Stack spacing={3} sx={{ width: "100%" }}>
            <Typography variant="h2">버저비터 결과</Typography>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" },
                gap: 2,
                width: "100%",
              }}
            >
              {battleResults.map((team) => (
                <Paper key={team.id} sx={{ p: 3, borderRadius: 2 }}>
                  <Stack spacing={2}>
                    <Typography variant="h4">{team.name}</Typography>
                    <Typography color="secondary.main" variant="h3">
                      총 {team.total}회
                    </Typography>
                    {team.memberCounts.map((member) => (
                      <Stack
                        key={member.nickname}
                        direction="row"
                        sx={{ justifyContent: "space-between" }}
                      >
                        <Typography>{member.nickname}</Typography>
                        <Typography sx={{ fontWeight: 700 }}>{member.count}회</Typography>
                      </Stack>
                    ))}
                  </Stack>
                </Paper>
              ))}
            </Box>
          </Stack>
        );
      }

      return (
        <Stack spacing={2.5} sx={{ alignItems: "center" }}>
          <Typography variant="h1" sx={{ fontSize: { xs: 40, md: 72 } }}>
            {state.message || "버저비터 준비 중"}
          </Typography>
          <Chip
            color={state.buzzerBattle.active ? "error" : "default"}
            label={state.buzzerBattle.active ? "진행 중" : "대기 중"}
          />
        </Stack>
      );
    }

    if (state.mode === "teamSurvey") {
      if (state.teamSurvey.revealAnswers) {
        return (
          <Stack spacing={3} sx={{ width: "100%" }}>
            <Typography variant="h2">단합력 평가 결과</Typography>
            <Typography variant="h5">{state.teamSurvey.question}</Typography>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" },
                gap: 2,
                width: "100%",
              }}
            >
              {surveyResults.map((team) => (
                <Paper key={team.id} sx={{ p: 3, borderRadius: 2 }}>
                  <Stack spacing={2}>
                    <Typography variant="h4">{team.name}</Typography>
                    <Typography color="secondary.main">
                      최다 중복 답변 수: {team.topDuplicateCount}
                    </Typography>
                    {team.answers.map((answer) => (
                      <Stack
                        key={answer.nickname}
                        direction="row"
                        sx={{ justifyContent: "space-between", gap: 2 }}
                      >
                        <Typography>{answer.nickname}</Typography>
                        <Typography sx={{ fontWeight: 700 }}>
                          {answer.answer || "-"}
                        </Typography>
                      </Stack>
                    ))}
                  </Stack>
                </Paper>
              ))}
            </Box>
          </Stack>
        );
      }

      return (
        <Stack spacing={2.5} sx={{ alignItems: "center" }}>
          <Typography variant="h2">단합력 평가 게임</Typography>
          <Typography variant="h4">
            {state.teamSurvey.question || "질문 대기 중"}
          </Typography>
          <Chip
            color={state.teamSurvey.active ? "primary" : "default"}
            label={state.teamSurvey.active ? "답변 입력 가능" : "대기 중"}
          />
        </Stack>
      );
    }

    let speedQuizStatusColor: "default" | "error" | "secondary" = "default";
    let speedQuizStatusLabel = "버저 대기 중";

    if (fastestParticipant) {
      speedQuizStatusColor = "secondary";
      speedQuizStatusLabel = "가장 먼저 누른 참가자";
    } else if (state.speedQuiz.buzzerActive) {
      speedQuizStatusColor = "error";
      speedQuizStatusLabel = "버저 활성화됨";
    }

    return (
      <Box
        sx={{
          position: "relative",
          width: "100%",
          minHeight: { xs: 320, md: 460 },
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Stack spacing={2.5} sx={{ alignItems: "center", width: "100%" }}>
          <Typography variant="h2">스피드 퀴즈</Typography>
          <Typography variant="h3" sx={{ textAlign: "center" }}>
            {state.speedQuiz.question || state.message || "문제 대기 중"}
          </Typography>
          <Chip color={speedQuizStatusColor} label={speedQuizStatusLabel} />
        </Stack>

        {fastestParticipant && (
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              px: 3,
              backgroundColor: "rgba(16, 19, 26, 0.42)",
              backdropFilter: "blur(8px)",
            }}
          >
            <Paper
              elevation={12}
              sx={{
                px: { xs: 4, md: 8 },
                py: { xs: 4, md: 6 },
                borderRadius: 2,
                minWidth: { xs: "100%", sm: 520, md: 680 },
                maxWidth: 860,
                textAlign: "center",
                border: "1px solid rgba(255,255,255,0.08)",
                background:
                  "linear-gradient(135deg, rgba(124,140,255,0.18) 0%, rgba(93,214,192,0.16) 100%), rgba(24,29,41,0.96)",
                boxShadow:
                  "0 24px 60px rgba(0,0,0,0.35), 0 0 40px rgba(124,140,255,0.16)",
              }}
            >
              <Stack spacing={2.5} sx={{ alignItems: "center" }}>
                <Chip color="secondary" label="BUZZER WINNER" />
                <Typography
                  variant="h1"
                  color="secondary.main"
                  sx={{
                    fontSize: { xs: 54, md: 96 },
                    fontWeight: 900,
                    lineHeight: 1.05,
                    wordBreak: "keep-all",
                  }}
                >
                  {fastestParticipant.nickname}
                </Typography>
                <Typography color="text.secondary" variant="h6">
                  가장 먼저 버저를 눌렀습니다
                </Typography>
              </Stack>
            </Paper>
          </Box>
        )}
      </Box>
    );
  };

  return (
    <Box
      component="main"
      sx={{
        minHeight: "100vh",
        py: { xs: 3, md: 5 },
        background:
          "radial-gradient(circle at top, rgba(124,140,255,0.2), transparent 30%), #10131a",
      }}
    >
      <Container
        maxWidth="xl"
        sx={{
          minHeight: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Stack spacing={3} sx={{ width: "100%" }}>
          <Paper
            sx={{
              minHeight: { xs: "calc(100vh - 96px)", md: "calc(100vh - 120px)" },
              width: "100%",
              p: { xs: 3, md: 6 },
              borderRadius: 2,
              display: "grid",
              placeItems: "center",
              textAlign: "center",
              background:
                "radial-gradient(circle at top, rgba(93,214,192,0.18), transparent 28%), rgba(24,29,41,0.96)",
            }}
          >
            {renderModeContent()}
          </Paper>

          {state?.mode !== "idle" && (
            <Paper sx={{ p: 3, borderRadius: 2 }}>
              <Stack spacing={2}>
                <Typography variant="h5">현재 참가자</Typography>
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                    gap: 2,
                  }}
                >
                  {state?.participants.map((participant) => (
                    <Card key={participant.id} variant="outlined">
                      <CardContent>
                        <Stack spacing={1}>
                          <Typography variant="h6">{participant.nickname}</Typography>
                          <Typography color="text.secondary">
                            {participant.score}점
                          </Typography>
                          <Chip
                            size="small"
                            color={participant.connected ? "success" : "default"}
                            label={participant.connected ? "online" : "offline"}
                            sx={{ width: "fit-content" }}
                          />
                        </Stack>
                      </CardContent>
                    </Card>
                  ))}
                </Box>
                {lastEvent && <Chip label={lastEvent} color="primary" />}
              </Stack>
            </Paper>
          )}
        </Stack>
      </Container>

      <ParticipantOverlayDialog
        open={Boolean(state?.showParticipantOverlay)}
        groupedTeams={groupedTeams}
        connectedParticipants={connectedParticipants}
      />
      <TeamScoreOverlayDialog
        open={Boolean(state?.showTeamScoreOverlay)}
        rankedTeams={rankedTeams}
      />
    </Box>
  );
}
