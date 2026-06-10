import Link from "next/link";
import { Box, Button, Container, Paper, Stack, Typography } from "@mui/material";

export default function HomePage() {
  return (
    <Box
      component="main"
      sx={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        px: 2,
        py: 4,
        background:
          "radial-gradient(circle at top, rgba(124,140,255,0.22), transparent 35%), #10131a",
      }}
    >
      <Container maxWidth="md">
        <Paper sx={{ p: { xs: 3, md: 5 }, borderRadius: 2 }}>
          <Stack spacing={3} sx={{ alignItems: "center", textAlign: "center" }}>
            <Typography variant="overline" color="primary.main" sx={{ fontWeight: 800 }}>
              Realtime Recreation Scaffold
            </Typography>
            <Typography variant="h2">펜션 레크리에이션 운영 페이지</Typography>
            <Typography color="text.secondary">
              빔 화면, 사회자 화면, 참가자 스마트폰 화면을 나눠 실시간 이벤트를 테스트할
              수 있습니다.
            </Typography>
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={2}
              sx={{ width: "100%" }}
            >
              <Button component={Link} href="/display" variant="contained" fullWidth>
                Display
              </Button>
              <Button component={Link} href="/host" variant="contained" fullWidth>
                Host
              </Button>
              <Button component={Link} href="/player" variant="outlined" fullWidth>
                Player
              </Button>
            </Stack>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
}
