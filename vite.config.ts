import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// GitHub Pages serves a project site from /<repo>/, so production assets need
// that prefix. Dev keeps the root base so http://localhost:5173 works as-is.
const GITHUB_PAGES_BASE = "/ClaudeCertifiedArchitect/";

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  base: command === "build" ? GITHUB_PAGES_BASE : "/",
  plugins: [react()],
}));
