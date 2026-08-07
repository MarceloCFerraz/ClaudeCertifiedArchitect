/** Every color resolves to a CSS variable, so one class works in both themes:
    `:root` holds the light values and `.dark` the dark ones (see src/index.css).
    The `<alpha-value>` placeholder keeps opacity modifiers (`bg-foreground/10`) working. */
const token = (name) => `hsl(var(--${name}) / <alpha-value>)`;

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "selector",
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: token("background"),
        card: token("card"),
        muted: token("muted"),
        secondary: token("secondary"),
        foreground: {
          DEFAULT: token("foreground"),
          muted: token("foreground-muted"),
          subtle: token("foreground-subtle"),
          faint: token("foreground-faint"),
          disabled: token("foreground-disabled"),
        },
        border: {
          DEFAULT: token("border"),
          strong: token("border-strong"),
          subtle: token("border-subtle"),
          hover: token("border-hover"),
          "hover-strong": token("border-hover-strong"),
        },
        primary: {
          DEFAULT: token("primary"),
          foreground: token("primary-foreground"),
          hover: token("primary-hover"),
          // Primary inverts between themes, so accents sitting on it must invert too.
          accent: token("primary-accent"),
        },
        // The exam HUD is dark chrome in both themes; only its surface needs to shift
        // so it stays distinguishable from an already-dark page.
        hud: {
          DEFAULT: token("hud"),
          line: token("hud-line"),
        },
        brand: {
          DEFAULT: token("brand"),
          vivid: token("brand-vivid"),
          bright: token("brand-bright"),
          surface: token("brand-surface"),
          "surface-hover": token("brand-surface-hover"),
          border: token("brand-border"),
          "on-surface": token("brand-on-surface"),
          "on-surface-muted": token("brand-on-surface-muted"),
        },
        success: {
          DEFAULT: token("success"),
          strong: token("success-strong"),
          "strong-hover": token("success-strong-hover"),
          surface: token("success-surface"),
          border: token("success-border"),
          "border-subtle": token("success-border-subtle"),
          text: token("success-text"),
        },
        destructive: {
          DEFAULT: token("destructive"),
          surface: token("destructive-surface"),
          border: token("destructive-border"),
          "border-subtle": token("destructive-border-subtle"),
          text: token("destructive-text"),
        },
      },
    },
  },
  plugins: [],
};
