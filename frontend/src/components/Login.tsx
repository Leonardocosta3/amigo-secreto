
import { useState, type FormEvent } from "react";
import { Gift, LockKeyhole, Mail, LogIn } from "lucide-react";

import { apiFetch, salvarToken } from "../services/api";

export interface Usuario {
  id: number;
  nome: string;
  email: string;
}

interface LoginProps {
  onLogin: (usuario: Usuario) => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");

  async function entrar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setErro("");
    setCarregando(true);

    try {
      const resultado = await apiFetch("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email: email.trim(),
          senha
        })
      });

      if (!resultado.token || !resultado.usuario) {
        throw new Error("Resposta de login inválida.");
      }

      salvarToken(resultado.token);
      onLogin(resultado.usuario);

    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível entrar."
      );
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <Gift size={32} />
        </div>

        <h1>Amigo Secreto</h1>
        <p>Entre para organizar seus sorteios.</p>

        <form onSubmit={entrar}>
          <label htmlFor="email">E-mail</label>

          <div className="login-input">
            <Mail size={19} />
            <input
              id="email"
              type="email"
              placeholder="seuemail@exemplo.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </div>

          <label htmlFor="senha">Senha</label>

          <div className="login-input">
            <LockKeyhole size={19} />
            <input
              id="senha"
              type="password"
              placeholder="Digite sua senha"
              value={senha}
              onChange={e => setSenha(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>

          {erro && (
            <p className="login-error">{erro}</p>
          )}

          <button
            className="login-button"
            type="submit"
            disabled={carregando}
          >
            <LogIn size={19} />
            {carregando ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}
