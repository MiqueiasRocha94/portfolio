import type { NextConfig } from "next";

const isMobileBuild = process.env.NEXT_BUILD_TARGET === "mobile";
// Build web de homologação/produção: `output: "standalone"` empacota um server
// Node mínimo (.next/standalone/server.js), usado pelo `npm run start` e pela
// imagem Docker. O alvo mobile usa `export`.
const useStandalone = process.env.NEXT_OUTPUT_STANDALONE === "true";
// Raiz do workspace (onde está o node_modules) quando o build roda numa cópia dos
// fontes dentro do projeto (scripts/build-target.mjs).
const buildRoot = process.env.NEXT_BUILD_ROOT;


const nextConfig: NextConfig = {
  devIndicators: { position: "bottom-left" },
  output: isMobileBuild ? "export" : useStandalone ? "standalone" : undefined,
  images: {
    unoptimized: isMobileBuild,
  },
  ...(buildRoot ? { outputFileTracingRoot: buildRoot, turbopack: { root: buildRoot } } : {}),
  // Source maps do navegador fora dos artefatos (docs/ferramentas-dev.md → "Fora dos artefatos").
  productionBrowserSourceMaps: false,
};

export default nextConfig;
