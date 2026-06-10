import { Alert, Box, Button, Paper, Stack, TextField, Typography } from "@mui/material";
import PlayerStatusChips from "./PlayerStatusChips";
import type { Participant, TeamConfig } from "@/shared/model/socket";

interface SubmitEventLike {
  preventDefault: () => void;
}

interface PlayerJoinPanelProps {
  nickname: string;
  hasJoined: boolean;
  isRestoring: boolean;
  savedParticipantId?: string;
  currentTeam?: TeamConfig;
  joinedParticipant?: Participant;
  onNicknameChange: (nickname: string) => void;
  onJoin: (event: SubmitEventLike) => void;
}

export default function PlayerJoinPanel({
  nickname,
  hasJoined,
  isRestoring,
  savedParticipantId,
  currentTeam,
  joinedParticipant,
  onNicknameChange,
  onJoin,
}: PlayerJoinPanelProps) {
  return (
    <Paper sx={{ p: { xs: 3, md: 4 }, borderRadius: 2 }}>
      <Stack spacing={3} component="form" onSubmit={onJoin}>
        <Box>
          <Typography variant="overline" color="primary.main" sx={{ fontWeight: 800 }}>
            PLAYER
          </Typography>
          <Typography variant="h4">참가자 화면</Typography>
        </Box>

        <TextField
          label="닉네임"
          value={nickname}
          onChange={(event) => onNicknameChange(event.target.value)}
          disabled={hasJoined || isRestoring}
          placeholder="닉네임 입력"
        />

        {!hasJoined && !isRestoring && (
          <Button type="submit" variant="contained" size="large">
            입장
          </Button>
        )}

        {isRestoring && savedParticipantId && (
          <Alert severity="info">저장된 참가 정보로 재접속 중...</Alert>
        )}

        <PlayerStatusChips
          nickname={nickname}
          hasJoined={hasJoined}
          currentTeam={currentTeam}
          joinedParticipant={joinedParticipant}
        />
      </Stack>
    </Paper>
  );
}
