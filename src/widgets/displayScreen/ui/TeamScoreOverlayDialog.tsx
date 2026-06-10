import {
  Box,
  Chip,
  Dialog,
  DialogContent,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import type { Participant } from "@/shared/model/socket";

interface RankedTeam {
  id: string;
  name: string;
  score: number;
  members: Participant[];
}

interface TeamScoreOverlayDialogProps {
  open: boolean;
  rankedTeams: RankedTeam[];
}

export default function TeamScoreOverlayDialog({
  open,
  rankedTeams,
}: TeamScoreOverlayDialogProps) {
  return (
    <Dialog
      open={open}
      fullWidth
      maxWidth="md"
      slotProps={{
        paper: {
          sx: {
            borderRadius: 2,
            background:
              "linear-gradient(180deg, rgba(24,29,41,0.98) 0%, rgba(16,19,26,0.98) 100%)",
          },
        },
      }}
    >
      <DialogContent sx={{ p: { xs: 3, md: 5 } }}>
        <Stack spacing={3}>
          <Box sx={{ textAlign: "center" }}>
            <Typography
              variant="overline"
              color="secondary.main"
              sx={{ fontWeight: 800 }}
            >
              TEAM SCOREBOARD
            </Typography>
            <Typography variant="h3">현재 팀 점수</Typography>
          </Box>

          {rankedTeams.length > 0 ? (
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" },
                gap: 2,
              }}
            >
              {rankedTeams.map((team, index) => (
                <Paper
                  key={team.id}
                  variant="outlined"
                  sx={{
                    p: 3,
                    borderRadius: 2,
                    textAlign: "center",
                    background:
                      index === 0
                        ? "linear-gradient(135deg, rgba(255,209,102,0.18) 0%, rgba(255,146,194,0.1) 100%)"
                        : "rgba(124,140,255,0.08)",
                  }}
                >
                  <Stack spacing={1.5} sx={{ alignItems: "center" }}>
                    <Chip
                      color={index === 0 ? "warning" : "default"}
                      label={`${index + 1}위`}
                    />
                    <Typography variant="h4" sx={{ fontWeight: 800 }}>
                      {team.name}
                    </Typography>
                    <Typography variant="h2" color="secondary.main">
                      {team.score}
                    </Typography>
                    <Typography color="text.secondary">
                      팀원 {team.members.length}명
                    </Typography>
                  </Stack>
                </Paper>
              ))}
            </Box>
          ) : (
            <Paper variant="outlined" sx={{ p: 4, borderRadius: 2, textAlign: "center" }}>
              <Typography color="text.secondary">
                아직 팀이 설정되지 않았습니다.
              </Typography>
            </Paper>
          )}
        </Stack>
      </DialogContent>
    </Dialog>
  );
}
