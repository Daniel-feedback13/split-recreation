import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#7c8cff",
    },
    secondary: {
      main: "#5dd6c0",
    },
    error: {
      main: "#ff6b6b",
    },
    background: {
      default: "#10131a",
      paper: "#181d29",
    },
  },
  shape: {
    borderRadius: 8,
  },
  typography: {
    fontFamily: '"Pretendard", "Noto Sans KR", "Segoe UI", sans-serif',
    h1: {
      fontWeight: 800,
      lineHeight: 1.1,
    },
    h2: {
      fontWeight: 700,
    },
    button: {
      fontWeight: 700,
      textTransform: "none",
    },
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
        },
      },
    },
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          borderRadius: 8,
          minHeight: 44,
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        fullWidth: true,
        size: "medium",
      },
    },
  },
});

export default theme;
