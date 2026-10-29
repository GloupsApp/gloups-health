// Canonical source: GloupsApp/gloups design/colors.ts at 5b708f6e378f2aea6cbfc164718110da4f625ae4.
export const gloupsColors = {
  bodyGray: "#747679",
  charcoal: "#1f2025",
  cloudCard: "#ebf0f8",
  coralSignal: "#ffab94",
  heroSky: "#d2e5ff",
  ink: "#222326",
  metricBlue: "#415eee",
  paperWarm: "#fff9ee",
  paperWhite: "#ffffff",
  recoveryGreen: "#31ce01",
  signalGold: "#ffca00",
  sleepLilac: "#b9a6ff",
};

export const gloupsThemes = {
  dark: {
    accent: "#f2f4fa",
    accentSurface: "#282c39",
    background: "#16171c",
    border: "#3a3e4b",
    carbs: gloupsColors.signalGold,
    danger: "#ffb4aa",
    fats: "#cbbdff",
    ink: "#f7f8fc",
    muted: "#aeb3c1",
    protein: "#91a5ff",
    surface: "#22242c",
  },
  light: {
    accent: gloupsColors.charcoal,
    accentSurface: gloupsColors.cloudCard,
    background: gloupsColors.paperWhite,
    border: "#e1e5ef",
    carbs: gloupsColors.signalGold,
    danger: "#b32635",
    fats: gloupsColors.sleepLilac,
    ink: gloupsColors.ink,
    // A little darker than Body Gray to keep supporting text readable on Cloud Card.
    muted: "#626773",
    protein: gloupsColors.metricBlue,
    surface: "#f6f7fb",
  },
};
