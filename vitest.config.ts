import "vitest/config";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    coverage: {
      include: ["src"],
      exclude: ["src/mock", "src/demo"],
      provider: "v8",
      reporter: ["html", "lcov", "clover"],
    },
  },
});
