import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--bg)",
        foreground: "var(--text)",
        surface: "var(--bg-surface)",
        "surface-2": "var(--bg-surface-2)",
        accent: "var(--accent)",
        "accent-hover": "var(--accent-hover)",
        muted: "var(--text-muted)",
        border: "var(--border)",
      },
    },
  },
  plugins: [],
};
export default config;
