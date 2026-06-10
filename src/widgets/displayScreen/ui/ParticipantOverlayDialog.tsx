import { Box, Dialog, DialogContent, Paper, Stack, Typography } from "@mui/material";
import type { Participant } from "@/shared/model/socket";

interface DisplayTeam {
  id: string;
  name: string;
  members: Participant[];
}

interface ParticipantOverlayDialogProps {
  open: boolean;
  groupedTeams: DisplayTeam[];
  connectedParticipants: Participant[];
}

export default function ParticipantOverlayDialog({
  open,
  groupedTeams,
  connectedParticipants,
}: ParticipantOverlayDialogProps) {
  return (
    <Dialog
      open={open}
      fullWidth
      maxWidth="lg"
      slotProps={{
        paper: {
          sx: {
            borderRadius: 2,
            background:
              "linear-gradient(180deg, rgba(24,29,41,0.98) 0%, rgba(16,19,26,0.98) 100%)",
            minHeight: { xs: "70vh", md: "78vh" },
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
              CURRENT PLAYERS
            </Typography>
            <Typography variant="h3">현재 참가자 목록</Typography>
          </Box>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "repeat(2, minmax(0, 1fr))",
                md: "repeat(4, minmax(0, 1fr))",
              },
              gap: 2,
            }}
          >
            {groupedTeams.length > 0
              ? groupedTeams.map((team) => (
                  <Paper
                    key={team.id}
                    variant="outlined"
                    sx={{
                      p: 3,
                      borderRadius: 2,
                      backgroundColor: "rgba(124,140,255,0.08)",
                    }}
                  >
                    <Stack spacing={2}>
                      <Typography
                        variant="h5"
                        sx={{ fontWeight: 800, textAlign: "center" }}
                      >
                        {team.name}
                      </Typography>
                      {team.members.map((participant) => (
                        <Paper
                          key={participant.id}
                          variant="outlined"
                          sx={{
                            p: 2,
                            borderRadius: 1.5,
                            textAlign: "center",
                            backgroundColor: "rgba(93,214,192,0.08)",
                          }}
                        >
                          <Typography variant="h6" sx={{ fontWeight: 700 }}>
                            {participant.nickname}
                          </Typography>
                        </Paper>
                      ))}
                    </Stack>
                  </Paper>
                ))
              : connectedParticipants.map((participant) => (
                  <Paper
                    key={participant.id}
                    variant="outlined"
                    sx={{
                      p: 3,
                      borderRadius: 2,
                      textAlign: "center",
                      backgroundColor: "rgba(124,140,255,0.08)",
                    }}
                  >
                    <Typography variant="h5" sx={{ fontWeight: 800 }}>
                      {participant.nickname}
                    </Typography>
                  </Paper>
                ))}
          </Box>
        </Stack>
      </DialogContent>
    </Dialog>
  );
}
