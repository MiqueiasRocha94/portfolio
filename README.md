# Miqueias Rocha

![Next.js](https://img.shields.io/badge/framework-next.js_16.4-000000)
![React](https://img.shields.io/badge/ui-react_19.2-61DAFB)
![Capacitor](https://img.shields.io/badge/mobile-capacitor_8-119EFF)
![TypeScript](https://img.shields.io/badge/language-typescript_5-3178C6)
![Tailwind](https://img.shields.io/badge/style-tailwindcss_4-38BDF8)
![Cloudflare](https://img.shields.io/badge/deploy-cloudflare_workers-F38020)
![Node.js](https://img.shields.io/badge/node-%3E%3D22-5FA04E)

Site pessoal de Miqueias Rocha com duas faces no mesmo código: o **portfólio público** (apresentação, trajetória,
tecnologias e assistente de chat) e o **portal privado** (operação da infraestrutura pessoal). Derivado da
[`multplataforma-base`](https://github.com/MiqueiasRocha94/Base-Multiplataforma): mesma arquitetura de shell
adaptativo, web (Cloudflare Workers e Docker) e APK via Capacitor.

Este repositório é o **espelho público**, gerado automaticamente a partir do projeto principal (privado): traz só o
portfólio público. O que existe do lado privado está descrito, sem detalhes técnicos, em [PRIVADO.md](./PRIVADO.md).

| Branch | Origem |
| --- | --- |
| `main` | versão publicada atual |
| `oracle` | versão em preparo para a hospedagem própria |

Cada commit `sync: <branch>@<sha>` corresponde a um commit do projeto principal; alterações feitas aqui são
sobrescritas na próxima sincronização. Sugestões são bem-vindas como issue.

> Código em inglês, documentação em pt-BR.

## 1. Requisitos

- Node.js **>= 22** (`.nvmrc`) e npm

## 2. Início rápido

```bash
npm install
cp .env.example .env
npm run dev          # http://localhost:3000
```

O chat precisa da URL de uma API de assistente em `NEXT_PUBLIC_CHATURL` (`.env.example`); sem ela, a página abre
sem conexão.

## 3. Estrutura do projeto

```text
src/app/                 rotas finas: (Public) = portfólio
src/components/          telas por módulo; ui/ = design system; layout/ = malha física
src/contexts/            providers globais (System, Device, Theme, Brand, Language, Navigation)
src/config/              configuração estática (marca, páginas publicadas)
src/services/            chamadas a APIs
src/lib/ src/hooks/      helpers, plataforma, navegação; hooks compartilhados
src/styles/ src/types/   estilos globais e tipos compartilhados
public/                  estáticos, locales, marcas (miqueias)
```

## 4. Verificações antes de concluir

```bash
npm run typecheck && npm run lint && npm run build
```

## 5. Ambientes e build

| Alvo | Comando | Saída |
| --- | --- | --- |
| web (dev) | `npm run dev` | servidor local |
| web (produção) | `npm run build` + `npm run start` | `.next/` + servidor Node |

O app Android (Capacitor), a publicação no Cloudflare Workers e os builds em Docker ficam no projeto principal.

## Licença

[MIT](./LICENSE).
