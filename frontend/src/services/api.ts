
export const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3001";

const TOKEN_KEY = "amigo_secreto_token";

// Salvar token após o login
export function salvarToken(token: string): void {
  sessionStorage.setItem(TOKEN_KEY, token);
}

// Recuperar token armazenado
export function obterToken(): string | null {
  return sessionStorage.getItem(TOKEN_KEY);
}

// Remover token ao sair
export function removerToken(): void {
  sessionStorage.removeItem(TOKEN_KEY);
}

// Realizar requisições autenticadas
export async function apiFetch(
  caminho: string,
  options: RequestInit = {}
) {
  const token = obterToken();

  const headers = new Headers(options.headers);

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  if (options.body && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  const resposta = await fetch(`${API_URL}${caminho}`, {
    ...options,
    headers
  });

  if (!resposta.ok) {
    const dados = await resposta.json().catch(() => ({}));

    throw new Error(
      dados.erro || `Erro HTTP ${resposta.status}`
    );
  }

  if (resposta.status === 204) {
    return null;
  }

  const texto = await resposta.text();

  return texto ? JSON.parse(texto) : null;
}
