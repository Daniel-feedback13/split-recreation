"use client";

import { CssBaseline, ThemeProvider } from "@mui/material";
import theme from "@/theme/theme";
import type { PropsWithChildren } from "react";

export default function AppThemeProvider({ children }: PropsWithChildren) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}
