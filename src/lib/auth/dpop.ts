/**
 * DPoP (RFC 9449) — prova de posse do token, no portal web e no app.
 *
 * Um par ECDSA P-256 por instalação (navegador ou app), gerado com a chave
 * privada NÃO exportável (WebCrypto) e guardado no IndexedDB: o JS consegue
 * assinar, mas não ler a chave. A chave pública vai em toda prova; o backend
 * grava o thumbprint (`jkt`, RFC 7638) no token (`cnf.jkt`) e exige a prova.
 *
 * Limites: token copiado não serve fora desta instalação, mas um XSS ativo na
 * página consegue USAR a chave enquanto roda (CSP continua necessária). Limpar
 * os dados do site/app apaga a chave → próximo login = aparelho novo.
 *
 * Ponto de troca: no app a chave vive no storage do WebView (sandbox do app),
 * não em hardware. Um plugin de Keystore/Secure Enclave pode substituir
 * `carregarOuCriar` sem mudar o contrato — o backend só enxerga JWK + ES256.
 *
 * Sem contexto seguro (HTTP fora de localhost) o navegador não expõe
 * `crypto.subtle` e a prova falha.
 */

type JwkPublica = { kty: "EC"; crv: "P-256"; x: string; y: string };

type ParDpop = {
  /** Assinatura ES256 (r||s, IEEE P1363 — o formato JWS). */
  assinar: (dados: Uint8Array<ArrayBuffer>) => Promise<ArrayBuffer | Uint8Array>;
  jwk: JwkPublica;
  /** Thumbprint SHA-256 da JWK (RFC 7638) — identidade do aparelho no backend. */
  jkt: string;
};

const BANCO = "multiplataforma-base-auth";
const LOJA = "chaves";
const CHAVE_DPOP = "dpop";

const encoder = new TextEncoder();

function base64Url(bytes: ArrayBuffer | Uint8Array): string {
  const array = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let binario = "";
  for (const byte of array) {
    binario += String.fromCharCode(byte);
  }
  return btoa(binario).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlJson(valor: unknown): string {
  return base64Url(encoder.encode(JSON.stringify(valor)));
}

/** WebCrypto existe só em contexto seguro (HTTPS ou localhost). */
function exigirWebCrypto() {
  if (!globalThis.crypto?.subtle) {
    throw new Error("WebCrypto indisponível: a página precisa de HTTPS.");
  }
}

async function sha256Base64Url(texto: string): Promise<string> {
  const dados = encoder.encode(texto);
  exigirWebCrypto();
  return base64Url(await crypto.subtle.digest("SHA-256", dados));
}

/** `jti` da prova: 128 bits aleatorios. */
function idAleatorio(): string {
  return base64Url(crypto.getRandomValues(new Uint8Array(16)));
}

function abrirBanco(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const pedido = indexedDB.open(BANCO, 1);
    pedido.onupgradeneeded = () => pedido.result.createObjectStore(LOJA);
    pedido.onsuccess = () => resolve(pedido.result);
    pedido.onerror = () => reject(pedido.error);
  });
}

async function naLoja<T>(modo: IDBTransactionMode, operacao: (loja: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const banco = await abrirBanco();
  try {
    return await new Promise<T>((resolve, reject) => {
      const pedido = operacao(banco.transaction(LOJA, modo).objectStore(LOJA));
      pedido.onsuccess = () => resolve(pedido.result);
      pedido.onerror = () => reject(pedido.error);
    });
  } finally {
    banco.close();
  }
}

async function jktDe(jwk: JwkPublica): Promise<string> {
  // RFC 7638: membros obrigatórios em ordem lexicográfica, sem espaços.
  return sha256Base64Url(JSON.stringify({ crv: jwk.crv, kty: jwk.kty, x: jwk.x, y: jwk.y }));
}


async function carregarOuCriar(): Promise<ParDpop> {
  exigirWebCrypto();
  let par = await naLoja<CryptoKeyPair | undefined>("readonly", (loja) => loja.get(CHAVE_DPOP));
  if (!par) {
    // `extractable: false` vale para a privada; a pública é sempre exportável.
    par = await crypto.subtle.generateKey({ name: "ECDSA", namedCurve: "P-256" }, false, ["sign", "verify"]);
    const novo = par;
    await naLoja("readwrite", (loja) => loja.put(novo, CHAVE_DPOP));
  }

  const { x, y } = await crypto.subtle.exportKey("jwk", par.publicKey);
  const jwk: JwkPublica = { kty: "EC", crv: "P-256", x: x ?? "", y: y ?? "" };
  const { privateKey } = par;
  return {
    assinar: (dados) => crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, privateKey, dados),
    jwk,
    jkt: await jktDe(jwk),
  };
}

let parEmCarga: Promise<ParDpop> | null = null;

function obterPar(): Promise<ParDpop> {
  parEmCarga ??= carregarOuCriar().catch((erro: unknown) => {
    parEmCarga = null;
    throw erro;
  });
  return parEmCarga;
}

/** Thumbprint da chave desta instalação (usado como `requestHash` do atestado). */
export async function obterJktDpop(): Promise<string> {
  return (await obterPar()).jkt;
}

/** `htu` = URL sem query nem fragmento. */
function normalizarHtu(url: string): string {
  const alvo = new URL(url, window.location.origin);
  return `${alvo.origin}${alvo.pathname}`;
}

/**
 * Prova DPoP de UMA requisição (header `DPoP`). `token` presente → claim `ath`
 * (hash do access token); `nonce` = último `DPoP-Nonce` recebido do servidor.
 */
export async function criarProvaDpop(metodo: string, url: string, opcoes: { token?: string; nonce?: string } = {}) {
  const par = await obterPar();
  const cabecalho = { typ: "dpop+jwt", alg: "ES256", jwk: par.jwk };
  const corpo = {
    jti: idAleatorio(),
    htm: metodo.toUpperCase(),
    htu: normalizarHtu(url),
    iat: Math.floor(Date.now() / 1000),
    ...(opcoes.token ? { ath: await sha256Base64Url(opcoes.token) } : {}),
    ...(opcoes.nonce ? { nonce: opcoes.nonce } : {}),
  };
  const entrada = `${base64UrlJson(cabecalho)}.${base64UrlJson(corpo)}`;
  const assinatura = await par.assinar(encoder.encode(entrada));
  return `${entrada}.${base64Url(assinatura)}`;
}

/** Token vinculado (claim `cnf.jkt`) → esquema `DPoP`; senão `Bearer`. Só lê, não valida. */
export function tokenVinculado(token: string): boolean {
  const payload = token.split(".")[1];
  if (!payload) {
    return false;
  }
  try {
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    const claims = JSON.parse(json) as { cnf?: { jkt?: unknown } };
    return typeof claims.cnf?.jkt === "string";
  } catch {
    return false;
  }
}
