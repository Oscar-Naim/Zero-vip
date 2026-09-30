import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        void: "#050505",
        "void-card": "#090d16",
        "void-panel": "#0c1322",
        "void-border": "#172338",
        "void-border-bright": "#22395d",
        brand: {
          blue: "#2563FF",
          cyan: "#00D9FF",
          purple: "#7C3AED",
          emerald: "#10B981",
          rose: "#EF4444",
          amber: "#F59E0B",
        },
      },
      fontFamily: {
        mono: [
          "JetBrains Mono",
          "Fira Code",
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Monaco",
          "Consolas",
          "monospace",
        ],
        sans: [
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
      },
      backgroundImage: {
        "cyber-grid":
          "linear-gradient(to right, rgba(37, 99, 255, 0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(37, 99, 255, 0.05) 1px, transparent 1px)",
        "cyber-radial":
          "radial-gradient(circle at 50% 0%, rgba(0, 217, 255, 0.12) 0%, rgba(37, 99, 255, 0.04) 40%, transparent 70%)",
        "glow-purple":
          "radial-gradient(circle at 100% 100%, rgba(124, 58, 237, 0.1) 0%, transparent 50%)",
      },
      animation: {
        "pulse-slow": "pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "scan-line": "scanline 8s linear infinite",
        "glow-pulse": "glowPulse 3s ease-in-out infinite",
      },
      keyframes: {
        scanline: {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(1000%)" },
        },
        glowPulse: {
          "0%, 100%": { opacity: "0.4" },
          "50%": { opacity: "0.8" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
