import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./hooks/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#0A0A0F",
          900: "#13131A",
          800: "#1B1B24",
        },
        line: "rgba(255,255,255,0.08)",
        chalk: "#F5F5F0",
        mute: "#9C9CA8",
        gain: "#34D399",
        loss: "#F87171",
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "ui-monospace", "monospace"],
      },
      keyframes: {
        "aurora-drift": {
          "0%, 100%": { transform: "translate3d(0,0,0) rotate(0deg)" },
          "50%": { transform: "translate3d(-8%,-4%,0) rotate(8deg)" },
        },
        "pulse-gain": {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(52,211,153,0.0)" },
          "50%": { boxShadow: "0 0 0 12px rgba(52,211,153,0.35)" },
        },
        "pulse-loss": {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(248,113,113,0.0)" },
          "50%": { boxShadow: "0 0 0 12px rgba(248,113,113,0.35)" },
        },
        marquee: {
          "0%": { transform: "translateX(0%)" },
          "100%": { transform: "translateX(-50%)" },
        },
      },
      animation: {
        "aurora-drift": "aurora-drift 22s ease-in-out infinite",
        "pulse-gain": "pulse-gain 1.4s ease-out 3",
        "pulse-loss": "pulse-loss 1.4s ease-out 3",
        marquee: "marquee 50s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
