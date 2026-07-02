import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// base must match the GitHub repo name so assets resolve at
// https://calvintirrell.github.io/couldve-been-an-email/
export default defineConfig({
  base: "/couldve-been-an-email/",
  plugins: [react(), tailwindcss()],
  test: {
    environment: "jsdom",
    setupFiles: "./src/test/setup.js",
  },
});
