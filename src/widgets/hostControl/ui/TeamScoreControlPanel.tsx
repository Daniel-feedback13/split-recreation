import {
  Box,
  Button,
  Card,
  CardContent,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import type { TeamConfig } from "@/shared/model/socket";

interface TeamScoreControlPanelProps {
  teams: TeamConfig[];
  onScoreAdjust: (teamId: string, delta: number) => void;
  onScoreChange: (teamId: string, nextScore: number) => void;
}

export default function TeamScoreControlPanel({
  teams,
  onScoreAdjust,
  onScoreChange,
}: TeamScoreControlPanelProps) {
  return (
    <Paper sx={{ p: { xs: 3, md: 4 }, borderRadius: 2 }}>
      <Stack spacing={2.5}>
        <Typography variant="h5">팀 점수 제어</Typography>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              md: "repeat(2, minmax(0, 1fr))",
              xl: "repeat(3, minmax(0, 1fr))",
            },
            gap: 2,
          }}
        >
          {teams.map((team, index) => (
            <Card key={team.id} variant="outlined">
              <CardContent>
                <Stack spacing={2.5}>
                  <Box>
                    <Typography variant="h6">
                      {team.name || `Team ${index + 1}`}
                    </Typography>
                    <Typography color="text.secondary">현재 점수</Typography>
                  </Box>

                  <Typography variant="h3" color="secondary.main">
                    {team.score ?? 0}
                  </Typography>

                  <Stack direction="row" spacing={1.5}>
                    <Button
                      variant="outlined"
                      color="error"
                      onClick={() => onScoreAdjust(team.id, -1)}
                    >
                      -1
                    </Button>
                    <Button variant="contained" onClick={() => onScoreAdjust(team.id, 1)}>
                      +1
                    </Button>
                  </Stack>

                  <TextField
                    type="number"
                    label="점수 직접 입력"
                    value={team.score ?? 0}
                    onChange={(event) =>
                      onScoreChange(team.id, Number(event.target.value))
                    }
                  />
                </Stack>
              </CardContent>
            </Card>
          ))}
        </Box>
      </Stack>
    </Paper>
  );
}
