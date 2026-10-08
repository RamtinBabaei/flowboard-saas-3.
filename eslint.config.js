import eslint from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import tseslint from "typescript-eslint";
export default tseslint.config({
  ignores: ["dist", "node_modules"],
  extends: [eslint.configs.recommended, ...tseslint.configs.recommended],
  files: ["src/**/*.{ts,tsx}", "tests/**/*.{ts,tsx}"],
  languageOptions: {
    globals: { ...globals.browser, ...globals.node },
    parserOptions: { project: "./tsconfig.app.json" },
  },
  plugins: { "react-hooks": reactHooks },
  rules: {
    "react-hooks/rules-of-hooks": "error",
    "react-hooks/exhaustive-deps": "warn",
    "@typescript-eslint/no-unused-vars": [
      "error",
      { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
    ],
  },
});
