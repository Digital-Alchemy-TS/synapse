import "vitest/config";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    exclude: ["dist/**", "node_modules/**", "**/node_modules/**"],
    coverage: {
      include: ["src"],
      exclude: ["src/mock", "src/demo", "dist"],
      provider: "v8",
      reporter: ["html", "lcov", "clover", "text"],
    },
  },
});
