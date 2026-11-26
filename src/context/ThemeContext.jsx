import { createContext, useContext, useEffect, useState } from "react";

// eslint-disable-next-line react-refresh/only-export-components
export const THEMES = [
  {
    id: "emerald",
    name: "Emerald Haven",
    subtitle: "Organic luxury & forest sage",
    isDark: false,
    colors: {
      primary: "#244b38",
      accent: "#b18a57",
      bg: "#fcfbf8",
      card: "#ffffff",
      border: "#e9e5dc",
      badge: "🌿 Signature",
    },
    dotColors: ["#244b38", "#b18a57", "#fcfbf8"],
  },
  {
    id: "midnight",
    name: "Midnight Velvet",
    subtitle: "Obsidian dark & warm champagne gold",
    isDark: true,
    colors: {
      primary: "#22c55e",
      accent: "#fbbf24",
      bg: "#0b110e",
      card: "#131b16",
      border: "#223428",
      badge: "🌌 Deep Dark",
    },
    dotColors: ["#0b110e", "#22c55e", "#fbbf24"],
  },
  {
    id: "sapphire",
    name: "Oceanic Sapphire",
    subtitle: "Deep nautical navy & electric cyan",
    isDark: true,
    colors: {
      primary: "#0284c7",
      accent: "#38bdf8",
      bg: "#070e1c",
      card: "#0e1933",
      border: "#1e335e",
      badge: "🌊 Marine Luxury",
    },
    dotColors: ["#070e1c", "#0284c7", "#38bdf8"],
  },
  {
    id: "sunset",
    name: "Sunset Mirage",
    subtitle: "Warm terracotta, amber & desert glow",
    isDark: false,
    colors: {
      primary: "#c2410c",
      accent: "#d97706",
      bg: "#fcf6f0",
      card: "#ffffff",
      border: "#fad2bc",
      badge: "🌅 Golden Hour",
    },
    dotColors: ["#c2410c", "#d97706", "#fcf6f0"],
  },
  {
    id: "amethyst",
    name: "Amethyst Royale",
    subtitle: "Royal plum velvet & cyber violet glow",
    isDark: true,
    colors: {
      primary: "#9333ea",
      accent: "#f472b6",
      bg: "#0d0718",
      card: "#180f2b",
      border: "#38225c",
      badge: "🔮 Cyber Royale",
    },
    dotColors: ["#0d0718", "#9333ea", "#f472b6"],
  },
  {
    id: "nordic",
    name: "Nordic Cashmere",
    subtitle: "Warm stone, linen & architectural oat",
    isDark: false,
    colors: {
      primary: "#3d3229",
      accent: "#a67c52",
      bg: "#f6f4ee",
      card: "#ffffff",
      border: "#ded7c8",
      badge: "☕ Warm Minimal",
    },
    dotColors: ["#3d3229", "#a67c52", "#f6f4ee"],
  },
];

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [themeId, setThemeId] = useState(() => {
    const saved = localStorage.getItem("stayease-active-theme");
    if (saved && THEMES.some((t) => t.id === saved)) {
      return saved;
    }
    const legacy = localStorage.getItem("stayease-theme");
    if (legacy === "dark") return "midnight";
    return "emerald";
  });

  const currentTheme = THEMES.find((t) => t.id === themeId) || THEMES[0];
  const isDark = currentTheme.isDark;

  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;

    // Apply data-theme attribute on both html and body
    root.setAttribute("data-theme", themeId);
    body.setAttribute("data-theme", themeId);

    // Clean previous theme classes
    THEMES.forEach((t) => {
      root.classList.remove(`theme-${t.id}`);
      body.classList.remove(`theme-${t.id}`);
    });
    root.classList.add(`theme-${themeId}`);
    body.classList.add(`theme-${themeId}`);

    // Apply dark / dark-mode classes for complete backwards & framework compatibility
    root.classList.toggle("dark-mode", isDark);
    body.classList.toggle("dark-mode", isDark);
    root.classList.toggle("dark", isDark);
    body.classList.toggle("dark", isDark);

    localStorage.setItem("stayease-active-theme", themeId);
    localStorage.setItem("stayease-theme", isDark ? "dark" : "light");
  }, [themeId, isDark]);

  const setTheme = (id) => {
    if (THEMES.some((t) => t.id === id)) {
      setThemeId(id);
    }
  };

  const toggleDarkMode = () => {
    if (isDark) {
      setThemeId("emerald");
    } else {
      setThemeId("midnight");
    }
  };

  return (
    <ThemeContext.Provider
      value={{
        theme: themeId,
        currentTheme,
        setTheme,
        themes: THEMES,
        isDark,
        toggleDarkMode,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
