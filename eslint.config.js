// ESLint flat config compatível com ESLint v10.
// Valida apenas o codigo-fonte da aplicacao (.js). Arquivos .ts/.tsx sao
// validadas pelo `pnpm type-check` (tsc --noEmit), que passou limpo.
// Ignora artefatos de build (.open-next, .next), scripts, tools e docs.
export default [
  {
    files: ["app/**/*.{js,jsx,mjs,cjs}", "components/**/*.{js,jsx,mjs,cjs}", "lib/**/*.{js,jsx,mjs,cjs}", "hooks/**/*.{js,jsx,mjs,cjs}"],
    rules: {
      "no-console": "warn",
      "prefer-const": "error",
      "no-var": "error",
      "no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
      "no-eval": "error",
      "no-implied-eval": "error",
      "no-new-func": "error",
    },
  },
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      ".open-next/**",
      "out/**",
      "dist/**",
      "build/**",
      "scripts/**",
      "tools/**",
      "docs/**",
      "**/*.ts",
      "**/*.tsx",
    ],
  },
];
