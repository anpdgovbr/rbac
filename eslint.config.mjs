import eslint from "@eslint/js"
import typescriptPlugin from "@typescript-eslint/eslint-plugin"
import typescriptParser from "@typescript-eslint/parser"
import reactHooksPlugin from "eslint-plugin-react-hooks"

export default [
  { ignores: ["**/node_modules/**", "**/dist/**", "**/*.d.ts"] },
  eslint.configs.recommended,
  {
    files: ["**/*.{js,mjs,cjs,ts,tsx}"],
    plugins: {
      "@typescript-eslint": typescriptPlugin,
      "react-hooks": reactHooksPlugin,
    },
    languageOptions: {
      parser: typescriptParser,
      parserOptions: { ecmaVersion: "latest", sourceType: "module" },
      globals: {
        console: "readonly",
        fetch: "readonly",
        Request: "readonly",
        Response: "readonly",
        React: "readonly",
        HTMLInputElement: "readonly",
        HTMLSelectElement: "readonly",
        window: "readonly",
        document: "readonly",
      },
    },
    rules: {
      ...reactHooksPlugin.configs.recommended.rules,
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_", ignoreRestSiblings: true },
      ],
      "@typescript-eslint/consistent-type-imports": "warn",
      "@typescript-eslint/no-explicit-any": "warn",
      "no-console": ["warn", { allow: ["warn", "error"] }],
    },
  },
]
