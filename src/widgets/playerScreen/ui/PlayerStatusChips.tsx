import { Chip, Stack } from "@mui/material";
import type { Participant, TeamConfig } from "@/shared/model/socket";

interface PlayerStatusChipsProps {
  nickname: string;
  hasJoined: boolean;
  currentTeam?: TeamConfig;
  joinedParticipant?: Participant;
}

export default function PlayerStatusChips({
  nickname,
  hasJoined,
  currentTeam,
  joinedParticipant,
}: PlayerStatusChipsProps) {
  if (!hasJoined) {
    return null;
  }

  return (
    <Stack direction="row" sx={{ flexWrap: "wrap", gap: 1 }}>
      <Chip label={`접속 완료: ${nickname}`} color="success" />
      {currentTeam && <Chip label={`소속 팀: ${currentTeam.name}`} color="secondary" />}
      {joinedParticipant && !joinedParticipant.connected && (
        <Chip label="현재 오프라인 상태" color="warning" />
      )}
    </Stack>
  );
}
