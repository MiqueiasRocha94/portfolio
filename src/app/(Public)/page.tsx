import { AppStart } from "@/components/app-start";
import { PortfolioHome } from "@/components/portfolio/portfolio-home";

/**
 * `/` na web: home do portfólio público (docs/specs/portfolio-publico.md).
 * `/` no app (build mobile): tela de abertura, sem home (docs/specs/portal-privado.md → "App (APK)").
 */
export default function Page() {
  return process.env.NEXT_PUBLIC_BUILD_TARGET === "mobile" ? <AppStart /> : <PortfolioHome />;
}
