
import { API_URL } from "./api";

const CHAVE_SESSAO = "amigo_secreto_participante_token";

export interface DadosConvite {
  eventoId: number;
  evento: string;
  participante: string;
  cadastrado: boolean;
}

export interface DadosResultado {
  evento: string;
  dataEvento: string | null;
  participante: string;
  sorteado: string;
}

export interface RespostaLogin {
  mensagem: string;
  participante: string;
  token: string;
}

export function salvarSessaoParticipante(token: string) {
  sessionStorage.setItem(CHAVE_SESSAO, token);
}

export function obterSessaoParticipante(): string | null {
  return sessionStorage.getItem(CHAVE_SESSAO);
}

export function sairParticipante() {
  sessionStorage.removeItem(CHAVE_SESSAO);
}

export async function participanteFetch<T>(
  caminho: string,
  options: RequestInit = {}
): Promise<T> {
  const headers = new Headers(options.headers);

  headers.set("Accept", "application/json");

  if (options.body && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  const token = obterSessaoParticipante();

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const resposta = await fetch(`${API_URL}${caminho}`, {
    ...options,
    headers,
    cache: "no-store",
    referrerPolicy: "no-referrer"
  });

  const dados = await resposta.json().catch(() => null);

  if (!resposta.ok) {
    throw new Error(
      dados?.erro ?? `Erro HTTP ${resposta.status}`
    );
  }

  return dados as T;
}
