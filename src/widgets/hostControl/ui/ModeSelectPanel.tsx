import { Button, Paper, Stack, Typography } from "@mui/material";
import type { GameMode } from "@/shared/model/socket";

interface ModeOption {
  value: GameMode;
  label: string;
}

interface ModeSelectPanelProps {
  mode?: GameMode;
  options: ModeOption[];
  onModeSelect: (mode: GameMode) => void;
}

export default function ModeSelectPanel({
  mode,
  options,
  onModeSelect,
}: ModeSelectPanelProps) {
  return (
    <Paper sx={{ p: { xs: 3, md: 4 }, borderRadius: 2 }}>
      <Stack spacing={2.5}>
        <Typography variant="h5">모드 선택</Typography>
        <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
          {options.map((option) => (
            <Button
              key={option.value}
              variant={mode === option.value ? "contained" : "outlined"}
              onClick={() => onModeSelect(option.value)}
            >
              {option.label}
            </Button>
          ))}
        </Stack>
      </Stack>
    </Paper>
  );
}
