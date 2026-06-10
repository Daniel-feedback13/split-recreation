"use client";

import { useEffect, useMemo, useState } from "react";
import { Box, Container, Stack } from "@mui/material";
import PlayerGamePanel from "./PlayerGamePanel";
import PlayerJoinPanel from "./PlayerJoinPanel";
import DEFAULT_ROOM_ID from "@/shared/config/room";
import { getStoredPlayer, storePlayer } from "@/shared/lib/playerStorage";
import useRoomSocket from "@/shared/lib/useRoomSocket";

interface SubmitEventLike {
  preventDefault: () => void;
}

export default function PlayerPage() {
  const { socket, state } = useRoomSocket(DEFAULT_ROOM_ID);
  const [participantId, setParticipantId] = useState<string>();
  const [savedParticipantId, setSavedParticipantId] = useState<string>();
  const [nickname, setNickname] = useState("");
  const [answer, setAnswer] = useState("");
  const [hasJoined, setHasJoined] = useState(false);
  const [isRestoring, setIsRestoring] = useState(true);
  const joinedParticipant = useMemo(
    () => state?.participants.find((participant) => participant.id === participantId),
    [participantId, state?.participants],
  );

  useEffect(() => {
    const stored = getStoredPlayer();
    setNickname(stored.nickname);
    setSavedParticipantId(stored.participantId);

    if (!stored.participantId || !stored.nickname) {
      setIsRestoring(false);

      return;
    }

    socket.emit(
      "player:join",
      {
        roomId: DEFAULT_ROOM_ID,
        participantId: stored.participantId,
        nickname: stored.nickname,
      },
      ({ participant }) => {
        setParticipantId(participant.id);
        setSavedParticipantId(participant.id);
        setNickname(participant.nickname);
        setHasJoined(true);
        storePlayer(participant.id, participant.nickname);
        setIsRestoring(false);
      },
    );
  }, [socket]);

  const join = (event: SubmitEventLike) => {
    event.preventDefault();
    const trimmedNickname = nickname.trim();
    if (!trimmedNickname) return;

    setIsRestoring(true);

    socket.emit(
      "player:join",
      {
        roomId: DEFAULT_ROOM_ID,
        participantId: savedParticipantId,
        nickname: trimmedNickname,
      },
      ({ participant }) => {
        setParticipantId(participant.id);
        setSavedParticipantId(participant.id);
        setNickname(participant.nickname);
        setHasJoined(true);
        storePlayer(participant.id, participant.nickname);
        setIsRestoring(false);
      },
    );
  };

  const submitAnswer = () => {
    if (!participantId || !answer.trim()) return;
    socket.emit("player:answer-submit", {
      roomId: DEFAULT_ROOM_ID,
      participantId,
      answer: answer.trim(),
    });
    setAnswer("");
  };

  const handleBuzzer = () => {
    if (!participantId) return;

    socket.emit("player:buzzer", { roomId: DEFAULT_ROOM_ID, participantId });
  };

  const currentTeam = state?.teams.find((team) =>
    team.memberIds.includes(participantId || ""),
  );
  const isIdleMode = !state || state.mode === "idle";
  const surveySubmitted = participantId
    ? Boolean(state?.teamSurvey.submissions[participantId])
    : false;
  const isBattleButtonEnabled =
    hasJoined && state?.mode === "buzzerBattle" && state.buzzerBattle.active;
  const isSurveyEnabled =
    hasJoined && state?.mode === "teamSurvey" && state.teamSurvey.active;
  const isSpeedQuizEnabled =
    hasJoined && state?.mode === "speedQuiz" && state.speedQuiz.buzzerActive;

  return (
    <Box
      component="main"
      sx={{
        minHeight: "100vh",
        display: "flex",
        py: isIdleMode ? { xs: 3, md: 5 } : 0,
        background:
          "radial-gradient(circle at top, rgba(93,214,192,0.12), transparent 30%), #10131a",
      }}
    >
      <Container
        maxWidth="sm"
        sx={{
          display: "flex",
          flex: 1,
          width: "100%",
          py: isIdleMode ? 0 : { xs: 3, md: 5 },
        }}
      >
        <Stack spacing={3} sx={{ flex: 1, width: "100%" }}>
          {isIdleMode ? (
            <PlayerJoinPanel
              nickname={nickname}
              hasJoined={hasJoined}
              isRestoring={isRestoring}
              savedParticipantId={savedParticipantId}
              currentTeam={currentTeam}
              joinedParticipant={joinedParticipant}
              onNicknameChange={setNickname}
              onJoin={join}
            />
          ) : (
            <PlayerGamePanel
              state={state}
              answer={answer}
              surveySubmitted={surveySubmitted}
              isBattleButtonEnabled={isBattleButtonEnabled}
              isSurveyEnabled={isSurveyEnabled}
              isSpeedQuizEnabled={isSpeedQuizEnabled}
              onAnswerChange={setAnswer}
              onSubmitAnswer={submitAnswer}
              onBuzzer={handleBuzzer}
            />
          )}
        </Stack>
      </Container>
    </Box>
  );
}
