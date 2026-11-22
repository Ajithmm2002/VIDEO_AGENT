import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "node",
    include: ["lib/**/*.test.ts"],
  },
  plugins: [
    {
      name: "md-as-string",
      transform(code, id) {
        if (!id.endsWith(".md")) return;
        return { code: `export default ${JSON.stringify(code)};`, map: null };
      },
    },
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});
