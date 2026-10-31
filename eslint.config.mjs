import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    ".reference/**",
    "public/pdf.worker.min.mjs",
    "public/excalidraw/**",
    "public/ocr/**",
    "test-results/**",
    "playwright-report/**",
    ".qa/**",
    "landing-gather/**",
    "src-tauri/target/**",
  ]),
]);

export default eslintConfig;
