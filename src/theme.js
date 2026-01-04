import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    mode: "light",
    background: { default: "#F5F7FB", paper: "#FFFFFF" },
    text: { primary: "#0F172A", secondary: "rgba(15,23,42,0.62)" },
    divider: "rgba(15,23,42,0.08)",
    primary: { main: "#2563EB" },
    success: { main: "#16A34A" },
  },

  // ✅ less rounded
  shape: { borderRadius: 16 },

  // ✅ compact typography (admin density)
  typography: {
    fontFamily: '"Plus Jakarta Sans", system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif',
    fontSize: 14, // base = 14px (common in admin UIs)

    h2: { fontSize: 38, fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.12 },
    h4: { fontSize: 22, fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1.2 },
    h5: { fontSize: 18, fontWeight: 800, letterSpacing: "-0.01em", lineHeight: 1.25 },

    body1: { fontSize: 15, fontWeight: 500, lineHeight: 1.6 },
    body2: { fontSize: 14, fontWeight: 600, lineHeight: 1.45 },

    button: { textTransform: "none", fontWeight: 800, fontSize: 14 },
  },

  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 18,
          border: "1px solid rgba(15,23,42,0.06)",
          boxShadow: "0 12px 26px rgba(15,23,42,0.08)",
        },
      },
    },

    MuiButton: {
      styleOverrides: {
        root: {
          height: 42,
          borderRadius: 999,
          paddingLeft: 14,
          paddingRight: 14,
        },
      },
    },

    MuiChip: {
      styleOverrides: {
        root: { borderRadius: 999, fontWeight: 700 },
      },
    },
  },
});

export default theme;
