import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // O espelho é gerado sem os trechos só de desenvolvimento do projeto principal:
    // variáveis reatribuídas só neles sobram como `let` (e alguns imports ficam sem uso).
    rules: { "prefer-const": "warn" },
  },
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts"]),
]);
