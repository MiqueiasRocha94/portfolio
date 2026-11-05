# Miqueias Rocha — portfólio

Código aberto do **portfólio público** de [miqueias-rocha.dev](https://miqueias-rocha.dev): a página
inicial, **Sobre mim** e o **chat** com o assistente.

Este repositório é um **espelho gerado automaticamente** a partir do projeto principal, que é privado. Ele
traz só a parte pública do site; o que existe do lado privado está descrito, sem detalhes técnicos, em
[PRIVADO.md](./PRIVADO.md).

| Branch | Origem |
| --- | --- |
| `main` | versão publicada atual |
| `oracle` | versão em preparo para a hospedagem própria |

Cada commit `sync: <branch>@<sha>` corresponde a um commit do projeto principal. Alterações feitas aqui são
sobrescritas na próxima sincronização: sugestões são bem-vindas como issue.

## Stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS 4 · i18n (pt-BR, en, es-ES) · tema claro/escuro.
O mesmo código do projeto principal também gera o app Android (Capacitor); aqui fica só a versão web.

## Rodar

Requer Node 22.

```bash
npm install
npm run dev
```

Abre em <http://localhost:3000>. Outros comandos: `npm run build`, `npm run start`, `npm run lint`,
`npm run typecheck`.

O chat precisa da URL de uma API de assistente em `NEXT_PUBLIC_CHATURL` (veja [.env.example](./.env.example));
sem ela, a página abre sem conexão.

## Licença

[MIT](./LICENSE).
