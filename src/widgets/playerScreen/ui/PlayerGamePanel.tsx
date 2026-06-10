"use client";

import { useCallback, useEffect, useState } from "react";
import { Alert, Box, Button, Paper, Stack, TextField, Typography } from "@mui/material";
import type { RoomState } from "@/shared/model/socket";

interface TapButtonLayout {
  sizePercent: number;
  leftPercent: number;
  topPercent: number;
}

interface PlayerGamePanelProps {
  state: RoomState | null;
  answer: string;
  surveySubmitted: boolean;
  isBattleButtonEnabled: boolean;
  isSurveyEnabled: boolean;
  isSpeedQuizEnabled: boolean;
  onAnswerChange: (answer: string) => void;
  onSubmitAnswer: () => void;
  onBuzzer: () => void;
}

export default function PlayerGamePanel({
  state,
  answer,
  surveySubmitted,
  isBattleButtonEnabled,
  isSurveyEnabled,
  isSpeedQuizEnabled,
  onAnswerChange,
  onSubmitAnswer,
  onBuzzer,
}: PlayerGamePanelProps) {
  const isBuzzerBattleMode = state?.mode === "buzzerBattle";
  const battleLevel = state?.buzzerBattle.level ?? 1;
  const isBattleActive = Boolean(state?.buzzerBattle.active);
  const [tapButtonLayout, setTapButtonLayout] = useState<TapButtonLayout>({
    sizePercent: 100,
    leftPercent: 0,
    topPercent: 0,
  });

  const randomizeTapButton = useCallback(() => {
    const sizePercent = [100, 50, 25, 12.5][Math.floor(Math.random() * 4)] ?? 100;
    const maxPosition = 100 - sizePercent;

    setTapButtonLayout({
      sizePercent,
      leftPercent: Math.random() * maxPosition,
      topPercent: Math.random() * maxPosition,
    });
  }, []);

  useEffect(() => {
    if (!isBuzzerBattleMode || !isBattleActive || battleLevel === 1) {
      setTapButtonLayout({ sizePercent: 100, leftPercent: 0, topPercent: 0 });

      return undefined;
    }

    randomizeTapButton();

    if (battleLevel !== 2) {
      return undefined;
    }

    const intervalId = window.setInterval(randomizeTapButton, 2000);

    return () => window.clearInterval(intervalId);
  }, [battleLevel, isBattleActive, isBuzzerBattleMode, randomizeTapButton]);

  const handleTapButtonClick = () => {
    onBuzzer();

    if (battleLevel === 3 && isBattleActive) {
      randomizeTapButton();
    }
  };

  return (
    <Paper
      sx={{
        p: { xs: 3, md: 4 },
        borderRadius: 2,
        flex: 1,
        ...(isBuzzerBattleMode && {
          display: "grid",
          placeItems: "center",
        }),
      }}
    >
      <Stack spacing={2.5} sx={{ width: "100%" }}>
        {isBuzzerBattleMode && (
          <Box
            sx={{
              position: "relative",
              width: "100%",
              aspectRatio: "1 / 1",
            }}
          >
            <Button
              type="button"
              variant="contained"
              color="error"
              disabled={!isBattleButtonEnabled}
              onClick={handleTapButtonClick}
              sx={{
                position: "absolute",
                left: `${tapButtonLayout.leftPercent}%`,
                top: `${tapButtonLayout.topPercent}%`,
                width: `${tapButtonLayout.sizePercent}%`,
                aspectRatio: "1 / 1",
                borderRadius: 2,
                fontSize: { xs: 36, md: 54 },
                fontWeight: 900,
                letterSpacing: "0.08em",
                transition:
                  battleLevel === 1
                    ? "none"
                    : "left 180ms ease, top 180ms ease, width 180ms ease",
              }}
            >
              TAP!
            </Button>
          </Box>
        )}

        {state?.mode === "teamSurvey" && (
          <>
            <Typography variant="h6">
              {state.teamSurvey.question || "질문 대기 중"}
            </Typography>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
              <TextField
                value={answer}
                onChange={(event) => onAnswerChange(event.target.value)}
                placeholder="답변 입력"
                disabled={!isSurveyEnabled || surveySubmitted}
              />
              <Button
                type="button"
                variant="outlined"
                onClick={onSubmitAnswer}
                disabled={!isSurveyEnabled || surveySubmitted}
              >
                제출
              </Button>
            </Stack>
            {surveySubmitted && <Alert severity="success">제출 완료되었습니다.</Alert>}
          </>
        )}

        {state?.mode === "speedQuiz" && (
          <>
            <Typography variant="h6">
              {state.speedQuiz.question || "문제 대기 중"}
            </Typography>
            <Button
              type="button"
              variant="contained"
              color="error"
              disabled={!isSpeedQuizEnabled}
              onClick={onBuzzer}
              sx={{
                minHeight: 180,
                borderRadius: "999px",
                fontSize: { xs: 36, md: 54 },
                fontWeight: 900,
                letterSpacing: "0.08em",
              }}
            >
              BUZZER
            </Button>
            {state.speedQuiz.fastestParticipantId && (
              <Alert severity="info">
                가장 먼저 누른 참가자:{" "}
                {
                  state.participants.find(
                    (participant) =>
                      participant.id === state.speedQuiz.fastestParticipantId,
                  )?.nickname
                }
              </Alert>
            )}
          </>
        )}
      </Stack>
    </Paper>
  );
}
