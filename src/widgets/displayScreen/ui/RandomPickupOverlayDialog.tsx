import {
  Box,
  Chip,
  Dialog,
  DialogContent,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import type { Participant, RandomPickupState } from "@/shared/model/socket";

interface RandomPickupOverlayDialogProps {
  open: boolean;
  randomPickup: RandomPickupState;
  participants: Participant[];
}

export default function RandomPickupOverlayDialog({
  open,
  randomPickup,
  participants,
}: RandomPickupOverlayDialogProps) {
  const pickupEntries = randomPickup.participantIds.map((participantId, index) => ({
    slotNumber: index + 1,
    participantId,
    participant: participants.find((item) => item.id === participantId),
    isSelected: randomPickup.selectedParticipantId === participantId,
  }));

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
              RANDOM PICKUP
            </Typography>
            <Typography variant="h3">무작위 참가자 픽업</Typography>
          </Box>

          {pickupEntries.length > 0 ? (
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "repeat(2, minmax(0, 1fr))",
                  md: "repeat(4, minmax(0, 1fr))",
                  xl: "repeat(5, minmax(0, 1fr))",
                },
                gap: 2,
              }}
            >
              {pickupEntries.map((entry) => (
                <Paper
                  key={entry.participantId}
                  variant="outlined"
                  sx={{
                    p: 3,
                    borderRadius: 2,
                    minHeight: 132,
                    display: "grid",
                    placeItems: "center",
                    textAlign: "center",
                    borderColor: entry.isSelected
                      ? "secondary.main"
                      : "rgba(255,255,255,0.12)",
                    background: entry.isSelected
                      ? "linear-gradient(135deg, rgba(255,209,102,0.18) 0%, rgba(93,214,192,0.14) 100%)"
                      : "rgba(124,140,255,0.08)",
                  }}
                >
                  <Stack spacing={1.25} sx={{ alignItems: "center" }}>
                    <Chip
                      color={entry.isSelected ? "secondary" : "default"}
                      label={`${entry.slotNumber}번`}
                    />
                    <Typography variant="h4" sx={{ fontWeight: 800 }}>
                      {randomPickup.revealNames
                        ? (entry.participant?.nickname ?? "알 수 없음")
                        : entry.slotNumber}
                    </Typography>
                    {entry.isSelected && (
                      <Typography color="text.secondary">
                        {randomPickup.revealNames ? "선택된 참가자" : "선택된 번호"}
                      </Typography>
                    )}
                  </Stack>
                </Paper>
              ))}
            </Box>
          ) : (
            <Paper variant="outlined" sx={{ p: 4, borderRadius: 2, textAlign: "center" }}>
              <Typography color="text.secondary">
                아직 픽업 리스트가 생성되지 않았습니다.
              </Typography>
            </Paper>
          )}
        </Stack>
      </DialogContent>
    </Dialog>
  );
}
